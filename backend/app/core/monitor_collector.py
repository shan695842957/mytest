"""
监控数据采集器
负责采集系统资源使用数据（CPU、内存、磁盘、网络）
"""
import os
import json
import psutil
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.monitor_history import MonitorHistory
from app.models.system_metadata import SystemConfig
from app.database import AsyncSessionLocal


class MonitorCollector:
    """监控数据采集器"""
    
    def __init__(self):
        self.last_network_io = None  # 用于计算网络速率
        self.last_network_time = None
        self.current_process = psutil.Process(os.getpid())
    
    async def get_config(self, db: AsyncSession, key: str, default: str, module: str = "monitor") -> str:
        """获取配置值"""
        result = await db.execute(
            select(SystemConfig).where(
                SystemConfig.module == module,
                SystemConfig.key == key
            )
        )
        config = result.scalar_one_or_none()
        return config.value if config else default
    
    def collect_cpu_data(self) -> Dict:
        """采集CPU数据（只采集前端使用的字段）"""
        # 总体CPU使用率（前端只用这一个字段画曲线）
        cpu_percent = psutil.cpu_percent(interval=1)
        
        return {
            "cpu_percent": cpu_percent,
            # 删除不需要的字段，减少存储和查询开销
            # "cpu_count": psutil.cpu_count(),
            # "load_avg_1/5/15": psutil.getloadavg(),
        }
    
    def collect_memory_data(self) -> Dict:
        """采集内存数据（只采集前端使用的字段）"""
        mem = psutil.virtual_memory()
        
        return {
            "memory_percent": mem.percent,
            # 删除不需要的字段，减少存储
            # "memory_used_mb": int(mem.used / 1024 / 1024),
            # "memory_total_mb": int(mem.total / 1024 / 1024),
            # "memory_available_mb": int(mem.available / 1024 / 1024),
        }
    
    def collect_disk_data(self) -> Dict:
        """采集磁盘数据（只采集前端使用的字段）"""
        disk = psutil.disk_usage('/')
        
        return {
            "disk_percent": disk.percent,
            # 删除不需要的字段，减少存储
            # "disk_used_gb": int(disk.used / 1024 / 1024 / 1024),
            # "disk_total_gb": int(disk.total / 1024 / 1024 / 1024),
            # "disk_free_gb": int(disk.free / 1024 / 1024 / 1024),
        }
    
    def collect_network_data(self) -> Dict:
        """
        采集网络数据（每个网卡的流量速率）
        
        注意：需要调用两次才能计算速率（当前 - 上次）/ 时间差
        """
        current_io = psutil.net_io_counters(pernic=True)
        current_time = datetime.now()
        
        network_interfaces = {}
        total_recv_rate = 0.0
        total_sent_rate = 0.0
        
        if self.last_network_io and self.last_network_time:
            time_delta = (current_time - self.last_network_time).total_seconds()
            
            if time_delta > 0:
                for interface, current_stats in current_io.items():
                    if interface in self.last_network_io:
                        last_stats = self.last_network_io[interface]
                        
                        # 计算速率（KB/s）
                        recv_rate = (current_stats.bytes_recv - last_stats.bytes_recv) / time_delta / 1024
                        sent_rate = (current_stats.bytes_sent - last_stats.bytes_sent) / time_delta / 1024
                        
                        network_interfaces[interface] = {
                            "recv_rate": round(recv_rate, 2),
                            "sent_rate": round(sent_rate, 2),
                            "bytes_recv": current_stats.bytes_recv,
                            "bytes_sent": current_stats.bytes_sent,
                        }
                        
                        total_recv_rate += recv_rate
                        total_sent_rate += sent_rate
        
        # 更新上次采集数据
        self.last_network_io = current_io
        self.last_network_time = current_time
        
        return {
            "network_interfaces": json.dumps(network_interfaces),
            "network_total_recv_rate": round(total_recv_rate, 2),
            "network_total_sent_rate": round(total_sent_rate, 2),
        }
    
    def collect_process_data(self) -> Dict:
        """采集FastAPI进程资源数据（前端未使用，暂不采集）"""
        # 前端不展示进程数据，暂不采集以减少开销
        return {}
        
        # 如果将来需要，取消注释：
        # try:
        #     process_cpu = self.current_process.cpu_percent(interval=0.1)
        #     process_mem = self.current_process.memory_info()
        #     process_mem_percent = self.current_process.memory_percent()
        #     process_threads = self.current_process.num_threads()
        #     
        #     return {
        #         "process_cpu_percent": process_cpu,
        #         "process_memory_percent": round(process_mem_percent, 2),
        #         "process_memory_mb": int(process_mem.rss / 1024 / 1024),
        #         "process_threads": process_threads,
        #     }
        # except Exception:
        #     return {}
    
    async def collect_and_save(self, db: AsyncSession) -> None:
        """
        采集所有监控数据并保存到数据库
        """
        # 采集所有数据
        data = {
            "timestamp": datetime.now(),
        }
        
        # CPU数据
        data.update(self.collect_cpu_data())
        
        # 内存数据
        data.update(self.collect_memory_data())
        
        # 磁盘数据
        data.update(self.collect_disk_data())
        
        # 网络数据（需要两次调用才有速率）
        data.update(self.collect_network_data())
        
        # 进程数据
        data.update(self.collect_process_data())
        
        # 保存到数据库
        monitor_record = MonitorHistory(**data)
        db.add(monitor_record)
        await db.commit()
    
    async def cleanup_old_data(self, db: AsyncSession, retention_days: int = 7) -> int:
        """
        清理过期数据
        
        Returns:
            删除的记录数
        """
        # 计算过期时间
        from datetime import timedelta
        expire_time = datetime.now() - timedelta(days=retention_days)
        
        # 删除过期记录
        result = await db.execute(
            delete(MonitorHistory).where(MonitorHistory.timestamp < expire_time)
        )
        await db.commit()
        
        return result.rowcount if result.rowcount else 0


# 全局采集器实例
monitor_collector = MonitorCollector()
