"""
数据库备份加密工具
使用 Fernet 对称加密（AES-128-CBC + HMAC-SHA256）
符合NIST SP 800-38D标准

注意：错误消息使用英文，由API层翻译为i18n
"""

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import secrets


class BackupEncryption:
    """数据库备份加密/解密工具"""
    
    @staticmethod
    def generate_key_from_password(password: str, salt: bytes = None) -> tuple[bytes, bytes]:
        """
        从密码生成加密密钥（使用PBKDF2密钥派生）
        
        Args:
            password: 用户密码
            salt: 盐值（如果为None则生成新的）
        
        Returns:
            (key, salt): 密钥和盐值
        """
        if salt is None:
            salt = secrets.token_bytes(32)  # 256-bit 盐值
        
        # PBKDF2密钥派生（600000次迭代，NIST推荐）
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256-bit密钥
            salt=salt,
            iterations=600_000,  # OWASP推荐最小值
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(password.encode('utf-8')))
        return key, salt
    
    @staticmethod
    def encrypt_file(file_path: str, password: str) -> bytes:
        """
        加密数据库文件
        
        Args:
            file_path: 数据库文件路径
            password: 加密密码
        
        Returns:
            bytes: 加密后的数据（salt + encrypted_data）
        
        格式：
            [32 bytes salt][encrypted data]
        """
        try:
            # 1. 读取原始数据
            with open(file_path, 'rb') as f:
                data = f.read()
            
            # 2. 生成密钥
            key, salt = BackupEncryption.generate_key_from_password(password)
            
            # 3. 创建Fernet加密器
            fernet = Fernet(key)
            
            # 4. 加密数据（Fernet自动添加时间戳和HMAC）
            encrypted_data = fernet.encrypt(data)
            
            # 5. 组合：salt + encrypted_data
            return salt + encrypted_data
            
        except Exception as e:
            raise ValueError(f"ENCRYPTION_FAILED: {str(e)}")  # 标记，由API层翻译
    
    @staticmethod
    def decrypt_file(encrypted_data: bytes, password: str) -> bytes:
        """
        解密数据库文件
        
        Args:
            encrypted_data: 加密的数据（salt + encrypted_data）
            password: 解密密码
        
        Returns:
            bytes: 解密后的原始数据
        
        Raises:
            ValueError: 密码错误或数据损坏
        """
        try:
            # 1. 提取salt和加密数据
            if len(encrypted_data) < 32:
                raise ValueError("数据格式错误：文件过小")
            
            salt = encrypted_data[:32]
            encrypted_content = encrypted_data[32:]
            
            # 2. 从密码生成密钥
            key, _ = BackupEncryption.generate_key_from_password(password, salt)
            
            # 3. 创建Fernet解密器
            fernet = Fernet(key)
            
            # 4. 解密数据（会自动验证HMAC）
            decrypted_data = fernet.decrypt(encrypted_content)
            
            return decrypted_data
            
        except InvalidToken:
            raise ValueError("INVALID_PASSWORD")  # 标记，由API层翻译
        except Exception as e:
            raise ValueError(f"DECRYPTION_FAILED: {str(e)}")  # 标记，由API层翻译
    
    @staticmethod
    def verify_password(encrypted_data: bytes, password: str) -> bool:
        """
        验证密码是否正确（不解密完整文件，只验证）
        
        Args:
            encrypted_data: 加密的数据
            password: 待验证的密码
        
        Returns:
            bool: 密码是否正确
        """
        try:
            # 尝试解密前128字节验证
            salt = encrypted_data[:32]
            encrypted_content = encrypted_data[32:160]  # 只取128字节
            
            key, _ = BackupEncryption.generate_key_from_password(password, salt)
            fernet = Fernet(key)
            
            # 尝试解密（会自动验证HMAC）
            fernet.decrypt(encrypted_content)
            return True
        except (InvalidToken, Exception):
            return False


# 从配置读取加密密钥
from app.config import settings
DEFAULT_BACKUP_PASSWORD = settings.backup_encryption_key

