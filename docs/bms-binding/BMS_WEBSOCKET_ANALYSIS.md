# BMS 实时数据需求与现有设计匹配度分析

> **分析时间**: 2025-01-XX  
> **分析目的**: 检查现有实时数据设计（WebSocket + asset_state）是否能满足BMS展示页面的需求

---

## 1. 现有设计概述（来自 device.md）

### 1.1 实时数据架构

根据 `device.md` 第8.2节和第9.2节：

1. **内存结构 `asset_state`**：
   ```python
   asset_state: dict[int, dict[str, Any]]
   # 示例：
   asset_state[1] = {
     "RUN_MODE": "自动",
     "OUTLET_PRESSURE": 12.5,
     "MOTOR_CURRENT": 37.0,
     "ALM_LOW_PRESS": True,
     ...
   }
   ```

2. **更新流程**：
   - A进程采集数据 → 通过NNG发送给B进程
   - B进程通过 `mapping_index[instance_id][point_name]` 找到所有业务字段
   - B进程更新 `asset_state[asset_id][asset_tag_name]`
   - **B进程通过 WebSocket 推送到前端**

3. **WebSocket推送内容**：
   - 光字牌状态（业务字段的当前值）
   - 实时SOE（事件顺序记录）

---

## 2. BMS展示页面的实时数据需求

### 2.1 数据来源

根据 `BMS_DATA_BINDING_DESIGN.md`：

1. **主要来源**：资产字段（通过 `asset_mappings` 关联）
   - 字段配置：`bms_field_configs.read_device_type_tag_id` → `device_type_tags.id`
   - 数据获取：从 `asset_state[asset_id][tag_name]` 获取

2. **次要来源**：DI点（某些BMS的DO量）
   - 字段配置：`bms_field_configs.read_comm_instance_id` + `read_point_id`
   - 数据获取：需要从通信实例的实时数据获取（**不在asset_state中**）

3. **拓扑图数据**：
   - 多个簇/包的数据（每个簇/包都有独立的字段值）
   - 需要根据层级配置动态生成节点编号（第X簇、第X包）

### 2.2 数据更新频率

- **固定字段**：电压、电流、功率、故障状态等（需要实时更新）
- **动态字段**：SOC、SOH、SOS等（需要实时更新）
- **拓扑图节点**：每个簇/包的电压、电流、SOC等（需要实时更新）
- **遥测数据**：BCU/BAU页面的所有遥测量（需要实时更新）
- **遥信数据**：BCU/BAU页面的所有遥信量（需要实时更新，包括布尔/枚举/位域）

### 2.3 写操作需求

- **断路器控制**：需要写COMMAND类型的资产字段或DI点
- **故障复位**：需要写COMMAND类型的资产字段

---

## 3. 现有设计能否满足需求？

### ✅ 3.1 资产字段数据 - **可以满足**

**现有设计**：
- `asset_state[asset_id][tag_name]` 存储所有资产字段的实时值
- WebSocket推送 `asset_state` 的更新

**BMS需求**：
- 通过 `bms_field_configs.read_device_type_tag_id` 关联到 `device_type_tags`
- 从 `asset_state[asset_id][tag_name]` 获取数据

**结论**：✅ **完全匹配**，可以直接使用

---

### ⚠️ 3.2 DI点数据 - **部分满足，需要扩展**

**现有设计**：
- `asset_state` 只存储资产字段（通过 `asset_mappings` 映射）
- **DI点数据不在 `asset_state` 中**

**BMS需求**：
- 某些字段需要从DI点获取（`bms_field_configs.read_comm_instance_id` + `read_point_id`）
- 例如：某些BMS的DO量，直接关联到通信实例的DI点

**问题**：
1. ❌ **DI点数据不在 `asset_state` 中**，无法通过WebSocket推送
2. ❌ **需要额外的数据结构**存储DI点的实时值
3. ❌ **需要扩展WebSocket消息格式**，支持DI点数据推送

