"""
抓包任务自动清理器
负责清理过期的抓包任务和文件
"""
import os
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from app.models.capture import CaptureTask


class CaptureCleaner:
    """抓包任务清理器"""
    
    def __init__(self):
        """初始化清理器"""
        self.retention_days = 7  # 默认保留7天
    
    async def cleanup_expired_tasks(
        self,
        db: AsyncSession,
        retention_days: int = 7
    ) -> tuple[int, int]:
        """
        清理过期的抓包任务
        
        Args:
            db: 数据库会话
            retention_days: 保留天数（默认7天）
        
        Returns:
            tuple[int, int]: (删除的任务数, 删除的文件数)
        """
        # 计算过期时间
        expiry_date = datetime.now() - timedelta(days=retention_days)
        
        # 查询过期的任务
        result = await db.execute(
            select(CaptureTask).where(
                CaptureTask.created_at < expiry_date
            )
        )
        expired_tasks: List[CaptureTask] = list(result.scalars().all())
        
        deleted_files = 0
        deleted_tasks = 0
        
        for task in expired_tasks:
            # 删除文件
            if task.file_path and os.path.exists(task.file_path):
                try:
                    os.remove(task.file_path)
                    deleted_files += 1
                except Exception as e:
                    print(f"⚠️  删除文件失败 {task.file_path}: {e}")
            
            # 删除数据库记录
            try:
                await db.delete(task)
                deleted_tasks += 1
            except Exception as e:
                print(f"⚠️  删除任务记录失败 (ID: {task.id}): {e}")
        
        # 提交事务
        if deleted_tasks > 0:
            await db.commit()
        
        return deleted_tasks, deleted_files
    
    async def cleanup_orphaned_files(self, db: AsyncSession) -> int:
        """
        清理孤立的文件（数据库中没有记录但文件存在）
        
        Args:
            db: 数据库会话
        
        Returns:
            int: 删除的文件数
        """
        from app.core.capture_manager import capture_manager
        
        capture_dir = capture_manager.CAPTURE_DIR
        if not os.path.exists(capture_dir):
            return 0
        
        # 获取所有有效的文件路径
        result = await db.execute(
            select(CaptureTask.file_path).where(
                CaptureTask.file_path.isnot(None)
            )
        )
        valid_files = {row[0] for row in result.all()}
        
        # 扫描目录中的所有pcap文件
        deleted_count = 0
        for filename in os.listdir(capture_dir):
            if filename.endswith('.pcap'):
                file_path = os.path.join(capture_dir, filename)
                
                # 如果文件不在数据库记录中，则删除
                if file_path not in valid_files:
                    try:
                        os.remove(file_path)
                        deleted_count += 1
                        print(f"🗑️  删除孤立文件: {filename}")
                    except Exception as e:
                        print(f"⚠️  删除孤立文件失败 {filename}: {e}")
        
        return deleted_count


# 全局单例
capture_cleaner = CaptureCleaner()

