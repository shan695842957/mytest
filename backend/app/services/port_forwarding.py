"""端口转发进程管理服务（非阻塞异步实现）"""
import asyncio
import os
import signal
import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.crud.port_forwarding import port_forwarding_crud
from app.models.port_forwarding import PortForwardingRule

logger = logging.getLogger(__name__)


class PortForwardingService:
    """端口转发服务"""
    
    async def check_socat_installed(self) -> tuple[bool, str]:
        """
        检查 socat 是否已安装
        
        Returns:
            (是否安装, 版本信息或错误信息)
        """
        try:
            process = await asyncio.create_subprocess_exec(
                "socat",
                "-V",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=2.0)
            
            if process.returncode == 0:
                version_info = stdout.decode('utf-8', errors='ignore').split('\n')[0]
                return True, version_info
            else:
                return False, "Socat command failed"
        except FileNotFoundError:
            return False, "Socat not found (install with: apt install socat)"
        except asyncio.TimeoutError:
            return False, "Socat check timeout"
        except Exception as e:
            return False, f"Socat check error: {str(e)}"
    
    def _generate_socat_command(self, rule: PortForwardingRule) -> List[str]:
        """
        生成 socat 命令
        
        Args:
            rule: 转发规则
        
        Returns:
            命令列表
        """
        protocol = rule.protocol.upper()
        return [
            "socat",
            f"{protocol}-LISTEN:{rule.source_port},bind={rule.source_host},fork,reuseaddr",
            f"{protocol}:{rule.target_host}:{rule.target_port}"
        ]
    
    async def _check_process_exists(self, pid: int) -> bool:
        """
        检查进程是否存在（非阻塞）
        
        Args:
            pid: 进程 ID
        
        Returns:
            是否存在
        """
        try:
            # 发送信号 0 检查进程是否存在（不杀死进程）
            os.kill(pid, 0)
            return True
        except (OSError, ProcessLookupError):
            return False
    
    async def start_forwarding(self, db: AsyncSession, rule_id: int) -> PortForwardingRule:
        """
        启动端口转发（非阻塞）
        
        Args:
            db: 数据库会话
            rule_id: 规则 ID
        
        Returns:
            更新后的规则
        """
        # 检查 socat 是否安装
        installed, info = await self.check_socat_installed()
        if not installed:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Socat not available: {info}"
            )
        
        # 获取规则
        rule = await port_forwarding_crud.get_by_id(db, rule_id)
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Port forwarding rule not found"
            )
        
        # 检查是否已经在运行
        if rule.status == "running" and rule.process_id:
            if await self._check_process_exists(rule.process_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Forwarding rule is already running"
                )
        
        # 检查源端口冲突
        existing = await port_forwarding_crud.get_by_source_port(db, rule.source_port, exclude_id=rule.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Source port {rule.source_port} is already in use by rule '{existing.name}'"
            )
        
        try:
            # 生成命令
            command = self._generate_socat_command(rule)
            logger.info(f"Starting socat: {' '.join(command)}")
            
            # 异步启动进程（捕获 stderr 以获取错误信息）
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                start_new_session=True  # 创建新会话，防止信号传播
            )
            
            # 等待一小段时间确保进程启动成功
            await asyncio.sleep(0.2)
            
            # 检查进程是否仍在运行
            if process.returncode is not None:
                # 进程已退出，读取错误信息
                try:
                    _, stderr = await asyncio.wait_for(
                        process.communicate(), 
                        timeout=1.0
                    )
                    error_detail = stderr.decode('utf-8', errors='ignore').strip() if stderr else "Unknown error"
                except asyncio.TimeoutError:
                    error_detail = "Timeout reading error output"
                
                logger.error(f"Socat exited immediately (code {process.returncode}): {error_detail}")
                raise Exception(f"Socat failed to start: {error_detail}")
            
            # 更新状态
            rule = await port_forwarding_crud.update_status(
                db, rule, 
                status="running", 
                process_id=process.pid,
                error_message=None
            )
            
            logger.info(f"Started forwarding rule '{rule.name}' (PID: {process.pid})")
            return rule
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to start forwarding rule '{rule.name}': {error_msg}")
            
            # 更新错误状态
            rule = await port_forwarding_crud.update_status(
                db, rule,
                status="error",
                process_id=None,
                error_message=error_msg
            )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to start forwarding: {error_msg}"
            )
    
    async def stop_forwarding(self, db: AsyncSession, rule_id: int, force: bool = False) -> PortForwardingRule:
        """
        停止端口转发（非阻塞）
        
        Args:
            db: 数据库会话
            rule_id: 规则 ID
            force: 是否强制停止
        
        Returns:
            更新后的规则
        """
        # 获取规则
        rule = await port_forwarding_crud.get_by_id(db, rule_id)
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Port forwarding rule not found"
            )
        
        # 检查是否在运行
        if rule.status != "running" or not rule.process_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Forwarding rule is not running"
            )
        
        try:
            pid = rule.process_id
            
            # 检查进程是否存在
            if not await self._check_process_exists(pid):
                logger.warning(f"Process {pid} not found, updating status")
                rule = await port_forwarding_crud.update_status(
                    db, rule,
                    status="stopped",
                    process_id=None,
                    error_message=None
                )
                return rule
            
            # 发送终止信号
            sig = signal.SIGKILL if force else signal.SIGTERM
            os.kill(pid, sig)
            logger.info(f"Sent signal {sig} to process {pid}")
            
            # 等待进程结束（最多 5 秒）
            for _ in range(50):  # 50 * 0.1s = 5s
                await asyncio.sleep(0.1)
                if not await self._check_process_exists(pid):
                    break
            else:
                # 超时，强制杀死
                if not force:
                    logger.warning(f"Process {pid} did not terminate, force killing")
                    os.kill(pid, signal.SIGKILL)
                    await asyncio.sleep(0.1)
            
            # 更新状态
            rule = await port_forwarding_crud.update_status(
                db, rule,
                status="stopped",
                process_id=None,
                error_message=None
            )
            
            logger.info(f"Stopped forwarding rule '{rule.name}' (PID: {pid})")
            return rule
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to stop forwarding rule '{rule.name}': {error_msg}")
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to stop forwarding: {error_msg}"
            )
    
    async def restart_forwarding(self, db: AsyncSession, rule_id: int) -> PortForwardingRule:
        """
        重启端口转发（非阻塞）
        
        Args:
            db: 数据库会话
            rule_id: 规则 ID
        
        Returns:
            更新后的规则
        """
        # 获取规则
        rule = await port_forwarding_crud.get_by_id(db, rule_id)
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Port forwarding rule not found"
            )
        
        # 如果正在运行，先停止
        if rule.status == "running" and rule.process_id:
            if await self._check_process_exists(rule.process_id):
                await self.stop_forwarding(db, rule_id)
        
        # 启动
        return await self.start_forwarding(db, rule_id)
    
    async def check_status(self, db: AsyncSession, rule_id: int) -> PortForwardingRule:
        """
        检查转发状态（非阻塞）
        
        Args:
            db: 数据库会话
            rule_id: 规则 ID
        
        Returns:
            更新后的规则
        """
        # 获取规则
        rule = await port_forwarding_crud.get_by_id(db, rule_id)
        if not rule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Port forwarding rule not found"
            )
        
        # 如果状态为运行中，检查进程是否存在
        if rule.status == "running" and rule.process_id:
            if not await self._check_process_exists(rule.process_id):
                logger.warning(f"Process {rule.process_id} not found for rule '{rule.name}', updating status")
                rule = await port_forwarding_crud.update_status(
                    db, rule,
                    status="stopped",
                    process_id=None,
                    error_message="Process terminated unexpectedly"
                )
        
        return rule
    
    async def batch_start(self, db: AsyncSession, rule_ids: List[int]) -> dict:
        """
        批量启动（非阻塞）
        
        Args:
            db: 数据库会话
            rule_ids: 规则 ID 列表
        
        Returns:
            操作结果
        """
        success_ids = []
        failed_ids = []
        errors = {}
        
        for rule_id in rule_ids:
            try:
                await self.start_forwarding(db, rule_id)
                success_ids.append(rule_id)
            except Exception as e:
                failed_ids.append(rule_id)
                errors[rule_id] = str(e)
        
        return {
            "success_count": len(success_ids),
            "failed_count": len(failed_ids),
            "success_ids": success_ids,
            "failed_ids": failed_ids,
            "errors": errors
        }
    
    async def batch_stop(self, db: AsyncSession, rule_ids: List[int]) -> dict:
        """
        批量停止（非阻塞）
        
        Args:
            db: 数据库会话
            rule_ids: 规则 ID 列表
        
        Returns:
            操作结果
        """
        success_ids = []
        failed_ids = []
        errors = {}
        
        for rule_id in rule_ids:
            try:
                await self.stop_forwarding(db, rule_id)
                success_ids.append(rule_id)
            except Exception as e:
                failed_ids.append(rule_id)
                errors[rule_id] = str(e)
        
        return {
            "success_count": len(success_ids),
            "failed_count": len(failed_ids),
            "success_ids": success_ids,
            "failed_ids": failed_ids,
            "errors": errors
        }


# 全局实例
port_forwarding_service = PortForwardingService()

