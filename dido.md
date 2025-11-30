# DI/DO 在线展示与调试功能设计

> **本文档定义 DI/DO（数字输入/输出）的在线展示、调试功能，以及进程 A（Lua 程序）和进程 B（后端工程）的交互协议。**

---

## 0. 概述

### 0.1 功能目标

1. **在线展示**：
   * 实时显示所有 DI/DO 端口状态（按端口分组或按设备分组）；
   * 显示端口历史状态变化（时间线视图）；
   * 显示端口关联的设备映射信息。

2. **调试功能**：
   * 手动触发 DO 端口（写操作）；
   * 端口状态监控（实时刷新、告警）；
   * 端口测试（自动扫描、响应时间测试）；
   * 日志记录（操作日志、状态变化日志）。

3. **进程交互**：
   * 定义进程 A（Lua）和进程 B（后端）的 NNG 消息协议；
   * 支持 DI 状态上报（A→B）；
   * 支持 DO 写指令（B→A）；
   * 支持配置下发（B→A）。

---

## 1. 数据模型

### 1.1 DI/DO 端口状态（内存结构）

**位置**：进程 B 内存

```python
# DI/DO 端口实时状态
dido_port_state: dict[str, DidoPortState]
# port_name -> DidoPortState

class DidoPortState:
    port_name: str                    # 端口名，如 'DI_01', 'DO_05'
    port_type: str                    # 'DI' | 'DO'
    current_value: bool                # 当前状态（True/False）
    last_change_time: datetime        # 最后变化时间
    last_update_time: datetime        # 最后更新时间
    change_count: int                 # 变化次数（用于统计）
    
    # 关联的设备映射信息
    device_mappings: list[tuple[int, str]]  # [(device_id, tag_name), ...]
    
    # 调试信息
    test_mode: bool                   # 是否处于测试模式
    test_value: bool | None           # 测试值（测试模式下使用）
```

**说明**：
* `dido_port_state` 在 B 启动时从 `device_mappings` 表构建（查找所有 `source_type='DI'/'DO'` 的记录）；
* DI 状态由进程 A 通过 NNG 上报更新；
* DO 状态由 B 在发送写指令后更新（或由 A 反馈更新）。

---

### 1.2 DI/DO 历史数据存储（InfluxDB）

**位置**：InfluxDB 数据库（`iiot`）

**说明**：
* DI/DO 历史数据**不存入关系库**（SQLite），而是存入 InfluxDB，便于时序查询和趋势分析；
* 参考 `device.md` 中的 InfluxDB 结构设计（见 4.1 节）；
* 所有 DI/DO 状态变化都会写入 InfluxDB，包括：
  * DI 状态变化（硬件触发、轮询检测）；
  * DO 写操作（手动触发、设备映射触发、测试模式）。

---

### 1.3 DI/DO 操作日志表

**位置**：SQLite 数据库（与审计日志集成）

```sql
-- 使用现有的 audit_logs 表，通过 module='dido' 区分
-- 操作类型：
-- - 'dido.read'：读取端口状态
-- - 'dido.write'：写端口状态（手动触发）
-- - 'dido.test.start'：开始端口测试
-- - 'dido.test.stop'：停止端口测试
```

**说明**：
* 所有 DI/DO 操作都通过 `@audit_route` 装饰器记录到 `audit_logs` 表；
* 包括：手动写 DO、端口测试、配置变更等。

---

## 2. 进程 A（Lua）和进程 B（后端）交互协议

### 2.1 通道

* **控制通道**：`ipc:///var/run/iiot_ctrl.ipc`
  * B：REQ（请求方）
  * A：REP（响应方）
  * 用于配置下发、DO 写指令等需要应答的操作。

* **数据通道**：`ipc:///var/run/iiot_data.ipc`
  * A：PUSH（推送方）
  * B：PULL（拉取方）
  * 用于 A 向 B 推送 DI 状态变化（单向，无需应答）。

所有消息为 JSON 文本，使用 UTF-8 编码。

**重要**：所有涉及下标/索引的字段，**从 1 开始**（Lua 语言特性）。

---

### 2.2 控制消息（B→A，需要应答）

#### 2.2.1 获取 DI/DO 端口数量（GET_DIDO_COUNT）

B 向 A 查询当前可用的 DI/DO 端口数量。

**请求（B→A）**：

```json
{
  "msg_type": "GET_DIDO_COUNT",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:00Z"
}
```

