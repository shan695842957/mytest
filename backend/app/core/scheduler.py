"""
后台定时任务调度器
负责定时采集监控数据和清理过期数据
"""
import asyncio
from datetime import datetime, time
from typing import Optional

from app.database import AsyncSessionLocal
from app.core.monitor_collector import monitor_collector
from app.core.capture_cleaner import capture_cleaner


class MonitorScheduler:
    """监控数据采集调度器"""
    
    def __init__(self):
        self.collection_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        self.running = False
    
    async def _collection_loop(self):
        """数据采集循环"""
        print("📊 监控数据采集任务已启动")
        
        while self.running:
            try:
                async with AsyncSessionLocal() as db:
                    # 获取配置
                    enabled = await monitor_collector.get_config(db, "collection_enabled", "true")
                    if enabled.lower() == "true":
                        interval = int(await monitor_collector.get_config(db, "collection_interval", "10"))
                        
                        # 采集并保存数据
                        await monitor_collector.collect_and_save(db)
                        
                        # 等待下一次采集
                        await asyncio.sleep(interval)
                    else:
                        # 未启用，等待1分钟后再检查
                        await asyncio.sleep(60)
            
            except asyncio.CancelledError:
                print("📊 监控数据采集任务被取消")
                break
            except Exception as e:
                print(f"⚠️  监控数据采集失败: {str(e)}")
                # 出错后等待10秒再重试
                await asyncio.sleep(10)
    
    async def _cleanup_loop(self):
        """数据清理循环（每天凌晨3点执行）"""
        print("🗑️  监控数据清理任务已启动")
        
        while self.running:
            try:
                # 计算到明天凌晨3点的秒数
                now = datetime.now()
                tomorrow_3am = datetime.combine(
                    now.date() if now.hour < 3 else now.date().replace(day=now.day + 1),
                    time(3, 0, 0)
                )
                sleep_seconds = (tomorrow_3am - now).total_seconds()
                
                # 等待到凌晨3点
                await asyncio.sleep(sleep_seconds)
                
                # 执行清理
                async with AsyncSessionLocal() as db:
                    # 1. 清理监控数据
                    auto_cleanup = await monitor_collector.get_config(db, "auto_cleanup", "true")
                    if auto_cleanup.lower() == "true":
                        retention_days = int(await monitor_collector.get_config(db, "retention_days", "7"))
                        deleted_count = await monitor_collector.cleanup_old_data(db, retention_days)
                        print(f"🗑️  清理了 {deleted_count} 条过期监控数据（保留{retention_days}天）")
                    
                    # 2. 清理过期的抓包任务（固定保留7天）
                    try:
                        tasks_deleted, files_deleted = await capture_cleaner.cleanup_expired_tasks(db, retention_days=7)
                        if tasks_deleted > 0 or files_deleted > 0:
                            print(f"🗑️  清理了 {tasks_deleted} 个过期抓包任务，删除了 {files_deleted} 个文件（保留7天）")
                        
                        # 3. 清理孤立的抓包文件
                        orphaned = await capture_cleaner.cleanup_orphaned_files(db)
                        if orphaned > 0:
                            print(f"🗑️  清理了 {orphaned} 个孤立的抓包文件")
                    except Exception as e:
                        print(f"⚠️  抓包任务清理失败: {str(e)}")
            
            except asyncio.CancelledError:
                print("🗑️  监控数据清理任务被取消")
                break
            except Exception as e:
                print(f"⚠️  监控数据清理失败: {str(e)}")
                # 出错后等待1小时再重试
                await asyncio.sleep(3600)
    
    async def start(self):
        """启动调度器"""
        if self.running:
            print("⚠️  调度器已经在运行")
            return
        
        self.running = True
        
        # 启动采集任务
        self.collection_task = asyncio.create_task(self._collection_loop())
        
        # 启动清理任务
        self.cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        print("✅ 监控调度器已启动")
    
    async def stop(self):
        """停止调度器"""
        if not self.running:
            return
        
        self.running = False
        
        # 取消采集任务
        if self.collection_task:
            self.collection_task.cancel()
            try:
                await self.collection_task
            except asyncio.CancelledError:
                pass
        
        # 取消清理任务
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
        
        print("✅ 监控调度器已停止")


# 全局调度器实例
monitor_scheduler = MonitorScheduler()

