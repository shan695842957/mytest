"""
应用配置管理
使用 pydantic-settings 管理环境变量
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置"""
    
    # 应用基础配置
    app_name: str = "LCCU-V API"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "info"
    
    # 数据库配置
    database_url: str = "sqlite+aiosqlite:///./data/app.db"
    
    # 国际化配置
    default_locale: str = "zh_CN"
    supported_locales: List[str] = ["zh_CN", "en_US"]
    
    # API 配置
    api_prefix: str = "/api/v1"
    
    # JWT 配置
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24小时
    
    # API 安全配置
    rate_limit_per_minute: int = 60  # 每分钟请求限制
    
    # 数据库备份加密配置
    backup_encryption_key: str = "LCCU-V-Backup-Secure-2025"  # 备份加密密钥（生产环境应修改）
    
    # CORS 配置（支持多个前端地址）
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:5175",
        "http://localhost:5177",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


# 全局配置实例
settings = Settings()