**响应（A→B）**：

```json
{
  "msg_type": "GET_DIDO_COUNT_RESULT",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:00.100Z",
  "status": "OK",
  "di_count": 8,                      // DI 端口总数（从 1 到 di_count）
  "do_count": 4,                      // DO 端口总数（从 1 到 do_count）
  "error_message": ""
}
```

**错误响应示例**：

```json
{
  "msg_type": "GET_DIDO_COUNT_RESULT",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:00.100Z",
  "status": "ERROR",
  "di_count": 0,
  "do_count": 0,
  "error_message": "Failed to detect hardware"
}
```

**说明**：
* `di_count` 和 `do_count` 表示硬件实际支持的端口数量；
* 端口索引从 1 开始，范围是 `[1, di_count]` 和 `[1, do_count]`；
* B 启动时或配置变更后，应主动查询端口数量，用于验证配置的有效性。

---

#### 2.2.2 获取 DI/DO 当前值（GET_DIDO_VALUES）

B 向 A 查询所有 DI/DO 端口的当前状态值。

**请求（B→A）**：

```json
{
  "msg_type": "GET_DIDO_VALUES",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:01Z"
}
```

**响应（A→B）**：

```json
{
  "msg_type": "GET_DIDO_VALUES_RESULT",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:01.100Z",
  "status": "OK",
  "di_values": [true, false, true, false, false, true, false, false],  // DI[1..di_count] 的当前值
  "do_values": [false, true, false, false],                            // DO[1..do_count] 的当前值
  "error_message": ""
}
```

**字段说明**：
* `di_values`：数组，长度为 `di_count`，`di_values[0]` 对应 DI_01（索引 1），`di_values[1]` 对应 DI_02（索引 2），以此类推；
* `do_values`：数组，长度为 `do_count`，`do_values[0]` 对应 DO_01（索引 1），`do_values[1]` 对应 DO_02（索引 2），以此类推；
* **注意**：数组索引从 0 开始（JSON 标准），但端口编号从 1 开始，所以 `di_values[i]` 对应端口 `DI_{i+1}`。

**错误响应示例**：

```json
{
  "msg_type": "GET_DIDO_VALUES_RESULT",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:01.100Z",
  "status": "ERROR",
  "di_values": [],
  "do_values": [],
  "error_message": "Hardware read failed"
}
```

**说明**：
* B 启动时或需要同步状态时，调用此接口获取所有端口当前值；
* A 应一次性返回所有端口状态，避免多次查询。

---

#### 2.2.3 设定 DO 输出值（SET_DO_VALUE）

B 向 A 发送 DO 端口写指令。

**请求（B→A）**：

```json
{
  "msg_type": "SET_DO_VALUE",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:02Z",
  "do_index": 5,                       // DO 端口索引（从 1 开始，范围 [1, do_count]）
  "value": true,                       // 要写入的值（true/false）
  "write_kind": "MANUAL"               // 'MANUAL' | 'DEVICE_MAPPING' | 'TEST'
}
```

**字段说明**：
* `do_index`：DO 端口索引，**从 1 开始**（1 = DO_01, 2 = DO_02, ...）；
* `value`：要写入的值（`true` 或 `false`）；
* `write_kind`：
  * `MANUAL`：用户手动触发（调试功能）；
  * `DEVICE_MAPPING`：通过设备映射触发（业务逻辑）；
  * `TEST`：端口测试模式。

**响应（A→B）**：

```json
{
  "msg_type": "SET_DO_VALUE_RESULT",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:02.200Z",
  "status": "OK",
  "do_index": 5,                       // 确认的端口索引
  "actual_value": true,                // 实际写入的值（用于验证）
  "error_message": ""
}
```

**错误响应示例**：

```json
{
  "msg_type": "SET_DO_VALUE_RESULT",
  "request_id": "uuid-1234-5678",
  "timestamp": "2025-11-16T10:00:02.200Z",
  "status": "ERROR",
  "do_index": 5,
  "actual_value": null,
  "error_message": "DO index 5 out of range (max: 4)"
}
```

**说明**：
* A 执行写操作后，应立即返回结果；
* B 收到响应后：
  * 更新 `dido_port_state["DO_05"].current_value = actual_value`（端口名通过索引映射得到）；
  * 如果是 `write_kind='DEVICE_MAPPING'`，还需要：
    * 更新 `device_state[device_id][tag_name]`；
    * 若 `semantic_type='STATUS'`，检查值变化，写入 SOE。

