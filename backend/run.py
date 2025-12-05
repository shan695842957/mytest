"""
开发服务器启动脚本
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.server_host,  # 从环境变量读取，默认 0.0.0.0
        port=settings.server_port,  # 从环境变量读取，默认 18000
        reload=True,  # 开发模式自动重载
        log_level=settings.log_level
    )

