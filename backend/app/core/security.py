"""
安全相关功能
包含密码哈希、JWT Token 生成和验证
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt

from app.config import settings


# JWT 配置
SECRET_KEY = "your-secret-key-change-in-production"  # 生产环境请使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小时


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码
    
    Args:
        plain_password: 明文密码
        hashed_password: 哈希密码
    
    Returns:
        True 如果密码匹配，否则 False
    """
    # 使用 bcrypt 直接验证（避免 passlib 兼容性问题）
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
    )


def get_password_hash(password: str) -> str:
    """
    生成密码哈希
    
    Args:
        password: 明文密码（会自动截断到 72 字节）
    
    Returns:
        哈希后的密码（字符串格式）
    
    注意：
        bcrypt 限制密码最长 72 字节，超过部分会被自动截断
    """
    # bcrypt 限制：密码不能超过 72 字节
    password_bytes = password.encode('utf-8')[:72]
    
    # 生成盐并哈希
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # 返回字符串格式（数据库存储）
    return hashed.decode('utf-8')


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    创建 JWT Access Token
    
    Args:
        data: 要编码的数据（通常包含 user_id, username, role）
        expires_delta: 过期时间增量（默认使用配置的过期时间）
    
    Returns:
        JWT Token 字符串
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    解码 JWT Access Token
    
    Args:
        token: JWT Token 字符串
    
    Returns:
        解码后的数据字典，如果 Token 无效则返回 None
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
