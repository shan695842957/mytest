"""Rathole 配置管理服务（基于 TOML 文件）"""
import asyncio
import os
import shutil
import logging
from typing import Optional, Dict, List
from datetime import datetime
from pathlib import Path

import toml
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.system_metadata import SystemConfig
from app.schemas.rathole import (
    RatholeGlobalConfig,
    RatholeService as RatholeServiceSchema,
    RatholeServiceCreate,
    RatholeServiceUpdate,
    RatholeBackupInfo,
    RatholeServiceStatus
)

logger = logging.getLogger(__name__)


class RatholeService:
    """Rathole 配置管理服务"""
    
    def __init__(self):
        self.default_config_path = "/etc/rathole/client.toml"
        self.backup_keep_count = 7
    
    async def _get_data_directory(self) -> str:
        """获取数据目录配置（从 system_config 读取）"""
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(SystemConfig).where(
                        SystemConfig.module == "system",
                        SystemConfig.key == "data_directory"
                    )
                )
                record = result.scalar_one_or_none()
                return record.value if record else "/var/lib/lccu-v"
        except Exception as e:
            logger.warning(f"Failed to get data_directory from DB: {e}, using default")
            return "/var/lib/lccu-v"
    
    async def _get_backup_directory(self) -> str:
        """获取 Rathole 备份目录路径"""
        data_dir = await self._get_data_directory()
        backup_dir = os.path.join(data_dir, "rathole", "backups")
        os.makedirs(backup_dir, mode=0o755, exist_ok=True)
        return backup_dir
    
    async def load_config(self, config_path: str) -> dict:
        """
        读取并解析 TOML 配置（非阻塞）
        
        Args:
            config_path: 配置文件路径
        
        Returns:
            配置字典
        """
        if not os.path.exists(config_path):
            logger.warning(f"Config file not found: {config_path}, returning default config")
            return {
                "client": {
                    "remote_addr": "",
                    "services": {}
                }
            }
        
        try:
            # 异步读取文件
            content = await asyncio.to_thread(
                self._read_file, config_path
            )
            
            # 解析 TOML
            config = toml.loads(content)
            
            # 确保结构完整
            if "client" not in config:
                config["client"] = {}
            if "services" not in config["client"]:
                config["client"]["services"] = {}
            
            return config
            
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to load config file: {str(e)}"
            )
    
    def _read_file(self, path: str) -> str:
        """同步读取文件（在线程池中执行）"""
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def _write_file(self, path: str, content: str):
        """同步写入文件（在线程池中执行）"""
        # 确保目录存在
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    async def save_config(self, config_path: str, config: dict, create_backup: bool = True):
        """
        保存配置到 TOML 文件（非阻塞，带备份）
        
        Args:
            config_path: 配置文件路径
            config: 配置字典
            create_backup: 是否创建备份
        """
        try:
            # 1. 创建备份
            if create_backup and os.path.exists(config_path):
                await self._backup_config(config_path)
            
            # 2. 生成 TOML 字符串
            toml_str = toml.dumps(config)
            
            # 3. 异步写入文件
            await asyncio.to_thread(
                self._write_file, config_path, toml_str
            )
            
            logger.info(f"Config saved to {config_path}")
            
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save config file: {str(e)}"
            )
    
    async def _backup_config(self, config_path: str):
        """
        备份配置文件到数据目录
        
        备份路径: {data_dir}/rathole/backups/client.toml.20251112_143022
        """
        if not os.path.exists(config_path):
            return
        
        # 获取备份目录
        backup_dir = await self._get_backup_directory()
        
        # 生成备份文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        config_filename = os.path.basename(config_path)
        backup_filename = f"{config_filename}.{timestamp}"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # 异步复制文件
        await asyncio.to_thread(shutil.copy2, config_path, backup_path)
        
        logger.info(f"Config backed up to {backup_path}")
        
        # 清理旧备份
        await self._cleanup_old_backups()
    
    async def _cleanup_old_backups(self):
        """清理旧备份，只保留最近 N 个"""
        try:
            backup_dir = await self._get_backup_directory()
            
            # 获取所有备份文件（所有 .toml.* 文件）
            backups = []
            for filename in os.listdir(backup_dir):
                if filename.startswith("client.toml."):
                    backup_path = os.path.join(backup_dir, filename)
                    stat = os.stat(backup_path)
                    backups.append((filename, stat.st_mtime))
            
            # 按时间排序（最新的在前）
            backups.sort(key=lambda x: x[1], reverse=True)
            
            # 删除多余的备份
            for filename, _ in backups[self.backup_keep_count:]:
                old_backup = os.path.join(backup_dir, filename)
                await asyncio.to_thread(os.remove, old_backup)
                logger.info(f"Removed old backup: {filename}")
                
        except Exception as e:
            logger.warning(f"Failed to cleanup old backups: {e}")
    
    async def list_backups(self, config_path: str) -> List[RatholeBackupInfo]:
        """
        获取备份文件列表
        
        Args:
            config_path: 配置文件路径
        
        Returns:
            备份文件列表
        """
        try:
            backup_dir = await self._get_backup_directory()
            config_filename = os.path.basename(config_path)
            
            backups = []
            for filename in os.listdir(backup_dir):
                if filename.startswith(f"{config_filename}."):
                    backup_path = os.path.join(backup_dir, filename)
                    stat = os.stat(backup_path)
                    
                    # 提取时间戳
                    timestamp_str = filename.replace(f"{config_filename}.", "")
                    
                    backups.append(RatholeBackupInfo(
                        filename=filename,
                        timestamp=timestamp_str,
                        size=stat.st_size,
                        created_at=datetime.fromtimestamp(stat.st_mtime)
                    ))
            
            # 按时间排序（最新的在前）
            backups.sort(key=lambda x: x.created_at, reverse=True)
            
            return backups
            
        except Exception as e:
            logger.error(f"Failed to list backups: {e}")
            return []
    
    async def restore_backup(self, config_path: str, backup_filename: str):
        """
        恢复备份
        
        Args:
            config_path: 配置文件路径
            backup_filename: 备份文件名
        """
        try:
            backup_dir = await self._get_backup_directory()
            backup_path = os.path.join(backup_dir, backup_filename)
            
            if not os.path.exists(backup_path):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Backup file not found: {backup_filename}"
                )
            
            # 备份当前配置（恢复前先备份）
            if os.path.exists(config_path):
                await self._backup_config(config_path)
            
            # 恢复备份
            await asyncio.to_thread(shutil.copy2, backup_path, config_path)
            
            logger.info(f"Config restored from {backup_filename}")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to restore backup: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to restore backup: {str(e)}"
            )
    
    async def get_backup_content(self, config_path: str, backup_filename: str) -> str:
        """
        获取备份文件内容
        
        Args:
            config_path: 配置文件路径
            backup_filename: 备份文件名
        
        Returns:
            备份文件内容
        """
        try:
            backup_dir = await self._get_backup_directory()
            backup_path = os.path.join(backup_dir, backup_filename)
            
            if not os.path.exists(backup_path):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Backup file not found: {backup_filename}"
                )
            
            # 异步读取
            content = await asyncio.to_thread(self._read_file, backup_path)
            return content
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to read backup: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read backup file: {str(e)}"
            )
    
    async def get_services(self, config_path: str) -> List[RatholeServiceSchema]:
        """
        获取所有服务
        
        Args:
            config_path: 配置文件路径
        
        Returns:
            服务列表
        """
        config = await self.load_config(config_path)
        services = config.get("client", {}).get("services", {})
        
        result = []
        for service_name, service_config in services.items():
            # 直接使用字典解包（Pydantic v2 兼容）
            result.append(RatholeServiceSchema(
                service_name=service_name,
                token=service_config.get("token", ""),
                local_addr=service_config.get("local_addr", ""),
                description=service_config.get("description", None)
            ))
        
        return result
    
    async def get_service(self, config_path: str, service_name: str) -> Optional[RatholeServiceSchema]:
        """
        获取指定服务
        
        Args:
            config_path: 配置文件路径
            service_name: 服务名称
        
        Returns:
            服务对象或 None
        """
        config = await self.load_config(config_path)
        services = config.get("client", {}).get("services", {})
        
        if service_name in services:
            service_config = services[service_name]
            return RatholeServiceSchema(
                service_name=service_name,
                token=service_config.get("token", ""),
                local_addr=service_config.get("local_addr", ""),
                description=service_config.get("description", None)
            )
        
        return None
    
    async def create_service(
        self, 
        config_path: str, 
        service_in: RatholeServiceCreate
    ) -> RatholeServiceSchema:
        """
        创建服务
        
        Args:
            config_path: 配置文件路径
            service_in: 服务数据
        
        Returns:
            创建的服务
        """
        config = await self.load_config(config_path)
        services = config.get("client", {}).get("services", {})
        
        # 检查服务名称是否已存在
        if service_in.service_name in services:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Service name '{service_in.service_name}' already exists"
            )
        
        # 添加服务
        service_dict = {
            "token": service_in.token,
            "local_addr": service_in.local_addr,
        }
        
        if service_in.description:
            service_dict["description"] = service_in.description
        
        services[service_in.service_name] = service_dict
        config["client"]["services"] = services
        
        # 保存配置
        await self.save_config(config_path, config)
        
        # 返回创建的服务
        return RatholeServiceSchema(
            service_name=service_in.service_name,
            token=service_in.token,
            local_addr=service_in.local_addr,
            description=service_in.description
        )
    
    async def update_service(
        self,
        config_path: str,
        old_service_name: str,
        service_in: RatholeServiceUpdate
    ) -> RatholeServiceSchema:
        """
        更新服务
        
        Args:
            config_path: 配置文件路径
            old_service_name: 原服务名称
            service_in: 更新数据
        
        Returns:
            更新后的服务
        """
        config = await self.load_config(config_path)
        services = config.get("client", {}).get("services", {})
        
        # 检查服务是否存在
        if old_service_name not in services:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service '{old_service_name}' not found"
            )
        
        service_config = services[old_service_name]
        
        # 如果要修改服务名称
        new_service_name = service_in.service_name or old_service_name
        if new_service_name != old_service_name:
            # 检查新名称是否已存在
            if new_service_name in services:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Service name '{new_service_name}' already exists"
                )
            
            # 删除旧服务，添加新服务
            del services[old_service_name]
            services[new_service_name] = service_config
        
        # 更新字段
        if service_in.token:
            service_config["token"] = service_in.token
        if service_in.local_addr:
            service_config["local_addr"] = service_in.local_addr
        if service_in.description is not None:
            if service_in.description:
                service_config["description"] = service_in.description
            else:
                service_config.pop("description", None)
        
        config["client"]["services"] = services
        
        # 保存配置
        await self.save_config(config_path, config)
        
        # 返回更新后的服务
        return RatholeServiceSchema(
            service_name=new_service_name,
            token=service_config.get("token", ""),
            local_addr=service_config.get("local_addr", ""),
            description=service_config.get("description", None)
        )
    
    async def delete_service(self, config_path: str, service_name: str):
        """
        删除服务
        
        Args:
            config_path: 配置文件路径
            service_name: 服务名称
        """
        config = await self.load_config(config_path)
        services = config.get("client", {}).get("services", {})
        
        # 检查服务是否存在
        if service_name not in services:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service '{service_name}' not found"
            )
        
        # 删除服务
        del services[service_name]
        config["client"]["services"] = services
        
        # 保存配置
        await self.save_config(config_path, config)
        
        logger.info(f"Service '{service_name}' deleted")
    
    async def update_remote_addr(self, config_path: str, remote_addr: str):
        """
        更新远程服务器地址
        
        Args:
            config_path: 配置文件路径
            remote_addr: 远程地址
        """
        config = await self.load_config(config_path)
        
        if "client" not in config:
            config["client"] = {}
        
        config["client"]["remote_addr"] = remote_addr
        
        # 保存配置
        await self.save_config(config_path, config)
        
        logger.info(f"Remote addr updated to {remote_addr}")
    
    async def get_toml_content(self, config_path: str) -> str:
        """
        获取 TOML 文件内容
        
        Args:
            config_path: 配置文件路径
        
        Returns:
            TOML 文件内容
        """
        if not os.path.exists(config_path):
            # 返回默认内容
            return """[client]
remote_addr = ""

# 请先配置远程服务器地址和添加服务
"""
        
        content = await asyncio.to_thread(self._read_file, config_path)
        return content
    
    async def start_rathole(self) -> dict:
        """
        启动 rathole 服务（非阻塞）
        
        Returns:
            操作结果
        """
        try:
            process = await asyncio.create_subprocess_exec(
                "sudo", "systemctl", "start", "rathole",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=5.0)
            
            if process.returncode != 0:
                error_msg = stderr.decode('utf-8', errors='ignore').strip()
                logger.error(f"Failed to start rathole: {error_msg}")
                raise Exception(error_msg or "Failed to start rathole service")
            
            logger.info("Rathole service started")
            return {"success": True, "message": "Rathole service started"}
            
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Start rathole service timeout"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to start rathole: {str(e)}"
            )
    
    async def stop_rathole(self) -> dict:
        """停止 rathole 服务（非阻塞）"""
        try:
            process = await asyncio.create_subprocess_exec(
                "sudo", "systemctl", "stop", "rathole",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=5.0)
            
            if process.returncode != 0:
                error_msg = stderr.decode('utf-8', errors='ignore').strip()
                logger.error(f"Failed to stop rathole: {error_msg}")
                raise Exception(error_msg or "Failed to stop rathole service")
            
            logger.info("Rathole service stopped")
            return {"success": True, "message": "Rathole service stopped"}
            
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Stop rathole service timeout"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to stop rathole: {str(e)}"
            )
    
    async def restart_rathole(self) -> dict:
        """重启 rathole 服务（非阻塞）"""
        try:
            process = await asyncio.create_subprocess_exec(
                "sudo", "systemctl", "restart", "rathole",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=10.0)
            
            if process.returncode != 0:
                error_msg = stderr.decode('utf-8', errors='ignore').strip()
                logger.error(f"Failed to restart rathole: {error_msg}")
                raise Exception(error_msg or "Failed to restart rathole service")
            
            logger.info("Rathole service restarted")
            return {"success": True, "message": "Rathole service restarted"}
            
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Restart rathole service timeout"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to restart rathole: {str(e)}"
            )
    
    async def get_rathole_status(self) -> RatholeServiceStatus:
        """
        获取 rathole 服务状态（非阻塞）
        
        Returns:
            服务状态
        """
        try:
            # 检查服务是否 active
            process = await asyncio.create_subprocess_exec(
                "systemctl", "is-active", "rathole",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(process.communicate(), timeout=2.0)
            status_str = stdout.decode('utf-8').strip()
            
            # 获取详细状态
            process2 = await asyncio.create_subprocess_exec(
                "systemctl", "show", "rathole",
                "--property=MainPID,ActiveState,MemoryCurrent,ActiveEnterTimestamp",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout2, _ = await asyncio.wait_for(process2.communicate(), timeout=2.0)
            
            # 解析输出
            details = {}
            for line in stdout2.decode('utf-8').split('\n'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    details[key] = value
            
            # 构造响应
            pid = int(details.get('MainPID', '0'))
            memory = details.get('MemoryCurrent', '0')
            
            # 计算运行时间
            uptime_str = None
            if status_str == 'active':
                # 可以进一步计算 uptime
                uptime_str = "Running"
            
            return RatholeServiceStatus(
                status=status_str,
                is_active=(status_str == 'active'),
                pid=pid if pid > 0 else None,
                uptime=uptime_str,
                memory_usage=f"{int(memory) // 1024 // 1024} MB" if memory.isdigit() else None
            )
            
        except asyncio.TimeoutError:
            return RatholeServiceStatus(
                status="unknown",
                is_active=False,
                pid=None,
                uptime=None,
                memory_usage=None
            )
        except Exception as e:
            logger.error(f"Failed to get rathole status: {e}")
            return RatholeServiceStatus(
                status="unknown",
                is_active=False,
                pid=None,
                uptime=None,
                memory_usage=None
            )


# 全局实例
rathole_service = RatholeService()