**解决方案**：
- 方案1：扩展 `asset_state` 结构，支持DI点数据
  ```python
  # 扩展后的结构
  asset_state[asset_id] = {
    "RUN_MODE": "自动",  # 资产字段
    "DI_POINT_PLC01_StatusWord2": 12345,  # DI点数据（通过instance_name + point_name标识）
  }
  ```
- 方案2：创建独立的 `di_point_state` 结构
  ```python
  di_point_state: dict[str, dict[str, Any]]
  # 示例：
  di_point_state["PLC-01"]["StatusWord2"] = {
    "raw_value": 12345,
    "eng_value": 12.345,
    "quality": 0
  }
  ```
- 方案3：前端轮询DI点数据（不推荐，性能差）

**推荐**：方案1（扩展 `asset_state`），因为：
- 统一数据结构，便于WebSocket推送
- 前端无需区分数据来源（资产字段 vs DI点）
- 保持现有架构的一致性

---

### ⚠️ 3.3 拓扑图数据 - **需要特殊处理**

**BMS需求**：
- 拓扑图需要显示多个簇/包的数据
- 每个簇/包都有独立的字段值（电压、电流、SOC等）
- 节点数量动态（从 `bms_hierarchy_configs` 获取）

**现有设计**：
- `asset_state[asset_id]` 只存储**单个资产**的业务字段
- **无法直接支持"一个资产下的多个子节点"的数据结构**

**问题**：
1. ❌ **拓扑图节点数据不在 `asset_state` 中**
2. ❌ **需要支持层级数据**（堆→簇→包→单体）
3. ❌ **需要动态生成节点编号**（第X簇、第X包）

**解决方案**：
- 方案1：扩展 `asset_state` 结构，支持层级数据
  ```python
  asset_state[asset_id] = {
    "CLUSTER_1_VOLTAGE": 1250.5,  # 簇1的电压
    "CLUSTER_1_CURRENT": 1320.0,   # 簇1的电流
    "CLUSTER_1_SOC": 12.7,         # 簇1的SOC
    "CLUSTER_2_VOLTAGE": 1251.0,   # 簇2的电压
    "PACK_1_1_VOLTAGE": 125.0,     # 簇1包1的电压
    "PACK_1_1_SOC": 93.0,          # 簇1包1的SOC
  }
  ```
  - **优点**：统一数据结构，便于WebSocket推送
  - **缺点**：字段名需要包含层级信息（簇编号、包编号），命名复杂

- 方案2：在BMS配置中为每个节点创建"虚拟资产"
  - 为每个簇/包创建独立的资产记录
  - 每个资产有自己的 `asset_state`
  - **缺点**：数据库设计复杂，不符合现有架构

- 方案3：前端根据配置动态组装数据
  - 后端返回基础数据（簇/包的字段值）
  - 前端根据 `bms_hierarchy_configs` 动态生成节点编号
  - **优点**：保持现有架构简单
  - **缺点**：需要后端API支持层级数据查询

**推荐**：方案1（扩展 `asset_state`），但需要：
- 在字段配置中支持层级标识（如 `cluster_number`、`pack_number`）
- 在 `bms_field_configs` 或 `bms_topology_field_configs` 中添加层级信息
- WebSocket推送时包含层级信息

---

### ⚠️ 3.4 写操作 - **可以满足，但需要确认**

**BMS需求**：
- 断路器控制：写COMMAND类型的资产字段或DI点
- 故障复位：写COMMAND类型的资产字段

**现有设计**（device.md 第9.3节）：
- 支持通过资产字段写入（SETPOINT/COMMAND/PARAM_SET）
- 支持通过通信实例写入（WRITE_POINT消息）

**结论**：✅ **可以满足**，但需要：
- 确认BMS字段配置中的 `write_device_type_tag_id` 或 `write_comm_instance_id` + `write_point_id` 是否正确配置
- 确认写操作的审计日志记录（已通过 `@audit_route` 实现）

---

## 4. 关键问题总结

### ❌ 问题1：DI点数据不在 asset_state 中

**影响**：
- BMS字段配置中如果使用 `source_type='di_point'`，无法通过WebSocket获取实时数据
- 只能通过HTTP轮询，性能较差

