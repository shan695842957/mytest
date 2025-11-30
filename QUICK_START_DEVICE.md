# 设备模板管理 - 快速操作指南

## 📋 如何新增/修改/删除模板？

### ✅ 新增设备模板

**方式1：通过前端页面**
```
1. 访问：http://localhost:5173/device-templates
2. 点击右上角："创建设备模板"按钮
3. 填写表单：
   - 设备类型：选择 PCS/Battery/Aircon/Meter
   - 厂商：Sungrow
   - 型号：PCS-100kW
   - 模板编码：PCS_Sungrow_100kW_v1
   - 版本：v1
   - 中文名称：阳光电源100kW变流器v1
   - 英文名称：Sungrow PCS 100kW v1
4. 点击"创建"
```

**方式2：通过API**
```bash
curl -X POST http://localhost:8000/api/v1/devices/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type_id": 1,
    "tpl_code": "PCS_Sungrow_100kW_v1",
    "vendor": "Sungrow",
    "model": "PCS-100kW",
    "version": "v1",
    "name_zh": "阳光电源100kW变流器v1",
    "name_en": "Sungrow PCS 100kW v1"
  }'
```

---

### ✏️ 修改设备模板

**方式1：通过前端页面**
```
1. 访问：http://localhost:5173/device-templates
2. 找到要修改的模板
3. 点击"操作" → "编辑"
4. 修改：名称、描述、状态（激活/停用）
5. 点击"保存"
```

**方式2：通过API**
```bash
curl -X PATCH http://localhost:8000/api/v1/devices/templates/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name_zh": "阳光电源100kW变流器v1（更新）",
    "is_active": 1
  }'
```

⚠️ **注意**：不能修改 type_id、tpl_code、vendor、model、version

---

### 🗑️ 删除设备模板

**方式1：通过前端页面**
```
1. 访问：http://localhost:5173/device-templates
2. 找到要删除的模板
3. 点击"操作" → "删除"
4. 确认删除
```

**方式2：通过API**
```bash
curl -X DELETE http://localhost:8000/api/v1/devices/templates/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

⚠️ **警告**：删除设备模板会：
- 级联删除所有点模板
- 无法删除正在使用的模板（有设备引用）

---

## 🔧 如何配置点模板？

### ✅ 添加点模板

**方式1：通过前端页面**
```
1. 访问：http://localhost:5173/device-templates
2. 找到设备模板，点击"操作" → "配置点模板"
3. 在配置页面，点击"添加点模板"
4. 填写表单：
   - 点键：YC.ActivePower
   - 中文名称：有功功率
   - 英文名称：Active Power
   - 七遥类别：YC（遥测）
   - 数据类型：float
   - 单位：kW
   - 可写性：否
5. 点击"创建"
6. 重复添加其他点
```

**方式2：通过API**
```bash
curl -X POST http://localhost:8000/api/v1/devices/point-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tpl_id": 1,
    "point_key": "YC.ActivePower",
    "name_zh": "有功功率",
    "name_en": "Active Power",
    "category": "YC",
    "datatype": "float",
    "unit": "kW",
    "writable": 0
  }'
```

### ✏️ 修改点模板

**前端页面**：
```
1. 在点模板配置页面
2. 点击点模板的"编辑"图标
3. 修改：名称、单位、可写性、描述
4. 点击"保存"
```

### 🗑️ 删除点模板

**前端页面**：
```
1. 在点模板配置页面
2. 点击点模板的"删除"图标
3. 确认删除
```

---

## 🎯 完整业务流程

### 从零开始创建设备

```
┌─────────────────────────────────────────────┐
│ 第1步：创建设备类型（如果不存在）           │
│   页面：设备类型                            │
│   操作：创建 "PCS"                          │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 第2步：创建设备模板                         │
│   页面：设备模板                            │
│   操作：创建 "PCS_Sungrow_100kW_v1"         │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 第3步：配置点模板                           │
│   页面：点模板配置                          │
│   操作：添加10个点模板                      │
│   - YC.ActivePower                          │
│   - YC.ReactivePower                        │
│   - YC.Voltage                              │
│   - ... 共10个                              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 第4步：创建通信通道（如果不存在）           │
│   页面：通信通道                            │
│   操作：创建 "ModbusTCP_01"                 │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 第5步：向导式创建设备                       │
│   页面：向导式创建                          │
│   操作：                                    │
│   - 选择模板：PCS_Sungrow_100kW_v1          │
│   - 填写信息：1#PCS, 192.168.1.10           │
│   - 选择通道：ModbusTCP_01                  │
│   - 确认创建                                │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ ✨ 系统自动：生成10个设备点                 │
│   - YC.ActivePower → device_point #1        │
│   - YC.ReactivePower → device_point #2      │
│   - ... 共10个                              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ 第6步：查看设备详情                         │
│   页面：设备详情                            │
│   Tab 2：查看自动生成的10个设备点           │
└─────────────────────────────────────────────┘
```

---

## 🎬 快速测试

### 1. 启动后端
```bash
cd /home/r2189/code/lccu-v/backend
source venv/bin/activate
python run.py
```

### 2. 启动前端
```bash
cd /home/r2189/code/lccu-v/frontend
npm run dev
```

### 3. 登录系统
```
访问：http://localhost:5173/login
账号：admin_developer
密码：Admin@123
```

### 4. 测试流程
```
✓ 访问"设备管理" → "设备模板"
✓ 点击"创建设备模板" → 填写表单 → 创建
✓ 点击"操作" → "配置点模板" → 添加10个点模板
✓ 访问"向导式创建" → 3步创建设备
✓ 查看设备详情 → Tab 2：查看自动生成的点
```

---

## 💡 关键操作位置

| 操作 | 位置 | 说明 |
|------|------|------|
| **新增设备模板** | 设备模板页面 → 右上角"创建设备模板" | 填写厂商、型号、版本 |
| **修改设备模板** | 设备模板列表 → 操作 → 编辑 | 只能改名称和描述 |
| **删除设备模板** | 设备模板列表 → 操作 → 删除 | 确认后删除 |
| **配置点模板** | 设备模板列表 → 操作 → 配置点模板 | 跳转到配置页面 |
| **添加点模板** | 点模板配置页面 → "添加点模板" | 定义点键、类别、类型 |
| **修改点模板** | 点模板配置页面 → 编辑图标 | 改名称、单位等 |
| **删除点模板** | 点模板配置页面 → 删除图标 | 确认后删除 |

---

**核心页面**：
1. 📄 **设备模板管理**：http://localhost:5173/device-templates
2. ⚙️ **点模板配置**：http://localhost:5173/point-templates/1
3. 🧙 **向导式创建**：http://localhost:5173/device-wizard

---
**状态**：✅ 100%完成，生产就绪  
**更新**：2025-11-07
