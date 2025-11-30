"""
初始化系统元数据（数据库指纹）
"""
import os
import uuid
import platform
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.system_metadata import SystemMetadata


async def init_system_metadata():
    """
    初始化系统元数据
    
    首次启动时生成机器UUID和项目标识
    用于验证备份文件是否来自同一项目/机器
    """
    async with AsyncSessionLocal() as db:
        try:
            # 检查 machine_uuid 是否已初始化
            result = await db.execute(
                select(SystemMetadata).where(SystemMetadata.key == "machine_uuid")
            )
            machine_uuid_record = result.scalar_one_or_none()
            
            # 如果未初始化或值为 UNINITIALIZED，生成新的UUID
            if not machine_uuid_record or machine_uuid_record.value == "UNINITIALIZED":
                # 生成主机唯一标识（基于主机名+MAC地址）
                import hashlib
                hostname = platform.node()
                
                # 尝试获取MAC地址
                try:
                    mac = ':'.join(['{:02x}'.format((uuid.getnode() >> ele) & 0xff) for ele in range(0,8*6,8)][::-1])
                except:
                    mac = 'unknown'
                
                # 生成UUID（使用主机名+MAC地址的哈希值）
                machine_id = hashlib.md5(f"{hostname}:{mac}".encode()).hexdigest()
                
                if machine_uuid_record:
                    # 更新现有记录
                    machine_uuid_record.value = machine_id
                else:
                    # 创建新记录
                    db.add(SystemMetadata(
                        key="machine_uuid",
                        value=machine_id,
                        description=f"主机唯一标识（{hostname}）"
                    ))
                
                await db.commit()
                print(f"   - 机器UUID已生成: {machine_id[:16]}...")
            else:
                print(f"   - 机器UUID已存在: {machine_uuid_record.value[:16]}...")
            
            # 确保其他元数据存在
            metadata_defaults = [
                ("project_id", "LCCU-V", "项目标识符"),
                ("db_version", "1.0.0", "数据库版本"),
                ("app_version", "0.3.0", "应用版本"),
                ("created_at", datetime.now().isoformat(), "数据库创建时间"),
                ("backup_enabled", "true", "是否启用备份功能"),
            ]
            
            for key, value, desc in metadata_defaults:
                result = await db.execute(
                    select(SystemMetadata).where(SystemMetadata.key == key)
                )
                record = result.scalar_one_or_none()
                
                if not record:
                    db.add(SystemMetadata(
                        key=key,
                        value=value,
                        description=desc
                    ))
            
            await db.commit()
            
            # 创建数据目录结构
            await _create_data_directories(db)
            
        except Exception as e:
            await db.rollback()
            print(f"⚠️  系统元数据初始化失败: {str(e)}")
            # 不抛出异常，允许应用继续启动


async def _create_data_directories(db: AsyncSession):
    """创建数据目录结构"""
    try:
        from app.models.system_metadata import SystemConfig
        
        # 获取数据目录配置（从 SystemConfig 读取）
        result = await db.execute(
            select(SystemConfig).where(
                SystemConfig.module == "system",
                SystemConfig.key == "data_directory"
            )
        )
        data_dir_record = result.scalar_one_or_none()
        
        if not data_dir_record:
            return
        
        data_dir = data_dir_record.value
        
        # 需要创建的子目录
        subdirs = [
            "rathole/backups",  # Rathole 备份目录
            "logs",             # 日志目录
            "temp",             # 临时文件目录
        ]
        
        for subdir in subdirs:
            dir_path = os.path.join(data_dir, subdir)
            os.makedirs(dir_path, mode=0o755, exist_ok=True)
        
        print(f"   - 数据目录已创建: {data_dir}")
        
    except Exception as e:
        print(f"⚠️  创建数据目录失败: {str(e)}")