---

#### 2.2.4 DI/DO 配置下发（CONFIG_SNAPSHOT 扩展）

在现有的 `CONFIG_SNAPSHOT` 消息中，添加 `dido_config` 字段：

```json
{
  "msg_type": "CONFIG_SNAPSHOT",
  "version": 6,
  "generated_at": "2025-11-16T10:00:00Z",
  "instances": [...],
  "dido_config": {
    "enabled": true,
    "di_count": 8,                     // DI 端口总数（从设备映射中统计）
    "do_count": 4,                     // DO 端口总数（从设备映射中统计）
    "polling_interval_ms": 100,        // DI 轮询周期（毫秒）
    "di_ports": [
      {
        "index": 1,                    // 端口索引（从 1 开始）
        "port_name": "DI_01",          // 端口名（用于映射）
        "enabled": true,
        "interrupt_enabled": false,    // 是否启用硬件中断（如果支持）
        "debounce_ms": 10              // 防抖时间（毫秒）
      },
      {
        "index": 2,
        "port_name": "DI_02",
        "enabled": true,
        "interrupt_enabled": false,
        "debounce_ms": 10
      }
      // ... 更多 DI 端口
    ],
    "do_ports": [
      {
        "index": 1,                    // 端口索引（从 1 开始）
        "port_name": "DO_01",          // 端口名（用于映射）
        "enabled": true,
        "default_value": false          // 默认值（启动时设置）
      },
      {
        "index": 2,
        "port_name": "DO_02",
        "enabled": true,
        "default_value": false
      }
      // ... 更多 DO 端口
    ]
  }
}
```

**说明**：
* `dido_config` 字段可选，如果不存在或 `enabled=false`，表示不使用 DI/DO 功能；
* `di_count` 和 `do_count` 表示配置的端口数量（从 `device_mappings` 中统计）；
* `di_ports` 和 `do_ports` 数组包含所有需要监控/控制的端口，**`index` 从 1 开始**；
* A 收到配置后，应：
  * 验证端口索引范围（`1 <= index <= di_count` 或 `do_count`）；
  * 初始化所有 DI 端口（开始轮询或启用中断）；
  * 初始化所有 DO 端口（设置为 `default_value`）。

---

### 2.3 数据消息（A→B，无需应答）

#### 2.3.1 DI 状态变化（DIDO_STATE_CHANGE）

当 DI 端口状态发生变化时，A 通过数据通道推送此消息。

```json
{
  "msg_type": "DIDO_STATE_CHANGE",
  "timestamp": "2025-11-16T10:00:00.123Z",
  "di_index": 1,                       // DI 端口索引（从 1 开始）
  "value": true,                       // 新状态值（true/false）
  "change_reason": "HARDWARE"          // 'HARDWARE' | 'POLLING'
}
```

**字段说明**：
* `timestamp`：状态变化时间戳（ISO 8601 格式，UTC）；
* `di_index`：DI 端口索引，**从 1 开始**（1 = DI_01, 2 = DI_02, ...）；
* `value`：新状态值（`true` 或 `false`）；
* `change_reason`：
  * `HARDWARE`：硬件中断触发（如果支持）；
  * `POLLING`：轮询检测到变化。

**B 处理流程**：

1. 根据 `di_index` 查找对应的 `port_name`（通过配置映射：`DI_{di_index}`）；
2. 更新 `dido_port_state[port_name].current_value = value`；
3. 更新 `dido_port_state[port_name].last_change_time = timestamp`；
4. 更新 `dido_port_state[port_name].change_count += 1`；
5. 查找 `device_mappings` 中 `source_type='DI'` 且 `di_do_port=port_name` 的所有记录；
6. 对每条映射：
   * 更新 `device_state[device_id][tag_name] = value`；
   * 若 `semantic_type='STATUS'`，检查旧值→新值变化，写入 SOE；
7. **写入 InfluxDB**（`dido_points` measurement，见 4.1 节）；
8. 通过 WebSocket 推送到前端。

**说明**：
* 此消息仅用于 DI 端口（DO 状态由写指令响应更新）；
* A 应在检测到状态变化后立即发送，不要批量发送；
* B 收到消息后应立即处理，确保实时性。

---

#### 2.3.2 DO 状态反馈（DIDO_STATE_FEEDBACK）

当 DO 端口状态被外部改变（如硬件复位、手动操作等），A 可以通过此消息通知 B。

