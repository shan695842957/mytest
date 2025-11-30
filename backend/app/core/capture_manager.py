"""
抓包任务管理器

负责管理tcpdump进程的启动、监控、停止
"""
import subprocess
import asyncio
import os
import psutil
from typing import Dict, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.capture import CaptureTask
from app.config import settings
from app.database import AsyncSessionLocal


class CaptureManager:
    """
    抓包任务管理器（单例）
    
    职责：
    1. 启动tcpdump进程
    2. 监控进程状态
    3. 自动停止超时任务
    4. 管理进程生命周期
    """
    
    MAX_CONCURRENT = 5  # 最大并发任务数
    CAPTURE_DIR = "./captures"  # 抓包文件存储目录
    
    def __init__(self):
        """初始化管理器"""
        self.running_tasks: Dict[int, subprocess.Popen] = {}
        
        # 确保存储目录存在
        os.makedirs(self.CAPTURE_DIR, exist_ok=True)
    
    async def start_capture(
        self,
        task_id: int,
        interface: str,
        filter_expr: Optional[str],
        duration: int,
        packet_count: Optional[int] = None
    ) -> int:
        """
        启动抓包任务（非阻塞）
        
        Args:
            task_id: 任务ID
            interface: 网络接口
            filter_expr: 过滤表达式
            duration: 持续时间（秒）
            packet_count: 最大抓包数量
        
        Returns:
            int: 进程PID
        
        Raises:
            ValueError: 并发任务数超限
            RuntimeError: 启动失败
        
        注意：此方法应该在后台任务中调用，会创建自己的数据库会话
        """
        # 1. 检查并发限制
        if len(self.running_tasks) >= self.MAX_CONCURRENT:
            raise ValueError(f"最多同时运行{self.MAX_CONCURRENT}个任务")
        
        # 2. 构建tcpdump命令
        output_file = os.path.join(self.CAPTURE_DIR, f"{task_id}.pcap")
        cmd = [
            'tcpdump',
            '-i', interface,
            '-w', output_file,
            '-U',  # 立即写入文件（不缓冲）
        ]
        
        # 添加过滤表达式
        if filter_expr:
            # 安全处理：直接添加，不使用shell
            cmd.extend(filter_expr.split())
        
        # 添加包数量限制
        if packet_count:
            cmd.extend(['-c', str(packet_count)])
        
        try:
            # 3. 启动进程（关键：非阻塞）
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                # 重要：不使用shell=True，防止命令注入
            )
            
            # 4. 存储进程对象
            self.running_tasks[task_id] = process
            
            # 5. 更新数据库状态（创建独立的数据库会话）
            async with AsyncSessionLocal() as db:
                await db.execute(
                    update(CaptureTask)
                    .where(CaptureTask.id == task_id)
                    .values(
                        status='running',
                        pid=process.pid,
                        started_at=datetime.now()
                    )
                )
                await db.commit()
            
            # 6. 启动监控协程（后台运行，不阻塞）
            asyncio.create_task(
                self._monitor_task(task_id, process, duration, output_file)
            )
            
            return process.pid
        
        except FileNotFoundError:
            raise RuntimeError("tcpdump命令未安装，请先安装: sudo apt install tcpdump")
        except PermissionError:
            raise RuntimeError("tcpdump需要root权限，请使用sudo运行后端服务")
        except Exception as e:
            raise RuntimeError(f"启动抓包失败: {e}")
    
    async def _monitor_task(
        self,
        task_id: int,
        process: subprocess.Popen,
        duration: int,
        output_file: str
    ):
        """
        监控任务（后台协程）
        
        职责：
        1. 定期检查进程是否结束
        2. 检查是否超时
        3. 更新文件大小
        4. 清理资源
        
        注意：此方法运行在独立的异步任务中，会创建自己的数据库会话
        """
        start_time = datetime.now()
        status = 'completed'
        
        try:
            while True:
                # 检查进程是否已结束
                poll_result = process.poll()
                if poll_result is not None:
                    # 进程已结束
                    if poll_result == 0:
                        status = 'completed'
                    else:
                        status = 'failed'
                        # 读取错误信息
                        _, stderr = process.communicate(timeout=1)
                        error_msg = stderr.decode('utf-8', errors='ignore') if stderr else '未知错误'
                        await self._update_error(task_id, error_msg)
                    break
                
                # 检查是否超时
                elapsed = (datetime.now() - start_time).total_seconds()
                if elapsed >= duration:
                    # 超时，优雅终止进程
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        # 强制杀死
                        process.kill()
                        process.wait()
                    status = 'completed'
                    break
                
                # 更新文件大小（每10秒）
                if int(elapsed) % 10 == 0:
                    await self._update_file_size(task_id, output_file)
                
                # 每秒检查一次
                await asyncio.sleep(1)
        
        except Exception as e:
            status = 'failed'
            await self._update_error(task_id, f"监控异常: {e}")
        
        finally:
            # 清理
            self.running_tasks.pop(task_id, None)
            
            # 更新最终状态
            await self._finalize_task(task_id, status, output_file, start_time)
    
    async def stop_capture(self, db: AsyncSession, task_id: int):
        """
        手动停止抓包
        
        Args:
            db: 数据库会话
            task_id: 任务ID
        """
        if task_id not in self.running_tasks:
            return
        
        process = self.running_tasks[task_id]
        
        try:
            # 优雅终止
            process.terminate()
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            # 强制杀死
            process.kill()
            process.wait()
        except Exception:
            pass
        finally:
            self.running_tasks.pop(task_id, None)
        
        # 更新状态
        result = await db.execute(
            select(CaptureTask).where(CaptureTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        if task:
            actual_duration = 0
            if task.started_at:
                actual_duration = int((datetime.now() - task.started_at).total_seconds())
            
            file_size = 0
            if task.file_path and os.path.exists(task.file_path):
                file_size = os.path.getsize(task.file_path)
            
            await db.execute(
                update(CaptureTask)
                .where(CaptureTask.id == task_id)
                .values(
                    status='stopped',
                    completed_at=datetime.now(),
                    actual_duration=actual_duration,
                    file_size=file_size
                )
            )
            await db.commit()
    
    async def _update_file_size(self, task_id: int, output_file: str):
        """更新文件大小（创建独立的数据库会话）"""
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            async with AsyncSessionLocal() as db:
                await db.execute(
                    update(CaptureTask)
                    .where(CaptureTask.id == task_id)
                    .values(file_size=file_size)
                )
                await db.commit()
    
    async def _update_error(self, task_id: int, error_msg: str):
        """更新错误信息（创建独立的数据库会话）"""
        async with AsyncSessionLocal() as db:
            await db.execute(
                update(CaptureTask)
                .where(CaptureTask.id == task_id)
                .values(error_message=error_msg)
            )
            await db.commit()
    
    async def _finalize_task(
        self,
        task_id: int,
        status: str,
        output_file: str,
        start_time: datetime
    ):
        """完成任务，更新最终状态（创建独立的数据库会话）"""
        actual_duration = int((datetime.now() - start_time).total_seconds())
        
        # 获取文件大小
        file_size = 0
        file_path = None
        if os.path.exists(output_file):
            file_size = os.path.getsize(output_file)
            file_path = output_file
        
        async with AsyncSessionLocal() as db:
            await db.execute(
                update(CaptureTask)
                .where(CaptureTask.id == task_id)
                .values(
                    status=status,
                    completed_at=datetime.now(),
                    actual_duration=actual_duration,
                    file_size=file_size,
                    file_path=file_path
                )
            )
            await db.commit()
    
    async def recover_task(self, db: AsyncSession, task: CaptureTask) -> bool:
        """
        恢复运行中的任务（应用重启时调用）
        
        Args:
            db: 数据库会话
            task: 任务对象
        
        Returns:
            bool: 是否恢复成功
        """
        if not task.pid:
            return False
        
        try:
            # 检查进程是否存在
            process = psutil.Process(task.pid)
            
            # 关键：验证是tcpdump进程，防止PID被其他进程占用
            if 'tcpdump' not in process.name().lower():
                return False
            
            # 重新接管进程
            # 注意：这里使用psutil.Process，功能有限但够用
            self.running_tasks[task.id] = process
            
            # 计算剩余时间
            if task.expires_at:
                remaining_time = (task.expires_at - datetime.now()).total_seconds()
                if remaining_time > 0:
                    # 重新启动监控协程（不传递 db，后台任务会创建自己的 session）
                    output_file = task.file_path or os.path.join(self.CAPTURE_DIR, f"{task.id}.pcap")
                    asyncio.create_task(
                        self._monitor_recovered_task(
                            task.id, process, int(remaining_time), output_file
                        )
                    )
                    return True
                else:
                    # 已超时，立即终止
                    process.terminate()
                    process.wait(timeout=5)
                    await db.execute(
                        update(CaptureTask)
                        .where(CaptureTask.id == task.id)
                        .values(status='completed', completed_at=datetime.now())
                    )
                    await db.commit()
                    return False
        
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            return False
        except Exception:
            return False
        
        return False
    
    async def _monitor_recovered_task(
        self,
        task_id: int,
        process: psutil.Process,
        remaining_time: int,
        output_file: str
    ):
        """监控恢复的任务（创建独立的数据库会话）"""
        start_time = datetime.now()
        status = 'completed'
        
        try:
            while True:
                # 检查进程是否结束
                if not process.is_running():
                    break
                
                # 检查剩余时间
                elapsed = (datetime.now() - start_time).total_seconds()
                if elapsed >= remaining_time:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except Exception:
                        process.kill()
                    break
                
                # 更新文件大小
                if int(elapsed) % 10 == 0:
                    await self._update_file_size(task_id, output_file)
                
                await asyncio.sleep(1)
        
        except Exception as e:
            status = 'failed'
            await self._update_error(task_id, f"恢复监控异常: {e}")
        
        finally:
            self.running_tasks.pop(task_id, None)
            
            # 获取原始任务信息（创建新的 session）
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(CaptureTask).where(CaptureTask.id == task_id)
                )
                task = result.scalar_one_or_none()
                if task and task.started_at:
                    await self._finalize_task(task_id, status, output_file, task.started_at)


# 全局单例
capture_manager = CaptureManager()