**解决方案**：
- 扩展 `asset_state` 结构，支持DI点数据
- 或创建独立的 `di_point_state` 结构，并通过WebSocket推送

---

### ❌ 问题2：拓扑图层级数据不在 asset_state 中

**影响**：
- 拓扑图需要显示多个簇/包的数据，但 `asset_state` 只存储单个资产的字段
- 无法直接通过 `asset_state[asset_id]` 获取所有簇/包的数据

**解决方案**：
- 扩展 `asset_state` 结构，支持层级数据（如 `CLUSTER_1_VOLTAGE`、`PACK_1_1_VOLTAGE`）
- 或在字段配置中添加层级标识（`cluster_number`、`pack_number`）

---

### ⚠️ 问题3：WebSocket消息格式未定义

**影响**：
- `device.md` 只提到"通过 WebSocket 推送"，但没有定义具体的消息格式
- 前端无法知道如何接收和解析WebSocket消息

**需要确认**：
- WebSocket消息格式是什么？
- 是否支持订阅特定资产的数据？
- 是否支持订阅特定字段的数据？
- 消息更新频率是多少？

**建议**：
- 定义WebSocket消息格式（JSON格式）
- 支持订阅特定资产（`subscribe: asset_id`）
- 支持订阅特定字段（`subscribe: asset_id, field_names: [...]`）
- 消息格式示例：
  ```json
  {
    "type": "asset_state_update",
    "asset_id": 1,
    "fields": {
      "RUN_MODE": "自动",
      "OUTLET_PRESSURE": 12.5,
      "ALM_LOW_PRESS": true
    },
    "timestamp": "2025-01-XX 10:00:00"
  }
  ```

---

### ⚠️ 问题4：拓扑图节点数据的动态生成

**影响**：
- 拓扑图节点数量是动态的（从 `bms_hierarchy_configs` 获取）
- 每个节点的字段值需要根据配置动态获取

**需要确认**：
- 后端如何根据 `bms_hierarchy_configs` 生成节点数据？
- 前端如何知道哪些字段属于哪个节点？

**建议**：
- 在 `bms_topology_field_configs` 中添加 `cluster_number` 和 `pack_number` 字段
- 后端API返回时，按节点组织数据：
  ```json
  {
    "topology_data": {
      "clusters": [
        {
          "cluster_number": 1,
          "fields": {
            "voltage": 1250.5,
            "current": 1320.0,
            "soc": 12.7
          }
        },
        {
          "cluster_number": 2,
          "fields": {...}
        }
      ]
    }
  }
  ```

---

## 5. 不满足需求的情况

### ❌ 情况1：DI点数据无法通过WebSocket获取

**现状**：
- `asset_state` 只存储资产字段数据
- DI点数据不在 `asset_state` 中

**影响**：
- BMS字段配置中如果使用 `source_type='di_point'`，只能通过HTTP轮询
- 无法实现真正的实时更新

**解决方案**：
- 扩展 `asset_state` 结构，支持DI点数据
- 或创建独立的DI点状态结构，并通过WebSocket推送

---

### ❌ 情况2：拓扑图节点数据无法直接获取

**现状**：
- `asset_state[asset_id]` 只存储单个资产的业务字段
- 无法直接获取"一个资产下的多个子节点"的数据

**影响**：
- 拓扑图需要显示多个簇/包的数据，但无法通过 `asset_state` 直接获取
- 需要额外的API或数据结构支持

**解决方案**：
- 扩展 `asset_state` 结构，支持层级数据
- 或在字段配置中添加层级标识，后端API按节点组织数据

---

### ⚠️ 情况3：WebSocket实现缺失

**现状**：
- `device.md` 提到"通过 WebSocket 推送"，但代码中未实现
- 前端目前使用 `setInterval` 轮询（每5秒）

**影响**：
- 无法实现真正的实时更新
- 轮询方式性能较差，服务器压力大

**解决方案**：
- 实现WebSocket服务器（FastAPI支持WebSocket）
- 定义WebSocket消息格式
- 前端连接WebSocket，接收实时数据更新