```json
{
  "msg_type": "DIDO_STATE_FEEDBACK",
  "timestamp": "2025-11-16T10:00:00.123Z",
  "do_index": 5,                       // DO 端口索引（从 1 开始）
  "value": false,                      // 当前状态值
  "change_reason": "HARDWARE_RESET"   // 'HARDWARE_RESET' | 'EXTERNAL'
}
```

**说明**：
* 此消息可选，如果硬件不支持读取 DO 状态，可以不发送；
* B 收到后更新 `dido_port_state`，但不触发设备映射更新（避免循环更新）。

---

## 3. 后端 API 设计

### 3.1 获取 DI/DO 端口列表

```http
GET /api/v1/dido/ports
```

**查询参数**：
* `port_type`：端口类型筛选（`'DI'` | `'DO'` | 不传则返回所有）；
* `device_id`：设备ID筛选（只返回关联到指定设备的端口）；
* `include_history`：是否包含历史记录（`true` | `false`，默认 `false`）。

**响应**：

```json
{
  "code": 200,
  "message": "获取端口列表成功",
  "data": [
    {
      "port_name": "DI_01",
      "port_type": "DI",
      "current_value": true,
      "last_change_time": "2025-11-16T10:00:00Z",
      "last_update_time": "2025-11-16T10:00:05Z",
      "change_count": 15,
      "device_mappings": [
        {
          "device_id": 1,
          "device_name": "PCS_01",
          "tag_name": "DOOR_STATUS",
          "semantic_type": "STATUS"
        }
      ]
    },
    {
      "port_name": "DO_05",
      "port_type": "DO",
      "current_value": false,
      "last_change_time": "2025-11-16T09:55:30Z",
      "last_update_time": "2025-11-16T10:00:05Z",
      "change_count": 3,
      "device_mappings": []
    }
  ],
  "locale": "zh-CN",
  "request_id": "req-123"
}
```

---

### 3.2 获取单个端口状态

```http
GET /api/v1/dido/ports/{port_name}
```

**响应**：同端口列表中的单个端口对象。

---

### 3.3 手动写 DO 端口（调试功能）

```http
POST /api/v1/dido/ports/{port_name}/write
```

**请求体**：

```json
{
  "value": true,
  "write_kind": "MANUAL"              // 'MANUAL' | 'TEST'
}
```

**响应**：

```json
{
  "code": 200,
  "message": "写端口成功",
  "data": {
    "port_name": "DO_05",
    "port_type": "DO",
    "value": true,
    "write_time": "2025-11-16T10:00:01Z",
    "actual_value": true
  },
  "locale": "zh-CN",
  "request_id": "req-123"
}
```

**权限要求**：`DEVELOPER` 或 `OPERATOR` 角色。

**说明**：
* 此接口用于调试功能，手动触发 DO 端口；
* B 收到请求后：
  1. 根据 `port_name` 查找对应的 `do_index`（通过配置映射）；
  2. 构造 `SET_DO_VALUE` 消息（使用 `do_index`，从 1 开始）发送给 A；
  3. 等待 A 响应；
  4. 更新 `dido_port_state`；
  5. **写入 InfluxDB**（`dido_points` measurement）；
  6. 记录审计日志。

---

### 3.4 读取端口状态（调试功能）

```http
POST /api/v1/dido/ports/{port_name}/read
```

**响应**：同获取单个端口状态。

**权限要求**：`DEVELOPER` 或 `OPERATOR` 角色。

**说明**：
* B 收到请求后：
  1. 向 A 发送 `GET_DIDO_VALUES` 请求（获取所有端口当前值）；
  2. 或根据 `port_name` 查找对应的 `di_index`/`do_index`，构造特定查询；
  3. 等待 A 响应并更新 `dido_port_state`；
* 用于调试和状态同步。

---

### 3.5 获取端口历史记录（调试功能）

```http
GET /api/v1/dido/ports/{port_name}/history
```

**查询参数**：
* `start_time`：开始时间（ISO 8601 格式）；
* `end_time`：结束时间（ISO 8601 格式）；
* `skip`：跳过记录数（默认 0）；
* `limit`：每页记录数（默认 100，最大 1000）。

**响应**：

