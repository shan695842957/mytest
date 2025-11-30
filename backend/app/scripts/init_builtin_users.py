"""
初始化内置账号脚本
在应用启动时自动创建内置账号（如果不存在）
"""

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash


# 内置账号配置
BUILTIN_USERS = [
    {
        "username": "admin_developer",
        "password": "Admin@123",  # 初始密码，生产环境请立即修改
        "role": UserRole.DEVELOPER,
    },
    {
        "username": "admin_operator",
        "password": "Admin@123",
        "role": UserRole.OPERATOR,
    },
    {
        "username": "admin_user",
        "password": "Admin@123",
        "role": UserRole.USER,
    }
]


async def init_builtin_users():
    """
    初始化内置账号
    
    如果内置账号不存在，则创建；如果已存在，则跳过
    """
    async with AsyncSessionLocal() as db:
        for user_data in BUILTIN_USERS:
            # 检查用户是否已存在
            result = await db.execute(
                select(User).where(User.username == user_data["username"])
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"  ⏭️  内置账号 {user_data['username']} 已存在，跳过")
                continue
            
            # 创建内置账号
            user = User(
                username=user_data["username"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_builtin=True,
                is_active=True,
                created_by=None  # 内置账号没有创建者
            )
            
            db.add(user)
            print(f"  ✅ 创建内置账号: {user_data['username']} ({user_data['role'].value})")
        
        await db.commit()


if __name__ == "__main__":
    """
    独立运行脚本（用于手动初始化）
    
    使用方法：
        python -m app.scripts.init_builtin_users
    """
    import asyncio
    
    print("🔧 开始初始化内置账号...")
    asyncio.run(init_builtin_users())
    print("✅ 内置账号初始化完成！")

