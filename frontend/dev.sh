#!/bin/bash
# 前端开发服务器启动脚本（确保使用正确的 Node.js 版本）

# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 切换到 Node.js 20
nvm use 20

# 确保使用 nvm 的 Node.js（移除系统 Node.js 路径）
export PATH=$(echo $PATH | tr ':' '\n' | grep -v '/usr/local/opt/node@18' | tr '\n' ':' | sed 's/:$//')

# 验证 Node.js 版本
echo "当前 Node.js 版本: $(node --version)"
echo "Node.js 路径: $(which node)"
echo ""

# 启动开发服务器
npm run dev