```json
{
  "code": 200,
  "message": "获取历史记录成功",
  "data": {
    "items": [
      {
        "id": 1,
        "port_name": "DI_01",
        "port_type": "DI",
        "value": true,
        "change_reason": "HARDWARE",
        "operator_id": null,
        "device_id": 1,
        "tag_name": "DOOR_STATUS",
        "created_at": "2025-11-16T10:00:00Z"
      }
    ],
    "skip": 0,
    "limit": 100,
    "total": 15
  },
  "locale": "zh-CN",
  "request_id": "req-123"
}
```

**权限要求**：`DEVELOPER` 或 `OPERATOR` 角色。

**说明**：
* **从 InfluxDB 查询历史数据**（`dido_points` measurement）；
* 查询参数：
  * `start_time`、`end_time`：时间范围（ISO 8601 格式）；
  * `skip`、`limit`：分页参数。
* 用于问题排查和调试。

---

### 3.6 端口测试（调试功能）

#### 3.6.1 开始端口测试

```http
POST /api/v1/dido/ports/{port_name}/test/start
```

**请求体**：

```json
{
  "test_mode": "TOGGLE",              // 'TOGGLE' | 'PULSE' | 'CUSTOM'
  "interval_ms": 1000,                 // 切换间隔（毫秒，TOGGLE 模式用）
  "pulse_duration_ms": 100,            // 脉冲持续时间（毫秒，PULSE 模式用）
  "custom_sequence": [true, false, true, false]  // 自定义序列（CUSTOM 模式用）
}
```

**响应**：

```json
{
  "code": 200,
  "message": "端口测试已启动",
  "data": {
    "port_name": "DO_05",
    "test_mode": "TOGGLE",
    "start_time": "2025-11-16T10:00:00Z"
  },
  "locale": "zh-CN",
  "request_id": "req-123"
}
```

**说明**：
* 测试模式：
  * `TOGGLE`：按指定间隔自动切换状态（true ↔ false）；
  * `PULSE`：发送一个脉冲（true → false，持续指定时间）；
  * `CUSTOM`：按自定义序列循环写入。
* B 启动测试后，在后台线程中按模式执行写操作；
* 测试期间，端口状态会实时更新。

---

#### 3.6.2 停止端口测试

```http
POST /api/v1/dido/ports/{port_name}/test/stop
```

**响应**：

```json
{
  "code": 200,
  "message": "端口测试已停止",
  "data": {
    "port_name": "DO_05",
    "test_duration_ms": 5000,
    "test_count": 5
  },
  "locale": "zh-CN",
  "request_id": "req-123"
}
```

---

#### 3.6.3 获取测试状态

```http
GET /api/v1/dido/ports/{port_name}/test/status
```

**响应**：

```json
{
  "code": 200,
  "message": "获取测试状态成功",
  "data": {
    "port_name": "DO_05",
    "is_testing": true,
    "test_mode": "TOGGLE",
    "start_time": "2025-11-16T10:00:00Z",
    "test_count": 5,
    "current_value": true
  },
  "locale": "zh-CN",
  "request_id": "req-123"
}
```

---

## 4. InfluxDB 数据结构

### 4.1 `dido_points` measurement

**位置**：InfluxDB 数据库 `iiot`，RP：`raw_7d`

**Tags**：
* `port_name`（string）：端口名，如 `DI_01`、`DO_05`；
* `port_type`（string）：端口类型，`DI` 或 `DO`；
* `device_id`（string，可选）：关联的设备ID（如果有设备映射）；
* `tag_name`（string，可选）：关联的业务字段名（如果有设备映射）。

**Fields**：
* `value`（int）：端口状态值（0 或 1，对应 false/true）；
* `change_reason`（string）：变化原因，`HARDWARE` | `POLLING` | `MANUAL` | `DEVICE_MAPPING` | `TEST` | `HARDWARE_RESET` | `EXTERNAL`；
* `operator_id`（int，可选）：操作者ID（如果是手动操作）；
* `quality`（int）：质量码（0=好，非0=异常，通常为0）。

**写入规则**：
* **所有 DI/DO 状态变化都写入 InfluxDB**：
  * DI 状态变化（通过 `DIDO_STATE_CHANGE` 消息接收）；
  * DO 写操作（通过 `SET_DO_VALUE_RESULT` 响应接收）；
  * DO 状态反馈（通过 `DIDO_STATE_FEEDBACK` 消息接收）。
* **时间戳**：使用状态变化发生的时间（`timestamp` 字段），不是写入时间；
* **数据保留**：按 `raw_7d` RP 保留 7 天原始数据。

**示例数据点**：

