#!/bin/bash
# 会话问题诊断脚本
# 会话 ID: bc-7acc1b0a-7ef1-417e-a5b5-7033d116fb61

echo "=========================================="
echo "Cursor Agent 会话问题诊断报告"
echo "=========================================="
echo "时间: $(date)"
echo "会话 ID: bc-7acc1b0a-7ef1-417e-a5b5-7033d116fb61"
echo ""

echo "1. 系统资源检查"
echo "----------------"
echo "磁盘使用:"
df -h | grep -E "Filesystem|overlay|/dev/root"
echo ""
echo "内存使用:"
free -h
echo ""

echo "2. 进程状态检查"
echo "----------------"
echo "相关进程:"
ps aux | grep -E "node|exec-daemon|typescript" | grep -v grep
echo ""

echo "3. 网络连接检查"
echo "----------------"
echo "检查网络连通性:"
if command -v curl &> /dev/null; then
    echo "测试 GitHub 连接:"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" --max-time 5 https://github.com || echo "连接失败"
else
    echo "curl 不可用"
fi
echo ""

echo "4. Git 仓库状态"
echo "----------------"
echo "当前分支:"
git branch --show-current
echo ""
echo "最近提交:"
git log --oneline -5
echo ""
echo "未提交的更改:"
git status --short
echo ""

echo "5. 文件系统权限"
echo "----------------"
echo "工作目录权限:"
ls -ld /workspace
echo ""
echo "当前目录可写测试:"
touch /workspace/.write_test 2>&1 && rm -f /workspace/.write_test && echo "✅ 可写" || echo "❌ 不可写"
echo ""

echo "6. 环境变量检查"
echo "----------------"
echo "关键环境变量:"
env | grep -E "PATH|HOME|USER|SHELL" | head -5
echo ""

echo "=========================================="
echo "诊断完成"
echo "=========================================="
