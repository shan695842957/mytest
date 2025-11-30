# 🛠️ 网络诊断工具使用指南

## 📦 工具清单

### 已实现的4个工具

| 工具 | 功能 | 权限 | 路由 |
|------|------|------|------|
| **Ping测试** | 网络连通性测试 | 所有角色 | `/tools/ping` |
| **端口扫描** | 检查端口占用+终止进程 | Dev+Op | `/tools/port-scan` |
| **ARP表查看** | IP-MAC地址映射 | Dev+Op | `/tools/arp` |
| **路由追踪** | 网络路径分析 | Dev+Op | `/tools/traceroute` |

---

## 🎯 统一架构设计

### 后端：100%统一ApiResponse格式

```python
# ✅ 正确：所有响应都使用ApiResponse
return success_response(
    data=result_data,
    message=t("tools.success.xxx", locale),  # 成功时code=0
    code=503,  # 错误时code!=0
    locale=locale,
    request_id=request_id
)

# success_response内部逻辑
success=(code == 0)  # code=0时True，否则False
```

### 前端：统一错误检查

```typescript
onSuccess: (response) => {
  // 1. 保存数据
  setResult(response.data)
  
  // 2. 检查错误状态
  if (!response.success || response.code !== 0) {
    toast.error(response.message)  // ← 显示后端i18n翻译的消息
    return
  }
  
  // 3. 正常流程
  toast.success(...)
}

onError: (error: any) => {
  // 只处理网络错误（后端不可达）
  toast.error(error.message || t('common:error.unknown'))
}
```

---

## 📊 API规范

### 成功响应

```json
{
  "success": true,
  "code": 0,
  "message": "Ping测试完成",
  "data": { ... },
  "metadata": { ... }
}
```

### 错误响应（业务错误）

```json
{
  "success": false,
  "code": 503,
  "message": "系统未安装traceroute命令，请先安装：sudo apt install traceroute",
  "data": { ... },
  "metadata": { ... }
}
```

**注意：HTTP状态码始终是200，通过`success`和`code`字段区分成功/失败**

---

## 🔧 使用指南

### 1. Ping测试

```
输入：
- 目标地址：baidu.com
- Ping次数：4
- 超时时间：5秒
- 指定网卡：不指定（可选）

输出：
- 发送/接收/丢失数据包
- 丢包率
- 最小/平均/最大延迟
- 详细输出
```

### 2. 端口扫描

```
输入：
- 端口号：8000（自动扫描本地）

输出：
- 是否被占用
- 占用进程信息（PID/名称/用户/命令行）
- 协议类型（TCP/UDP）
- 可终止进程（危险操作）
```

### 3. ARP表查看

```
操作：
- 点击【刷新ARP表】

输出：
- IP地址
- MAC地址
- 网卡接口
- 类型（动态/静态）
```

### 4. 路由追踪

```
输入：
- 目标地址：baidu.com
- 最大跳数：30
- 超时时间：5秒

输出：
- 每一跳的路由信息
- IP地址和主机名
- 3次往返延迟
- 平均延迟
- 详细输出
```

---

## ⚠️ 注意事项

### Traceroute需要安装

```bash
# 检查是否安装
which traceroute

# 如果未安装
sudo apt install traceroute  # Ubuntu/Debian
sudo yum install traceroute  # RHEL/CentOS
```

**未安装时前端会显示友好提示，不会崩溃** ✅

### 端口扫描只扫描本地

- 只能扫描`127.0.0.1`（本机）
- 不支持远程主机扫描
- 用于检查本地端口冲突

### Kill进程需要权限

- 只能终止当前用户的进程
- 系统进程可能无权限终止
- 操作前有二次确认对话框

---

## 🔒 权限控制

| 工具 | Developer | Operator | User |
|------|-----------|----------|------|
| Ping | ✅ | ✅ | ✅ |
| Port Scan | ✅ | ✅ | ❌ |
| ARP Table | ✅ | ✅ | ❌ |
| Traceroute | ✅ | ✅ | ❌ |

---

## 📈 性能说明

### 不使用数据库

- ❌ 所有工具都不使用业务数据库
- ✅ 只在认证时查询users表（5-10ms）
- ✅ 不影响业务性能

### 会阻塞当前请求

| 工具 | 典型耗时 |
|------|---------|
| Ping | 5秒 |
| Port Scan | 0.5秒 |
| ARP Table | 1秒 |
| Traceroute | 30秒 |

**但不影响其他并发请求（独立线程）** ✅

---

## ✅ 规则遵守

- ✅ 后端：100%使用ApiResponse统一格式
- ✅ 后端：所有文本使用t()函数
- ✅ 后端：所有工具都有权限检查
- ✅ 前端：100% i18n，0个硬编码文本
- ✅ 前端：统一错误检查逻辑
- ✅ 0个新依赖

---

**生成时间：2025-11-11**  
**版本：v0.4.0**  
**状态：生产就绪** ✅

