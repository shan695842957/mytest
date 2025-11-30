#!/bin/bash
# 迁移验证脚本

echo "================================"
echo "🔍 迁移完整性验证"
echo "================================"
echo ""

# 检查1：API层不应该有手动审计调用
echo "✅ 检查1：API层手动审计调用"
count=$(grep -r "AuditLogger.log" app/api/ --include="*.py" 2>/dev/null | wc -l)
if [ $count -eq 0 ]; then
    echo "   ✓ 通过：没有手动调用 AuditLogger.log()"
else
    echo "   ✗ 失败：发现 $count 处手动调用"
    grep -r "AuditLogger.log" app/api/ --include="*.py"
fi
echo ""

# 检查2：API层不应该有手动计时
echo "✅ 检查2：API层手动计时"
count=$(grep -r "start_time = time.time()" app/api/ --include="*.py" 2>/dev/null | wc -l)
if [ $count -eq 0 ]; then
    echo "   ✓ 通过：没有手动计时代码"
else
    echo "   ✗ 失败：发现 $count 处手动计时"
    grep -r "start_time = time.time()" app/api/ --include="*.py"
fi
echo ""

# 检查3：API层不应该有手动计算 duration_ms
echo "✅ 检查3：API层手动计算 duration_ms"
count=$(grep -r "duration_ms = int((time.time()" app/api/ --include="*.py" 2>/dev/null | wc -l)
if [ $count -eq 0 ]; then
    echo "   ✓ 通过：没有手动计算 duration_ms"
else
    echo "   ✗ 失败：发现 $count 处手动计算"
    grep -r "duration_ms = int((time.time()" app/api/ --include="*.py"
fi
echo ""

# 检查4：中间件已注册
echo "✅ 检查4：中间件注册"
if grep -q "app.add_middleware(AuthMiddleware)" app/main.py && \
   grep -q "app.add_middleware(AuditMiddleware)" app/main.py; then
    echo "   ✓ 通过：中间件已注册"
else
    echo "   ✗ 失败：中间件未正确注册"
fi
echo ""

# 检查5：装饰器使用
echo "✅ 检查5：装饰器使用"
count=$(grep -r "@audit_route" app/api/auth.py 2>/dev/null | wc -l)
echo "   发现 $count 个装饰器"
if [ $count -ge 5 ]; then
    echo "   ✓ 通过：装饰器已正确使用"
else
    echo "   ⚠ 警告：装饰器数量少于预期"
fi
echo ""

# 检查6：便捷函数使用
echo "✅ 检查6：便捷函数使用"
count=$(grep -r "set_audit_target" app/api/auth.py 2>/dev/null | wc -l)
echo "   发现 $count 处 set_audit_target 调用"
if [ $count -ge 5 ]; then
    echo "   ✓ 通过：便捷函数已正确使用"
else
    echo "   ⚠ 警告：便捷函数使用少于预期"
fi
echo ""

# 检查7：中间件文件存在
echo "✅ 检查7：中间件文件"
if [ -f "app/middleware/audit.py" ] && [ -f "app/middleware/auth.py" ]; then
    echo "   ✓ 通过：中间件文件存在"
else
    echo "   ✗ 失败：中间件文件缺失"
fi
echo ""

# 检查8：依赖文件存在
echo "✅ 检查8：依赖文件"
if [ -f "app/core/dependencies.py" ]; then
    echo "   ✓ 通过：依赖文件存在"
else
    echo "   ✗ 失败：依赖文件缺失"
fi
echo ""

echo "================================"
echo "📊 迁移验证完成"
echo "================================"