```influx
dido_points,port_name=DI_01,port_type=DI,device_id=1,tag_name=DOOR_STATUS value=1,change_reason="HARDWARE",quality=0 1700123456123000000
dido_points,port_name=DO_05,port_type=DO,device_id=1,tag_name=DOOR_LOCK value=1,change_reason="MANUAL",operator_id=2,quality=0 1700123456789000000
```

**查询示例**：

```influxql
-- 查询 DI_01 最近 1 小时的状态变化
SELECT time, value, change_reason 
FROM dido_points 
WHERE port_name = 'DI_01' 
  AND time >= now() - 1h 
ORDER BY time DESC

-- 查询所有 DO 端口的状态变化（按设备分组）
SELECT time, port_name, value, change_reason, device_id, tag_name 
FROM dido_points 
WHERE port_type = 'DO' 
  AND time >= now() - 24h 
ORDER BY time DESC
```

---

### 4.2 `agg_5m_dido_points` measurement（可选）

**位置**：InfluxDB 数据库 `iiot`，RP：`agg_5m_365d`

**Tags**：同 `dido_points`。

**Fields**：
* `avg_value`（float）：5 分钟内的平均值（0.0~1.0）；
* `min_value`（int）：5 分钟内的最小值（0 或 1）；
* `max_value`（int）：5 分钟内的最大值（0 或 1）；
* `change_count`（int）：5 分钟内的变化次数。

**说明**：
* B 定时从 `dido_points` 按 5 分钟窗口聚合写入；
* 用于长期趋势分析（保留 365 天）；
* 此功能可选，如果不需要长期趋势，可以不启用。

---

## 5. WebSocket 实时推送

### 4.1 连接

```typescript
// 前端连接 WebSocket
const ws = new WebSocket('ws://localhost:18000/ws/dido')

// 订阅所有端口状态
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['dido.state']
}))
```

---

### 4.2 消息格式

#### 4.2.1 端口状态更新

```json
{
  "type": "dido.state.update",
  "timestamp": "2025-11-16T10:00:00.123Z",
  "data": {
    "port_name": "DI_01",
    "port_type": "DI",
    "value": true,
    "last_change_time": "2025-11-16T10:00:00.123Z",
    "change_count": 16,
    "device_mappings": [
      {
        "device_id": 1,
        "device_name": "PCS_01",
        "tag_name": "DOOR_STATUS",
        "semantic_type": "STATUS"
      }
    ]
  }
}
```

**说明**：
* 当 DI/DO 端口状态变化时，B 通过 WebSocket 推送此消息；
* 前端收到后更新 UI 显示。

---

#### 4.2.2 端口测试状态更新

```json
{
  "type": "dido.test.update",
  "timestamp": "2025-11-16T10:00:00.123Z",
  "data": {
    "port_name": "DO_05",
    "is_testing": true,
    "test_mode": "TOGGLE",
    "test_count": 5,
    "current_value": true
  }
}
```

---

## 6. 前端页面设计

### 6.1 DI/DO 管理页面（DidoManagementPage.tsx）

**功能**：
1. **端口列表视图**：
   * 表格显示所有 DI/DO 端口；
   * 列：端口名、类型、当前状态、最后变化时间、变化次数、关联设备；
   * 支持按端口类型、设备筛选；
   * 实时更新（WebSocket）。

2. **端口详情视图**：
   * 点击端口行，显示详情面板；
   * 显示端口配置信息；
   * 显示关联的设备映射；
   * 显示历史状态变化（时间线图表）。

3. **操作按钮**：
   * **写 DO**（仅 DO 端口）：手动触发写操作；
   * **读取状态**：主动查询端口状态；
   * **开始测试**：启动端口测试；
   * **停止测试**：停止端口测试；
   * **查看历史**：打开历史记录对话框。

---

### 6.2 端口测试对话框（DidoTestDialog.tsx）

**功能**：
1. **测试模式选择**：
   * 切换模式（TOGGLE）：自动切换状态；
   * 脉冲模式（PULSE）：发送单次脉冲；
   * 自定义序列（CUSTOM）：按序列循环写入。

2. **参数配置**：
   * 切换间隔（TOGGLE 模式）；
   * 脉冲持续时间（PULSE 模式）；
   * 自定义序列（CUSTOM 模式）。

3. **测试状态显示**：
   * 当前测试模式；
   * 测试次数；
   * 当前端口状态（实时更新）；
   * 测试时长。

