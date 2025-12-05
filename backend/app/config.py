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
    
    # 服务器配置
    server_host: str = "0.0.0.0"  # 监听地址，0.0.0.0 允许所有网络接口访问
    server_port: int = 18000  # 监听端口
    
    # 数据库配置
    database_url: str = "sqlite+aiosqlite:///./data/app.db"  # 数据库连接URL
    
    # API 配置
    api_prefix: str = "/api/v1"  # API 路径前缀
    
    # JWT 配置（生产环境必须修改）
    secret_key: str = "your-secret-key-here-change-in-production"  # JWT 密钥（生产环境必须修改）
    algorithm: str = "HS256"  # JWT 算法
    access_token_expire_minutes: int = 1440  # Token 过期时间（分钟），默认24小时
    
    # API 安全配置
    rate_limit_per_minute: int = 60  # 每分钟请求限制
    
    # 数据库备份加密配置（生产环境必须修改）
    backup_encryption_key: str = "LCCU-V-Backup-Secure-2025"  # 备份加密密钥（生产环境必须修改）
    
    # CORS 配置
    cors_allow_all: bool = True  # 开发模式：允许所有来源（方便局域网访问）
    # 生产模式：当 cors_allow_all=False 时，使用此列表配置允许的前端地址
    # 通过环境变量 CORS_ORIGINS 配置，例如：CORS_ORIGINS=["https://example.com","https://app.example.com"]
    cors_origins: List[str] = []  # 生产环境通过环境变量配置
    
    # 国际化配置
    default_locale: str = "zh_CN"  # 默认语言
    supported_locales: List[str] = ["zh_CN", "en_US"]  # 支持的语言列表
    
    # 生产模式：当 cors_allow_all=False 时，使用此列表配置允许的前端地址
    # 通过环境变量 CORS_ORIGINS 配置，例如：CORS_ORIGINS=["https://example.com","https://app.example.com"]
    cors_origins: List[str] = []  # 生产环境通过环境变量配置
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


# 全局配置实例
settings = Settings()
