#!/bin/bash
# 快速启动脚本

echo "🚀 启动 LCCU-V Backend API"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装依赖..."
pip install -q -r requirements.txt

# 启动服务
echo "✅ 启动开发服务器..."
echo "📄 API 文档: http://localhost:18000/docs"
echo "🏥 健康检查: http://localhost:18000/api/v1/health"
echo ""
python run.py