4. **控制按钮**：
   * 开始测试；
   * 停止测试。

---

### 6.3 端口历史记录对话框（DidoHistoryDialog.tsx）

**功能**：
1. **时间范围选择**：
   * 开始时间、结束时间选择器。

2. **历史记录表格**：
   * 列：时间、状态值、变化原因、操作者、关联设备/字段；
   * 支持分页。

3. **时间线图表**：
   * 可视化显示端口状态变化趋势。

---

## 7. 实现细节

### 7.1 进程 B 内存结构

```python
# DI/DO 端口状态（全局变量）
dido_port_state: dict[str, DidoPortState] = {}

# 端口测试任务（后台线程）
dido_test_tasks: dict[str, threading.Thread] = {}

# 构建 dido_port_state 的时机：
# 1. B 启动时；
# 2. 每次设备映射配置变更后（重建映射索引时）。

def rebuild_dido_port_state(db: AsyncSession):
    """重建 DI/DO 端口状态索引"""
    # 1. 从 device_mappings 查询所有 DI/DO 映射
    # 2. 提取所有唯一的 di_do_port
    # 3. 初始化 dido_port_state
    # 4. 向 A 发送 CONFIG_SNAPSHOT（包含 dido_config）
```

---

### 7.2 进程 A（Lua）实现要点

```lua
-- DI/DO 配置缓存
local dido_config = {}

-- DI 端口状态缓存
local di_states = {}

-- DO 端口状态缓存
local do_states = {}

-- 处理 CONFIG_SNAPSHOT
function handle_config_snapshot(msg)
    if msg.dido_config and msg.dido_config.enabled then
        dido_config = msg.dido_config
        
        -- 初始化所有 DI 端口（开始轮询或启用中断）
        for _, port in ipairs(dido_config.ports) do
            if port.port_type == "DI" and port.enabled then
                -- 初始化硬件接口
                -- 开始轮询或启用中断
                di_states[port.port_name] = {
                    value = false,
                    last_read = 0
                }
            elseif port.port_type == "DO" and port.enabled then
                -- 初始化硬件接口
                -- 设置默认值
                do_states[port.port_name] = {
                    value = port.default_value or false
                }
                -- 写入硬件
                write_do_port(port.port_name, port.default_value or false)
            end
        end
    end
end

-- DI 轮询任务（定时器）
function di_polling_task()
    for port_name, state in pairs(di_states) do
        local current_time = get_current_time_ms()
        if current_time - state.last_read >= dido_config.polling_interval_ms then
            local new_value = read_di_port(port_name)
            if new_value ~= state.value then
                -- 状态变化，发送 DIDO_STATE_CHANGE
                state.value = new_value
                state.last_read = current_time
                send_dido_state_change(port_name, "DI", new_value, "POLLING")
            end
        end
    end
end

-- 处理 WRITE_DIDO
function handle_write_dido(msg)
    local port_name = msg.port_name
    local value = msg.value
    
    -- 写入硬件
    local success, actual_value = write_do_port(port_name, value)
    
    if success then
        do_states[port_name].value = actual_value
        -- 发送成功响应
        send_write_dido_result(msg.request_id, "OK", "", actual_value)
    else
        -- 发送错误响应
        send_write_dido_result(msg.request_id, "ERROR", "Write failed", nil)
    end
end

-- 处理 READ_DIDO
function handle_read_dido(msg)
    local ports = {}
    
    if msg.port_name then
        -- 读取单个端口
        local port_type = get_port_type(msg.port_name)
        local value = read_port(msg.port_name)
        table.insert(ports, {
            port_name = msg.port_name,
            port_type = port_type,
            value = value,
            read_time = get_current_time_iso()
        })
    else
        -- 读取所有端口
        for port_name, _ in pairs(di_states) do
            local value = read_di_port(port_name)
            table.insert(ports, {
                port_name = port_name,
                port_type = "DI",
                value = value,
                read_time = get_current_time_iso()
            })
        end
        for port_name, _ in pairs(do_states) do
            local value = do_states[port_name].value
            table.insert(ports, {
                port_name = port_name,
                port_type = "DO",
                value = value,
                read_time = get_current_time_iso()
            })
        end
    end
    
    send_read_dido_result(msg.request_id, ports)
end
```

---

### 7.3 设备映射写 DO 流程

当用户通过设备映射写 DO 端口时（例如，通过业务字段 `DOOR_LOCK` 写 `DO_05`）：

