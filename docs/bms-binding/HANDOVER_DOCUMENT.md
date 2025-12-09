# BMS 数据绑定功能开发交接文档

> **版本**: v1.0  
> **创建时间**: 2025-01-XX  
> **最后更新**: 2025-01-XX  
> **状态**: 开发中

---

## 📋 目录

1. [项目概述](#项目概述)
2. [软件架构](#软件架构)
3. [当前开发状态](#当前开发状态)
4. [剩余工作](#剩余工作)
5. [必须阅读的文档](#必须阅读的文档)
6. [代码结构说明](#代码结构说明)
7. [关键文件路径](#关键文件路径)
8. [开发规范](#开发规范)
9. [常见问题](#常见问题)

---

## 🎯 项目概述

### 项目名称
LCCU-V（储能系统物联网平台）

### 项目目标
实现 BMS（电池管理系统）数据绑定功能，将 BMS 测试面板中的变量与资产字段进行关联，实现配置化的数据展示和控制。

### 核心功能
1. **BMS 实例管理**：创建和管理 BMS 实例（二级架构/三级架构）
2. **层级配置**：配置簇数、包数、串并数等层级信息
3. **字段配置**：为每个页面（SYS/BCU/BAU/BMU/EVT）配置显示字段
4. **数据展示**：按配置动态渲染字段，从 WebSocket 获取实时数据
5. **断路器控制**：通过配置的字段实现断路器分合闸控制

### 技术栈

**前端**：
- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- shadcn/ui
- Zustand（全局状态）
- TanStack Query（服务端状态）
- React Router 7
- React Hook Form + Zod
- i18next（国际化）
- Axios

**后端**：
- Python 3.9+
- FastAPI
- SQLAlchemy 2.0（异步）
- SQLite 3
- Pydantic 2.5+
- python-jose（JWT）

---

## 🏗️ 软件架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     前端 (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ 配置端页面    │  │ 展示端页面    │  │ 组件库        │ │
│  │ - BMS管理    │  │ - 二级架构    │  │ - Tab组件     │ │
│  │ - 字段配置   │  │ - 三级架构    │  │ - 表单组件    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                  │                  │        │
│         └──────────────────┼──────────────────┘        │
│                            │                            │
│                    ┌───────▼───────┐                   │
│                    │  API 层        │                   │
│                    │  (Axios)       │                   │
│                    └───────┬───────┘                   │
└────────────────────────────┼────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  后端 (FastAPI) │
                    │  ┌────────────┐ │
                    │  │ API 路由   │ │
                    │  │ CRUD 操作  │ │
                    │  │ 审计日志   │ │
                    │  └────────────┘ │
                    │        │        │
                    │  ┌─────▼─────┐ │
                    │  │ SQLite DB │ │
                    │  └───────────┘ │
                    └────────────────┘
                             │
                    ┌────────▼────────┐
                    │  WebSocket      │
                    │  (实时数据)     │
                    └─────────────────┘
```

### 数据流

1. **配置流程**：
   ```
   用户 → 配置端页面 → API → 数据库
   ```

2. **展示流程**：
   ```
   配置端 → 数据库 → API → 展示端页面 → 渲染
   ```

3. **实时数据流程**：
   ```
   WebSocket → 浏览器内存缓存 → 展示端页面 → 渲染
   ```

### 数据库表结构

**核心表**：
- `bms_architectures` - BMS 架构定义（二级/三级）
- `bms_page_configs` - 页面配置（SYS/BCU/BAU/BMU/EVT）
- `bms_instances` - BMS 实例
- `bms_hierarchy_configs` - 层级配置（簇数、包数等）
- `bms_field_configs` - 字段配置（每个页面的显示字段）

**关联表**：
- `assets` - 资产表（BMS 实例关联的资产）
- `device_type_tags` - 设备类型标签（资产字段）
- `comm_instances` - 通信实例（DI 点）
- `point_table_points` - 点表点（DI 点）

---

## 📊 当前开发状态

### ✅ 已完成功能

#### 1. 后端 API（100% 完成）
- ✅ BMS 架构管理（CRUD）
- ✅ BMS 实例管理（CRUD）
- ✅ 层级配置管理（CRUD）
- ✅ 字段配置管理（CRUD）
- ✅ 批量导入/导出（CSV）
- ✅ 审计日志记录（所有修改操作）
- ✅ 权限检查（角色权限）
- ✅ 国际化支持（中英文）

#### 2. 前端配置端（100% 完成）
- ✅ BMS 管理页面（列表、创建、编辑、删除）
- ✅ 字段配置对话框（创建、编辑、删除）
- ✅ 层级配置表单
- ✅ 批量导入/导出功能
- ✅ 固定字段始终显示（SYS 页面）
- ✅ 字段类型判断（命令字段显示写配置，其他显示读配置）
- ✅ 国际化支持

#### 3. 前端展示端（80% 完成）
- ✅ SYS Tab（二级和三级架构）- 按配置渲染
- ✅ BCU Tab（二级和三级架构）- 按配置渲染
- ✅ BAU Tab（三级架构）- 按配置渲染
- ✅ BMU Tab（二级和三级架构）- 按配置渲染
- ✅ EVT Tab（二级和三级架构）- 按配置渲染（占位）
- ✅ WebSocket 缓存占位逻辑（无数据时显示 `--`）
- ✅ 层级选择器（根据层级配置生成虚拟列表）
- ✅ 实例选择器（支持多个 BMS 实例切换）

#### 4. 文档（100% 完成）
- ✅ 设计文档（`BMS_DATA_BINDING_DESIGN.md`）
- ✅ 数据库设计说明
- ✅ 开发规范文档

### 🚧 进行中的工作

**无**（当前所有计划功能已完成）

### ⚠️ 已知问题

1. **WebSocket 实时数据未接入**：
   - 目前使用 `realtimeValues` 状态占位
   - 需要接入实际的 WebSocket 数据源
   - 数据格式：`{ field_key: value }`

2. **断路器控制 API 未实现**：
   - 前端已实现回调函数 `handleBreakerControl`
   - 需要后端提供写入 API
   - 需要根据 `write_value` 字段写入对应值

3. **故障复位 API 未实现**：
   - 前端已实现回调函数
   - 需要后端提供故障复位 API

4. **事件记录 API 未实现**：
   - EVT Tab 目前显示占位信息
   - 需要后端提供事件记录 API

---

## 📝 剩余工作

### 高优先级

1. **WebSocket 实时数据接入** ⭐⭐⭐
   - **任务**：将 `realtimeValues` 状态与实际的 WebSocket 数据源连接
   - **位置**：`frontend/src/pages/bms/BMSDisplayLevel2Page.tsx` 和 `BMSDisplayLevel3Page.tsx`
   - **说明**：WebSocket 协议未定义，需要与后端同事确认数据格式
   - **参考**：`docs/bms-binding/BMS_WEBSOCKET_ANALYSIS.md`

2. **断路器控制 API 实现** ⭐⭐⭐
   - **任务**：实现后端 API，根据字段配置的 `write_value` 写入值
   - **位置**：`backend/app/api/bms.py`
   - **说明**：需要根据 `field_key` 找到对应的字段配置，获取 `write_device_type_tag_id`、`write_comm_instance_id`、`write_point_id` 和 `write_value`

3. **故障复位 API 实现** ⭐⭐
   - **任务**：实现后端 API，支持簇/堆级别的故障复位
   - **位置**：`backend/app/api/bms.py`

### 中优先级

4. **事件记录 API 实现** ⭐⭐
   - **任务**：实现后端 API，返回系统遥控信息
   - **位置**：`backend/app/api/bms.py`
   - **说明**：EVT Tab 目前显示占位信息

5. **拓扑图实现** ⭐
   - **任务**：在 SYS Tab 中实现拓扑图渲染
   - **位置**：`frontend/src/components/bms/BMSSysTabLevel2.tsx` 和 `BMSSysTabLevel3.tsx`
   - **说明**：目前显示"功能开发中"占位

6. **代码清理** ⭐
   - **任务**：删除展示页面中不需要的旧代码（`fetchClusterBasicInfo`、`fetchPackList` 等假数据函数）
   - **位置**：`frontend/src/pages/bms/BMSDisplayLevel2Page.tsx` 和 `BMSDisplayLevel3Page.tsx`

### 低优先级

7. **性能优化**
   - 考虑使用 `useMemo` 优化字段配置列表的排序
   - 考虑使用虚拟滚动优化大量字段的渲染

8. **错误处理增强**
   - 添加更详细的错误提示
   - 添加重试机制

---

## 📚 必须阅读的文档

### 1. 开发规范（必须阅读）

**位置**：`.cursor/rules/`
- `backend.mdc` - 后端开发规范
- `frontend.mdc` - 前端开发规范
- `mobile.mdc` - 移动端开发规范

**重要内容**：
- 技术栈清单（禁止引入新技术）
- 目录结构规范
- 代码风格规范
- 开发场景标准步骤

### 2. BMS 数据绑定设计文档（必须阅读）

**位置**：`docs/bms-binding/BMS_DATA_BINDING_DESIGN.md`

**重要内容**：
- 数据库表结构（`bms_field_configs` 等）
- 固定字段列表（SYS 页面）
- 字段配置规则
- 数据来源说明（资产字段/DI点/自定义）

### 3. 数据库设计文档

**位置**：`docs/DATABASE_DESIGN.md`

**重要内容**：
- 设备类型标签（`device_type_tags`）
- 资产映射（`asset_mappings`）
- 点表点（`point_table_points`）
- 语义类型（`MEASURE`、`STATUS`、`COMMAND` 等）

### 4. 设备文档

**位置**：`docs/device.md`

**重要内容**：
- 资产字段类型（`MEASURE`、`STATUS`、`ACCUM`、`PARAM`、`SETPOINT`、`COMMAND`、`PARAM_SET`）
- 语义类型隐式定义读写权限
- `asset_state` 内存结构（WebSocket 数据源）

### 5. WebSocket 分析文档

**位置**：`docs/bms-binding/BMS_WEBSOCKET_ANALYSIS.md`

**重要内容**：
- WebSocket 协议分析
- 实时数据获取方式

### 6. 操作步骤验证文档

**位置**：`docs/bms-binding/OPERATION_STEPS_VERIFICATION.md`

**重要内容**：
- 功能操作步骤
- 测试用例

---

## 📁 代码结构说明

### 后端结构

```
backend/
├── app/
│   ├── api/
│   │   └── bms.py              # BMS API 路由（所有 CRUD 操作）
│   ├── models/
│   │   ├── bms_architecture.py # BMS 架构模型
│   │   ├── bms_instance.py     # BMS 实例模型
│   │   ├── bms_hierarchy_config.py # 层级配置模型
│   │   └── bms_field_config.py # 字段配置模型
│   ├── schemas/
│   │   └── bms.py              # BMS Pydantic Schema
│   ├── crud/
│   │   └── bms.py              # BMS CRUD 操作
│   ├── core/
│   │   ├── permissions.py      # 权限检查
│   │   └── dependencies.py     # 审计辅助函数
│   ├── middleware/
│   │   └── audit.py            # 审计中间件
│   └── locales/
│       ├── zh_CN.json          # 中文翻译
│       └── en_US.json          # 英文翻译
└── database/
    ├── init_schema.sql         # 建表脚本
    └── migration_*.sql         # 迁移脚本
```

### 前端结构

```
frontend/
├── src/
│   ├── api/
│   │   └── bms.ts              # BMS API 调用函数
│   ├── components/
│   │   ├── bms/                # BMS Tab 组件
│   │   │   ├── BMSSysTabLevel2.tsx
│   │   │   ├── BMSSysTabLevel3.tsx
│   │   │   ├── BMSBcuTabLevel2.tsx
│   │   │   ├── BMSBcuTabLevel3.tsx
│   │   │   ├── BMSBauTabLevel3.tsx
│   │   │   ├── BMSBmuTabLevel2.tsx
│   │   │   ├── BMSBmuTabLevel3.tsx
│   │   │   └── BMSEvtTab.tsx
│   │   └── config/             # 配置端组件
│   │       ├── BMSInstanceFormDialog.tsx
│   │       ├── BMSFieldConfigDialog.tsx
│   │       ├── BMSHierarchyConfigForm.tsx
│   │       └── DeleteBMSInstanceDialog.tsx
│   ├── pages/
│   │   ├── config/
│   │   │   ├── BMSPage.tsx     # BMS 管理页面
│   │   │   └── BMSConfigPage.tsx # 字段配置页面
│   │   └── bms/
│   │       ├── BMSDisplayLevel2Page.tsx # 二级架构展示页面
│   │       └── BMSDisplayLevel3Page.tsx # 三级架构展示页面
│   ├── locales/
│   │   ├── zh-CN/
│   │   │   └── bms.json        # BMS 中文翻译
│   │   └── en-US/
│   │       └── bms.json        # BMS 英文翻译
│   └── types/
│       └── bms-api.ts          # BMS 类型定义（已废弃，使用 api/bms.ts 中的类型）
```

---

## 🔑 关键文件路径

### 后端关键文件

| 文件 | 说明 |
|------|------|
| `backend/app/api/bms.py` | BMS API 路由（所有 CRUD 操作） |
| `backend/app/models/bms_field_config.py` | 字段配置模型 |
| `backend/app/crud/bms.py` | BMS CRUD 操作 |
| `backend/app/schemas/bms.py` | BMS Pydantic Schema |
| `backend/database/init_schema.sql` | 数据库建表脚本 |

### 前端关键文件

| 文件 | 说明 |
|------|------|
| `frontend/src/api/bms.ts` | BMS API 调用函数和类型定义 |
| `frontend/src/pages/config/BMSPage.tsx` | BMS 管理页面 |
| `frontend/src/pages/config/BMSConfigPage.tsx` | 字段配置页面 |
| `frontend/src/components/config/BMSFieldConfigDialog.tsx` | 字段配置对话框 |
| `frontend/src/pages/bms/BMSDisplayLevel2Page.tsx` | 二级架构展示页面 |
| `frontend/src/pages/bms/BMSDisplayLevel3Page.tsx` | 三级架构展示页面 |
| `frontend/src/components/bms/BMSSysTabLevel2.tsx` | 二级架构 SYS Tab |
| `frontend/src/components/bms/BMSSysTabLevel3.tsx` | 三级架构 SYS Tab |
| `frontend/src/components/bms/BMSBcuTabLevel2.tsx` | 二级架构 BCU Tab |
| `frontend/src/components/bms/BMSBcuTabLevel3.tsx` | 三级架构 BCU Tab |
| `frontend/src/components/bms/BMSBauTabLevel3.tsx` | 三级架构 BAU Tab |
| `frontend/src/components/bms/BMSBmuTabLevel2.tsx` | 二级架构 BMU Tab |
| `frontend/src/components/bms/BMSBmuTabLevel3.tsx` | 三级架构 BMU Tab |
| `frontend/src/components/bms/BMSEvtTab.tsx` | EVT Tab（通用） |

### 文档关键文件

| 文件 | 说明 |
|------|------|
| `docs/bms-binding/BMS_DATA_BINDING_DESIGN.md` | **BMS 数据绑定设计文档（必须阅读）** |
| `docs/bms-binding/BMS_TABLE_DEMO.csv` | 字段配置示例数据 |
| `docs/bms-binding/BMS_WEBSOCKET_ANALYSIS.md` | WebSocket 协议分析 |
| `docs/DATABASE_DESIGN.md` | 数据库设计文档 |
| `docs/device.md` | 设备文档（资产字段类型说明） |
| `.cursor/rules/backend.mdc` | 后端开发规范 |
| `.cursor/rules/frontend.mdc` | 前端开发规范 |

---

## 📖 开发规范

### 核心原则

1. **保持一致性**：优先使用现有机制，除非绝对必要否则不引入新技术
2. **配置驱动**：所有展示内容都从配置获取，不硬编码
3. **类型安全**：100% TypeScript，无 `any` 类型
4. **国际化支持**：所有用户可见文本使用 i18n，不硬编码
5. **审计日志**：所有修改操作自动记录审计日志

### 开发流程

1. **阅读文档**：开发前必须阅读相关设计文档和开发规范
2. **参考现有实现**：查看 `app/api/auth.py` 和 `app/crud/user.py` 作为参考
3. **遵循目录结构**：按照规范放置文件
4. **添加类型定义**：所有函数都有类型注解
5. **添加国际化**：所有文本使用 `t()` 函数
6. **提交前检查**：运行 lint 检查，确保无错误

### 代码风格

- **命名规范**：
  - 组件：PascalCase（`BMSSysTabLevel2`）
  - 函数：camelCase（`getBMSFieldConfigList`）
  - 常量：UPPER_CASE（`SYS_FIXED_FIELDS`）
  - 类型：PascalCase（`BMSFieldConfig`）

- **导入顺序**：
  1. React 核心
  2. 第三方库
  3. 类型导入（`import type`）
  4. 项目内部模块

---

## ❓ 常见问题

### Q1: 如何添加新的字段配置？

**A**: 
1. 在配置页面点击"创建字段配置"
2. 填写字段信息（字段键、显示名称、数据来源等）
3. 保存后，展示页面会自动显示新字段

### Q2: SYS 页面的固定字段可以删除吗？

**A**: 
- **不可以删除**：固定字段（fault、voltage、current、power、breaker_status、breaker_open_command、breaker_close_command）必须存在
- **可以编辑**：可以编辑固定字段的数据来源绑定，但不能修改字段键、显示名称等元数据

### Q3: 如何区分读字段和写字段？

**A**: 
- **读字段**：普通字段，需要配置读数据来源（`read_device_type_tag_id` 或 `read_comm_instance_id` + `read_point_id`）
- **写字段**：命令字段（`breaker_open_command`、`breaker_close_command`），需要配置写数据来源（`write_device_type_tag_id` 或 `write_comm_instance_id` + `write_point_id`）和 `write_value`

### Q4: WebSocket 数据格式是什么？

**A**: 
- 目前 WebSocket 协议未定义
- 预期格式：`{ field_key: value }`，例如：`{ "voltage": 1250.5, "current": 1320.0 }`
- 需要与后端同事确认实际数据格式

### Q5: 如何测试字段配置？

**A**: 
1. 在配置页面创建 BMS 实例
2. 配置层级信息（簇数、包数等）
3. 为每个页面添加字段配置
4. 在展示页面选择 BMS 实例，查看字段是否正确显示

### Q6: 字段配置的数据来源有哪些？

**A**: 
1. **资产字段**（主要）：通过 `asset_mappings` 关联的资产字段
2. **DI 点**：直接关联到通信实例的 DI 点
3. **自定义**：暂时不支持（将来实现）

### Q7: 如何实现断路器控制？

**A**: 
1. 在字段配置中，为 `breaker_open_command` 和 `breaker_close_command` 配置写数据来源
2. 设置 `write_value`（分闸=0，合闸=1）
3. 前端点击按钮时，调用 `handleBreakerControl` 回调
4. **待实现**：后端 API 根据字段配置写入值

---

## 🔄 Git 分支信息

**当前分支**：`feature/local-dev`

**最近提交**：
- `2de0ab9` - feat: 实现BMS展示端动态获取配置数据
- `9c2dd2a` - fix: 修复BMS字段配置对话框isReadable/isWritable未定义错误
- `3e009c7` - fix: 修复BMS二三级架构页面标签不匹配问题
- `790d96c` - feat: 重构BMS二三级架构SYS页面，使用模块化组件

---

## 📞 联系方式

如有问题，请参考：
1. 设计文档：`docs/bms-binding/BMS_DATA_BINDING_DESIGN.md`
2. 开发规范：`.cursor/rules/backend.mdc` 和 `frontend.mdc`
3. 代码注释：关键函数都有详细注释

---

**最后更新**: 2025-01-XX  
**文档状态**: 开发中  
**下一步**: 接入 WebSocket 实时数据
