"""
用户 CRUD 操作
"""

from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.core.security import get_password_hash


class UserCRUD:
    """用户数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, user_id: int) -> Optional[User]:
        """根据 ID 获取用户"""
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_username(self, db: AsyncSession, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        result = await db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None
    ) -> List[User]:
        """
        获取用户列表
        
        Args:
            db: 数据库会话
            skip: 跳过记录数
            limit: 限制记录数
            role: 按角色过滤（可选）
        """
        query = select(User)
        
        if role:
            query = query.where(User.role == role)
        
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def get_created_by(
        self,
        db: AsyncSession,
        creator_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """
        获取指定用户创建的所有账号
        
        Args:
            db: 数据库会话
            creator_id: 创建者ID
            skip: 跳过记录数
            limit: 限制记录数
        """
        result = await db.execute(
            select(User)
            .where(User.created_by == creator_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def get_by_role(
        self,
        db: AsyncSession,
        role: UserRole,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """获取指定角色的用户列表"""
        result = await db.execute(
            select(User)
            .where(User.role == role)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
    
    async def create(
        self,
        db: AsyncSession,
        user_in: UserCreate,
        creator_id: Optional[int] = None
    ) -> User:
        """
        创建用户
        
        Args:
            db: 数据库会话
            user_in: 用户创建数据
            creator_id: 创建者ID（可选）
        """
        hashed_password = get_password_hash(user_in.password)
        
        db_user = User(
            username=user_in.username,
            hashed_password=hashed_password,
            role=user_in.role,
            is_builtin=False,
            is_active=True,
            created_by=creator_id
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        return db_user
    
    async def update_password(
        self,
        db: AsyncSession,
        user: User,
        new_password: str
    ) -> User:
        """
        更新用户密码
        
        Args:
            db: 数据库会话
            user: 用户对象
            new_password: 新密码（明文）
        """
        user.hashed_password = get_password_hash(new_password)
        await db.commit()
        await db.refresh(user)
        return user
    
    async def update_active_status(
        self,
        db: AsyncSession,
        user: User,
        is_active: bool
    ) -> User:
        """
        更新用户激活状态
        
        Args:
            db: 数据库会话
            user: 用户对象
            is_active: 是否激活
        """
        user.is_active = is_active
        await db.commit()
        await db.refresh(user)
        return user
    
    async def delete(self, db: AsyncSession, user: User) -> bool:
        """
        删除用户
        
        Args:
            db: 数据库会话
            user: 用户对象
        
        Returns:
            True 如果删除成功
        """
        # 内置账号不可删除
        if user.is_builtin:
            return False
        
        await db.delete(user)
        await db.commit()
        return True
    
    async def is_username_taken(self, db: AsyncSession, username: str) -> bool:
        """检查用户名是否已被占用"""
        user = await self.get_by_username(db, username)
        return user is not None


# 全局实例
user_crud = UserCRUD()