---

## 6. 建议的改进方案

### 6.1 扩展 asset_state 结构

```python
# 扩展后的 asset_state 结构
asset_state: dict[int, dict[str, Any]]

# 支持资产字段
asset_state[asset_id]["RUN_MODE"] = "自动"

# 支持DI点（通过 instance_name + point_name 标识）
asset_state[asset_id]["DI_PLC01_StatusWord2"] = 12345

# 支持层级数据（通过层级标识）
asset_state[asset_id]["CLUSTER_1_VOLTAGE"] = 1250.5
asset_state[asset_id]["PACK_1_1_VOLTAGE"] = 125.0
```

**优点**：
- 统一数据结构
- 便于WebSocket推送
- 前端无需区分数据来源

**缺点**：
- 字段名需要包含层级信息，命名复杂
- 需要修改现有的 `asset_state` 更新逻辑

---

### 6.2 实现WebSocket服务器

```python
# backend/app/api/websocket.py
from fastapi import WebSocket

@app.websocket("/ws/asset-state/{asset_id}")
async def websocket_asset_state(websocket: WebSocket, asset_id: int):
    await websocket.accept()
    # 订阅资产状态更新
    # 当 asset_state[asset_id] 更新时，推送消息
```

**消息格式**：
```json
{
  "type": "asset_state_update",
  "asset_id": 1,
  "fields": {
    "RUN_MODE": "自动",
    "OUTLET_PRESSURE": 12.5
  },
  "timestamp": "2025-01-XX 10:00:00"
}
```

---

### 6.3 前端WebSocket连接

```typescript
// frontend/src/hooks/useAssetStateWebSocket.ts
const useAssetStateWebSocket = (assetId: number) => {
  const [assetState, setAssetState] = useState({})
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/asset-state/${assetId}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setAssetState(data.fields)
    }
    return () => ws.close()
  }, [assetId])
  
  return assetState
}
```

---

## 7. 总结

### ✅ 可以满足的需求

1. **资产字段数据**：完全匹配，可以直接使用 `asset_state`
2. **写操作**：可以满足，通过现有的资产字段写入API

### ❌ 不满足的需求

1. **DI点数据**：不在 `asset_state` 中，需要扩展
2. **拓扑图层级数据**：无法直接获取，需要扩展
3. **WebSocket实现**：代码中未实现，需要开发

### ⚠️ 需要确认的问题

1. **WebSocket消息格式**：未定义，需要设计
2. **层级数据组织方式**：需要确定如何存储和推送层级数据
3. **DI点数据存储方式**：需要确定如何将DI点数据纳入实时数据流

---

## 8. 建议

1. **优先实现WebSocket服务器**：这是实时数据的基础设施
2. **扩展 asset_state 结构**：支持DI点和层级数据
3. **定义WebSocket消息格式**：确保前后端一致
4. **实现BMS实时数据API**：接入真实的 `asset_state` 数据
5. **前端接入WebSocket**：替换现有的轮询方式

---

## 9. 风险评估

### 高风险项

1. **DI点数据不在 asset_state 中**
   - 影响：BMS字段配置中如果使用DI点，无法实时更新
   - 解决：需要扩展 `asset_state` 或创建独立结构

2. **拓扑图层级数据无法直接获取**
   - 影响：拓扑图无法实时显示多个簇/包的数据
   - 解决：需要扩展数据结构或API

### 中风险项

1. **WebSocket实现缺失**
   - 影响：无法实现真正的实时更新
   - 解决：需要实现WebSocket服务器和前端连接

2. **消息格式未定义**
   - 影响：前后端无法正确解析消息
   - 解决：需要定义统一的消息格式

---

## 10. 下一步行动

1. **与同事确认**：WebSocket实现计划和时间表
2. **设计消息格式**：定义WebSocket消息的JSON格式
3. **扩展数据结构**：支持DI点和层级数据
4. **实现WebSocket**：后端服务器和前端连接
5. **测试验证**：确保实时数据正确推送和显示
