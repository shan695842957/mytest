# 前端设备模块符合性检查报告

> 基于 `backend/device.md` 第11节（前端配置与操作）的要求

## ✅ 已符合的要求

### 1. 菜单结构（11.1）
- ✅ Configuration 菜单组存在
  - ✅ Device Types（设备模板）
  - ✅ Comm Templates（通信模板）
  - ✅ Comm Instances（通信实例）
  - ✅ Assets（资产）
- ✅ SOE Viewer 菜单存在

### 2. 设备模板（11.2.1）
- ✅ 列表页：名称、内部名、描述、字段数量
- ✅ 详情页两个 Tab：基本信息、业务字段
- ✅ 业务字段可按 `semantic_type` 过滤
- ✅ 字段 Dialog 包含所有必需字段
- ✅ ENUM 类型有表格式枚举编辑器（code+label）

### 3. 通信实例（11.2.3）
- ✅ 列表页展示协议类型、点表模板、轮询周期等
- ✅ 表单字段完整

### 4. 资产映射（11.2.4）
- ✅ 三栏布局（左侧业务字段、右侧信号点、中间映射编辑）
- ✅ 业务字段按 `group_name` 分组显示
- ✅ 支持选择通信实例和子点
- ✅ 支持保存/清除映射

### 5. 交互注意事项（11.4）
- ✅ 表单使用 React Hook Form + Zod
- ✅ UI 组件使用 shadcn/ui
- ✅ 滚动条/全局样式在 `src/index.css` 中配置

---

## ❌ 不符合的要求（需要修复）

### 1. 设备模板详情页 - 缺少按 `group_name` 过滤

**要求**（device.md 11.2.1）：
> 业务字段（Tags）：可按 `semantic_type`/`group_name` 过滤

**现状**：
- ✅ 有 `semantic_type` 过滤
- ❌ **缺少 `group_name` 过滤**

**文件**：`frontend/src/pages/config/DeviceTemplateDetailPage.tsx`

**修复方案**：
- 添加 `groupNameFilter` 状态
- 在筛选区域添加 `group_name` 下拉选择器
- 在 API 调用中传递 `group_name` 参数

---

### 2. 通信模板详情页 - 缺少"配置子点"功能

**要求**（device.md 11.2.2）：
> 2. Points Tab：
>    * 表格列：point_name、display_name、address、raw_type、**子点数量**；
>    * 每行提供 `编辑点` 与 **`配置子点`**。
> 4. `配置子点` Sheet：
>    * 每个子点包含 `name`、`type`、`kind`（BIT / BITS_RANGE）、bit 或 bit_from/bit_to；
>    * 支持增删行并实时预览；
>    * 保存后写入 `parse_rules_json`。

**现状**：
- ✅ 有"编辑点"功能
- ❌ **表格中没有"子点数量"列**
- ❌ **没有"配置子点"按钮/Sheet**

**文件**：`frontend/src/pages/config/CommTemplateDetailPage.tsx`

**修复方案**：
- 在表格中添加"子点数量"列（从 `parse_rules_json.sub_points` 计算）
- 添加"配置子点"按钮，打开 Sheet 对话框
- 创建 `PointSubPointsConfigSheet.tsx` 组件
- 实现子点的增删改功能，保存到 `parse_rules_json`

---

### 3. 资产创建 - 缺少向导流程

**要求**（device.md 11.2.4）：
> 2. 新建设备向导：
>    1. 基本信息：选择 `device_type`，填写 name / display_name / location / enabled。
>    2. 选择通信实例：多选 `comm_instances`，保存后写入 `asset_comm_bindings`。
>    3. 自动映射：后端按命名规则给出初始匹配统计，提供跳转至映射页。

**现状**：
- ✅ 基本信息表单完整
- ✅ 支持选择通信实例（在表单中）
- ❌ **不是向导流程（3步）**
- ❌ **缺少自动映射步骤**

**文件**：`frontend/src/components/config/AssetFormDialog.tsx`

**修复方案**：
- 将 Dialog 改为向导组件（使用 `Stepper` 或 `Tabs`）
- Step 1: 基本信息
- Step 2: 选择通信实例
- Step 3: 自动映射预览（调用后端自动映射 API，显示匹配统计）
- 完成后跳转到映射页面

---

### 4. SOE Viewer - 筛选功能不完整

**要求**（device.md 11.3）：
> 筛选卡片：时间范围（含快捷按钮）、**资产多选**、**severity 多选**、**event_type 多选**、关键字、`应用筛选`/`重置`

**现状**：
- ✅ 时间范围（含快捷按钮）
- ✅ 关键字搜索
- ✅ 应用筛选/重置按钮
- ❌ **缺少资产多选**
- ❌ **缺少 severity 多选**
- ❌ **缺少 event_type 多选**

**文件**：`frontend/src/pages/soe/SOEPage.tsx`

**修复方案**：
- 添加资产多选下拉（使用 `MultiSelect` 或 `Checkbox` 组）
- 添加 severity 多选（0-5）
- 添加 event_type 多选（从字典获取）
- 在查询参数中传递这些筛选条件

---

### 5. 交互优化 - 固定宽度改为自适应

**要求**（device.md 11.4）：
> 所有下拉/按钮都要考虑中英文长度，自适应宽度使用 `flex-1` + `min-w-[xxx]`

**现状**：
- ❌ 多处使用固定宽度：`w-[180px]`、`w-[200px]`

**需要修复的文件**：
- `frontend/src/pages/config/DeviceTemplateDetailPage.tsx` (line 201: `w-[180px]`)
- `frontend/src/pages/config/CommTemplateDetailPage.tsx` (line 193, 199: `w-[200px]`)

**修复方案**：
- 将 `w-[180px]` 改为 `flex-1 min-w-[140px]`
- 将 `w-[200px]` 改为 `flex-1 min-w-[160px]`
- 确保多语言环境下文字不会截断

---

## 📋 修复优先级

1. **高优先级**：
   - 通信模板"配置子点"功能（核心功能，避免手工 bit 运算）
   - 资产创建向导流程（提升用户体验）

2. **中优先级**：
   - SOE Viewer 筛选功能完善
   - 设备模板按 `group_name` 过滤

3. **低优先级**：
   - 交互优化（固定宽度改为自适应）

---

## 🔍 其他检查项

### 表单验证
- ✅ 所有表单使用 React Hook Form + Zod
- ✅ 验证规则完整

### 国际化
- ✅ 使用 `useTranslation` hook
- ✅ 翻译文件完整（zh-CN, en-US）

### 权限控制
- ✅ 使用 `AuthGuard` 组件
- ✅ 使用 `ProtectedRoute` 路由守卫

### API 调用
- ✅ 使用 TanStack Query
- ✅ 错误处理完整
- ⚠️ 需要检查长耗时 API 的超时配置（device.md 11.4）

---

## 📝 总结

**符合度**：约 **75%**

**主要缺失功能**：
1. 通信模板子点配置（关键功能）
2. 资产创建向导流程
3. SOE Viewer 多选筛选

**建议**：优先实现通信模板子点配置功能，这是避免手工 bit 运算的核心功能。