1. **前端**：
   ```http
   POST /api/v1/devices/1/tags/DOOR_LOCK/write
   {
     "value": true
   }
   ```

2. **B 处理**：
   * 查 `device_type_tags` → `semantic_type='COMMAND'` 或 `'STATUS'`；
   * 查 `device_mappings` → 找到 `source_type='DO'`，`di_do_port='DO_05'`；
   * 构造 `WRITE_DIDO` 消息（`write_kind='DEVICE_MAPPING'`）发送给 A；
   * 等待 A 响应；
   * 更新 `dido_port_state['DO_05']`；
   * 更新 `device_state[1]['DOOR_LOCK']`；
   * 若 `semantic_type='STATUS'`，检查值变化，写入 SOE；
   * 记录审计日志。

3. **A 执行**：
   * 写入硬件 DO 端口；
   * 返回响应。

---

## 8. 配置项

### 8.1 后端配置（.env 或 config.py）

```python
# DI/DO 功能开关
DIDO_ENABLED = True

# DI/DO 历史记录开关（调试模式）
DIDO_HISTORY_ENABLED = False

# DI/DO 历史记录保留天数（如果启用）
DIDO_HISTORY_RETENTION_DAYS = 7

# DI 默认轮询周期（毫秒）
DIDO_DI_POLLING_INTERVAL_MS = 100

# DO 写操作超时（毫秒）
DIDO_DO_WRITE_TIMEOUT_MS = 1000
```

---

## 9. 权限控制

| 功能 | 所需角色 |
|------|---------|
| 查看 DI/DO 端口列表 | `USER` |
| 查看端口详情 | `USER` |
| 手动写 DO 端口 | `DEVELOPER`、`OPERATOR` |
| 读取端口状态 | `DEVELOPER`、`OPERATOR` |
| 端口测试 | `DEVELOPER`、`OPERATOR` |
| 查看历史记录 | `DEVELOPER`、`OPERATOR` |
| 配置 DI/DO | `DEVELOPER` |

---

## 10. 国际化

### 10.1 翻译键（zh-CN/dido.json）

```json
{
  "title": "DI/DO 管理",
  "portName": "端口名",
  "portType": "端口类型",
  "currentValue": "当前状态",
  "lastChangeTime": "最后变化时间",
  "changeCount": "变化次数",
  "deviceMappings": "关联设备",
  "writeDo": "写 DO",
  "readStatus": "读取状态",
  "startTest": "开始测试",
  "stopTest": "停止测试",
  "viewHistory": "查看历史",
  "testMode": "测试模式",
  "toggle": "切换模式",
  "pulse": "脉冲模式",
  "custom": "自定义序列"
}
```

---

## 11. 总结

本文档定义了：

1. **数据模型**：
   * DI/DO 端口状态（内存结构）；
   * DI/DO 历史数据存储（InfluxDB）；
   * 操作日志（集成审计系统）。

2. **进程交互协议**：
   * 获取 DI/DO 端口数量（GET_DIDO_COUNT）；
   * 获取 DI/DO 当前值（GET_DIDO_VALUES）；
   * 设定 DO 输出值（SET_DO_VALUE，使用索引从 1 开始）；
   * DI/DO 配置下发（CONFIG_SNAPSHOT 扩展）；
   * DI 状态变化上报（DIDO_STATE_CHANGE，使用索引从 1 开始）；
   * DO 状态反馈（DIDO_STATE_FEEDBACK，使用索引从 1 开始）。

3. **InfluxDB 数据结构**：
   * `dido_points` measurement（原始数据，保留 7 天）；
   * `agg_5m_dido_points` measurement（聚合数据，可选，保留 365 天）。

4. **后端 API**：
   * 端口列表查询；
   * 手动写 DO（调试）；
   * 读取状态（调试）；
   * 历史记录查询（从 InfluxDB 查询）；
   * 端口测试（调试）。

5. **WebSocket 实时推送**：
   * 端口状态更新；
   * 测试状态更新。

6. **前端页面**：
   * DI/DO 管理页面；
   * 端口测试对话框；
   * 历史记录对话框。

7. **实现细节**：
   * 进程 B 内存结构；
   * 进程 A（Lua）实现要点；
   * 设备映射写 DO 流程。

实现时，严格按照本文档的协议、API 和流程来实现，即可得到一套完整的 DI/DO 在线展示和调试功能。

