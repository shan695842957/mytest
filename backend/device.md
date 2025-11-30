# 工业网关 IIoT 平台


> 本文档是系统的“蓝图”，所有实现必须以此为准，不存在其它模式或可选分支。

---

## 0. 系统目标与范围

本系统运行在嵌入式 Linux 网关上（约 1GB RAM），面向电站/工厂等现场，承担：

* 从多种工业设备（PLC、变频器、保护装置、振动仪等）采集数据；
* 将底层“通信信号”解析为统一的“设备资产视图”；
* 实现：

  * 实时光字牌（运行模式、各类报警、关键测量）；
  * 实时 SOE（事件顺序记录）；
  * 历史趋势查询（基于 InfluxDB 原始数据/聚合数据）；
  * 设定值/命令/参数下发到设备（通过通信实例）；
* 支持一个设备由多个通信实例的数据组成，每个通信实例的数据解析方式可能完全不同。


---

## 1. 角色与使用场景

### 1.1 角色

1. **开发者/运维角色**

   * 负责所有配置工作：

     * 点表模板（寄存器地址、数据类型、缩放、解析方式）；
     * 通信实例（IP/串口参数/轮询周期等）；
     * 设备类型与业务字段（运行模式、各种报警、测量量、累积量、参数、设定值、命令等）；
     * 设备资产及资产映射（多通信实例组合成一个设备）。
   * 负责修改配置并下发到 A 进程。
   * 负责调通通信、验证光字牌/历史/下发功能。

2. **普通用户**

   * 值班工程师：

     * 通过光字牌查看当前运行状态、模式、报警；
     * 查看历史趋势 + SOE 分析故障；
     * 在授权下下发设定值（SETPOINT）、控制命令（COMMAND）、参数修改（PARAM/PARAM_SET）。

---

## 2. 语义模型与核心概念

### 2.1 7 大语义类型（semantic_type）

所有语义都与设备通信直接相关，**每一个 semantic_type 最终都对应通信实例上的某个点/寄存器**（包括读和写）。

| semantic_type | 含义                                    | 行为（读路径）                                                                                    | 行为（写路径）                                                                                                                 |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `MEASURE`     | 测量量（连续变化的温度、电流、压力等）                   | A 采集 → B 写 Influx → 光字牌数值显示 + 历史趋势；不自动产生 SOE。                                              | 通常只读，如某些场景需要“限值写回”，可以通过额外的 SETPOINT/COMMAND 实现，不直接对 MEASURE 写。                                                          |
| `STATUS`      | 状态量（运行模式枚举、报警位、开关状态等）                 | A 采集 → B 不写 Influx，只更新实时状态；当值变化时由 B 生成 SOE（ALARM_ON/OFF 或 STATE_CHANGE）；用于光字牌状态灯 + 实时 SOE。 | 通常通过对应的 COMMAND/SETPOINT/参数写回触发变化，直接对 STATUS 写入的场景较少，如需要也可经 COMMAND 映射实现。                                               |
| `ACCUM`       | 累积量（发电量、累计运行小时等）                      | A 采集 → B 写 Influx；用于光字牌数字和趋势；不自动 SOE。                                                      | 一般只读，重置/修改累积量通常通过专门的 COMMAND/参数操作，不直接对 ACCUM 写。                                                                         |
| `PARAM`       | 设备参数值（来自设备，只读，如保护定值、比例系数）      | A 采集 → B 写 Influx；用于参数查看历史变更轨迹。                                                            | **只读**：PARAM 是从设备读上来的当前参数值，不能直接写。如需修改参数，应使用 `PARAM_SET` 语义类型下发写操作。                                                  |
| `SETPOINT`    | 设定值（期望目标，例如目标压力/频率/温度）                | **无读路径**：SETPOINT 是下发的目标值，不需要从设备读回来。设备执行后实际过程量（MEASURE）会变化，但 SETPOINT 本身不存入 Influx。 | **写操作**：普通用户修改设定 → B 通过通信实例下发到设备 → **必须产生 SETPOINT_CHANGE SOE**（不存入 Influx）；设备执行后实际过程量（MEASURE）变化，可通过 MEASURE 查看执行效果。                                            |
| `COMMAND`     | 控制命令（启停/复位/投退等瞬时动作）                   | 可从设备读回命令状态/反馈（一般作为 STATUS 字段）；不作为时序曲线存储。                                                   | **写操作**：普通用户触发命令 → B 通过通信实例下发一次 → **必须立即记录 CMD_SENT/CMD_FAIL SOE**（不存入 Influx）；设备 STATUS 随后变化，再触发 STATUS 类 SOE。                                 |
| `PARAM_SET`   | 参数设定操作（对设备参数写入动作本身，设备提供的参数写能力，如修改某定值） | | **写操作**：与 PARAM 有区别：PARAM 是"当前参数值"；PARAM_SET 是"写入操作"：用户通过 PARAM_SET 点下发新的参数值到设备 → **必须产生 PARAM_CHANGE SOE**（不存入 Influx）；设备在后续采集中以新的 PARAM 值呈现，A 采集后再写入 Influx。 |

**要点：**

* 这 7 种语义全部是 **通过通信实例实现的设备交互能力**；
* 平台自身 UI 配置、规则、门限等不属于 semantic_type 范畴，而是普通配置（存在 SQLite，比如 device_type_tags 的 group_name、提示文本、默认单位等）；
* **写操作能力**只有 3 类：`SETPOINT`、`COMMAND`、`PARAM_SET`。
* **写操作分类**（按业务语义）：
  * **修改设备参数**：`PARAM_SET` → 产生 `PARAM_CHANGE` SOE
  * **调节设备目标值**：`SETPOINT` → 产生 `SETPOINT_CHANGE` SOE
  * **控制设备状态**：`COMMAND` → 产生 `CMD_SENT`/`CMD_FAIL` SOE
* **写操作统一规范**：
  * 所有写操作都通过通信实例下发到设备；
  * 所有写操作都必须产生 SOE（不存入 Influx）；
  * 写操作本身不存入 Influx，只有设备响应后 A 采集到的数据才写入 Influx。

---

### 2.2 信号 / 业务字段 / 资产三层

1. **信号（Signal）**：
   A 从设备读到的最小单位，例如：

   * `PLC-01.StatusWord2`（16 位整型）；
   * `PLC-01.OutletPressure`（INT16，经 kx+b）；
   * `VFD-33.MultiStatus`（组合寄存器）；
   * `VIB-12.VibA`（振动值）。

2. **业务字段（Device Type Tag）**：
   针对设备类型定义的字段，如：

   * `OUTLET_PRESSURE`（MEASURE）；
   * `RUN_MODE`（STATUS, ENUM）；
   * `ALM_OVER_TEMP`（STATUS, BOOL）；
   * `FREQ_SETPOINT`（SETPOINT）；
   * `PROTECT_THRESHOLD`（PARAM）；
   * `CMD_START`（COMMAND）；
   * `PARAM_SET_THRESHOLD`（PARAM_SET，用于写保护门限）。

3. **资产（Asset）**：
   现场一台具体设备，如 `北区1号压缩机`。
   由多个通信实例、多个信号组合出完整的业务字段集。

---

## 3. 系统架构概览

### 3.1 进程与组件

* **A 进程（采集与信号解析）**

  * Luvit（LuaJIT）编写；
  * FFI 调用各类协议 C 库；
  * 接收 B 下发 CONFIG_SNAPSHOT；
  * 定期轮询通信实例，采集点表；
  * 执行信号级解析（字节序、raw_type、kx+b、BITFIELD16 拆 bit）；
  * 将结果通过 NNG 数据通道发给 B；
  * 接收 B 的 WRITE_POINT，调用 C 库写设备，并返回结果。

* **B 进程（业务解析 / 存储 / API）**

  * Python 3 + FastAPI；
  * 使用 NNG 连接 A；
  * 使用 SQLite（配置 + SOE）；
  * 使用 InfluxDB（所有来自设备的时序数据）；
  * 负责：

    * 配置管理 API；
    * 把配置下发给 A；
    * 接收 A 的采集数据，写 Influx；
    * 根据资产映射生成业务字段值；
    * 维护资产实时状态；
    * 生成 SOE；
    * 对外提供实时光字牌、历史趋势 + SOE 查询；
    * 处理写指令（SETPOINT/COMMAND/PARAM_SET），通过 A 写设备。

---

### 3.2 数据流总览（“上帝视角”）

1. **配置阶段（开发者/运维角色）**

   * 在 B 中配置：

     * 设备类型 + 业务字段模板；
     * 点表模板；
     * 通信实例；
     * 设备资产；
     * 资产映射（多通信实例组合成一个资产）。
   * B 将配置写入 SQLite；
   * B 重建内存映射索引 `mapping_index`；
   * B 向 A 下发 CONFIG_SNAPSHOT。

2. **运行阶段（读数据链路）**

   * A 按配置轮询各通信实例；
   * A 对每个点解析为 POINT_VALUE / POINT_BITS 消息；
   * A 通过 NNG 数据通道推给 B；
   * B 写入 Influx（所有来自设备的时序点：MEASURE/ACCUM/PARAM 等）；
   * B 通过 `mapping_index[instance_id][point_name]` 找出所有对应资产/业务字段；
   * B 计算业务值（状态/枚举/报警），更新 `asset_state`；
   * 对 STATUS/COMMAND/PARAM 改变生成 SOE；
   * B 通过 WebSocket 推送光字牌状态和实时 SOE。

3. **运行阶段（写指令链路）**

   * 普通用户在前端对某资产字段发起写操作（SETPOINT/COMMAND/PARAM_SET）；
   * B 根据 `device_type_tags` + `asset_mappings` 找到对应通信实例与点；
   * B 将业务值转换为 raw_value（包括位操作、掩码、kx+b 反向等）；
   * B 通过 NNG 控制通道发送 WRITE_POINT 给 A；
   * A 写设备后返回结果；
   * B 根据结果生成相应的 SOE（命令/参数变更），并在后续采集中透过设备数据确认。

---

## 4. 配置建模（抽象层）

本节讲“存 SQLite 之前”的模型抽象，下一节给出完整表结构和字段注释。

### 4.1 设备类型与业务字段

* **设备类型 `device_type`**
  描述一类设备（如 “B 型压缩机”）有哪些业务字段。

* **业务字段 `device_type_tag`**
  业务字段是对外暴露的“语义点”：
  `OUTLET_PRESSURE`, `RUN_MODE`, `ALM_OVER_TEMP`, `MOTOR_CURRENT`, `FREQ_SETPOINT`, `CMD_START`, `PARAM_SET_THRESHOLD` 等。

每个业务字段包含：

* 数据类型（BOOL/INT/FLOAT/ENUM）；
* 语义类型（7 种 semantic_type 之一）；
* 单位（测量量/参数/设定值）；
* 分组（光字牌显示组，如“运行模式”“独立报警”“工艺量”“参数”）；
* 严重级别（针对 STATUS/COMMAND/PARAM/PARAM_SET，决定 SOE 重要性和 UI 颜色）。

---

### 4.2 点表模板与通信实例

* **点表模板 `point_table_template`**

  * 描述某类通信协议下的一套标准寄存器布局；
  * 每个 `point_table_point` 除了点名、地址、原始数据类型（INT16、UINT16、FLOAT32、BITFIELD16 等）、字节序、kx+b 缩放、启用状态，还通过 `parse_rules_json` 定义**子点 (sub_points)**，指导 A 进程如何拆分原始寄存器；
  * 子点会成为后续映射时可直接引用的“实例点名”，例如 `StatusWord4.mode_code`、`StatusWord4.high_temp_bit`；
  * 复杂寄存器（模式 + 报警 + 数值混合）的拆分必须在点表层声明完成，B 进程不再做 bit 运算。

* **通信实例 `comm_instance`**

  * 对应具体一台设备或一个通道（如 `PLC-01`、`VFD-33`、`VIB-12`）；
  * 指向一个点表模板；
  * 配置通信协议类型、协议 JSON（IP、端口、站号或串口配置等）、轮询周期、超时、重试次数等运行参数。

---

### 4.3 资产与资产映射（多通信实例组成一个设备）

* **资产 `asset`**
  是现场的一台具体设备，如：

  * `NORTH_COMP_01` → 北区 1 号压缩机；
  * `GEN_UNIT_1` → 1 号发电机组。

* **通信绑定 `asset_comm_bindings`**
  记录“该资产使用了哪些通信实例”，便于前端在映射界面按实例过滤信号，也让 B 在重建 `mapping_index` 时可以一次性拉取资产相关实例。

* **资产映射 `asset_mappings`**（全部 DIRECT）
  对每一个具体资产，我们要告诉系统：

  > “这个资产的 `RUN_MODE` 来自 `PLC-01` 的 `StatusWord4.mode_code` 子点；
  > `MOTOR_CURRENT` 来自 `VFD-33.MultiStatus.current`；
  > `CMD_START` 来自 `PLC-01.CmdWord.cmd_start_bit`。”

一个资产可以有多条映射记录，每条记录可以指向不同的 `instance_id` / `point_name`：

| asset   | asset_tag_name      | instance_id | point_name                 | 示例含义            |
| ------- | ------------------- | ----------- | -------------------------- | --------------- |
| 北区1号压缩机 | RUN_MODE            | PLC-01      | StatusWord4.mode_code      | 运行模式枚举来自 PLC |
| 北区1号压缩机 | OUTLET_PRESSURE     | PLC-01      | OutletPressure             | 出口压力来自 PLC    |
| 北区1号压缩机 | MOTOR_CURRENT       | VFD-33      | MultiStatus.current        | 电流来自变频器       |
| 北区1号压缩机 | VIB_A               | VIB-12      | VibA                       | 振动来自振动仪       |
| 北区1号压缩机 | CMD_START           | PLC-01      | CmdWord.cmd_start_bit      | 启动命令对应子点     |
| 北区1号压缩机 | PARAM_SET_THRESHOLD | PLC-01      | ParamSetReg                | 写入某参数寄存器      |

**B 就通过 DIRECT 映射，将“多通信实例、多子点”拼成“一个设备”的完整业务视图，不再依赖 bit_index/bit_mask。**

---

## 5. SQLite 表结构（带字段说明）

> 所有表的 `created_at` / `updated_at` 字段统一为：
> `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
> `updated_at` 由应用在更新记录时修改。

---

### 5.1 设备类型表 `device_types`

```sql
CREATE TABLE device_types (
  id           INTEGER PRIMARY KEY,
  name         TEXT    NOT NULL UNIQUE, -- 内部名称，如 'B_COMPRESSOR'
  display_name TEXT    NOT NULL,        -- 前端显示名称，如 'B型压缩机'
  model        TEXT    NOT NULL DEFAULT '', -- 型号
  manufacturer TEXT    NOT NULL DEFAULT '', -- 厂家
  description  TEXT    NOT NULL DEFAULT '',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5.2 业务字段模板表 `device_type_tags`

```sql
CREATE TABLE device_type_tags (
  id             INTEGER PRIMARY KEY,
  device_type_id INTEGER NOT NULL,      -- 外键：设备类型
  tag_name       TEXT    NOT NULL,      -- 内部字段名，如 'OUTLET_PRESSURE'
  display_name   TEXT    NOT NULL,      -- 显示名，如 '出口压力'
  data_type      TEXT    NOT NULL,      -- 'BOOL' | 'INT' | 'FLOAT' | 'ENUM'
  semantic_type  TEXT    NOT NULL,      -- 7 种语义之一
  engineering_unit TEXT NOT NULL DEFAULT '', -- 工程单位，如 'bar'
  group_name     TEXT    NOT NULL DEFAULT '',-- UI 分组，如 '运行模式','独立报警'
  severity       INTEGER NOT NULL DEFAULT 0, -- 严重性：0~5
  enum_json      TEXT    NOT NULL DEFAULT '{}', -- data_type='ENUM' 时的 code->label
  description    TEXT    NOT NULL DEFAULT '',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_type_id) REFERENCES device_types(id)
);

CREATE UNIQUE INDEX idx_device_type_tags_unique
ON device_type_tags(device_type_id, tag_name);
```

解释：

* 对于 `STATUS`、`COMMAND`、`PARAM`、`PARAM_SET`，`severity`（0~5）决定 SOE 重要性和 UI 颜色；
* `group_name` 用于光字牌分组显示；
* 所有枚举字段的 `enum_json` 只在设备类型模板里定义一次，**不允许 per-asset 覆盖**，需要不同枚举含义就新建设备类型。

---

### 5.3 点表模板 `point_table_templates`

```sql
CREATE TABLE point_table_templates (
  id           INTEGER PRIMARY KEY,
  name         TEXT    NOT NULL UNIQUE, -- 内部名，如 'COMP_MODBUS_V1'
  display_name TEXT    NOT NULL,        -- 显示名
  protocol_type TEXT   NOT NULL,        -- 'modbus_tcp', 'modbus_rtu', ...
  description  TEXT    NOT NULL DEFAULT '',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5.4 点表点 `point_table_points`

```sql
CREATE TABLE point_table_points (
  id             INTEGER PRIMARY KEY,
  point_table_id INTEGER NOT NULL,      -- 外键：点表模板
  point_name     TEXT    NOT NULL,      -- 内部点名，如 'StatusWord2'
  display_name   TEXT    NOT NULL,      -- 显示名
  address        TEXT    NOT NULL,      -- 寄存器/地址，如 '40001'
  io_type        TEXT    NOT NULL,      -- 'AI' | 'AO' | 'DI' | 'DO' | 'STRING'
  raw_type       TEXT    NOT NULL,      -- 'INT16' | 'UINT16' | 'INT32' | 'FLOAT32' | 'BITFIELD16' 等
  byte_order     TEXT    NOT NULL,      -- 'BE' | 'LE' | 'BE_SWAP' | 'LE_SWAP'
  scale_k        REAL    NOT NULL DEFAULT 1.0, -- kx+b 中的 k
  scale_b        REAL    NOT NULL DEFAULT 0.0, -- kx+b 中的 b
  parse_rules_json TEXT NOT NULL DEFAULT '{}', -- 子点定义：指导 A 如何拆分原始寄存器
  description    TEXT    NOT NULL DEFAULT '',
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id)
);

CREATE UNIQUE INDEX idx_points_unique
ON point_table_points(point_table_id, point_name);
```

说明：

* `parse_rules_json` 约定 `sub_points` 数组，支持 `BIT`、`BITS_RANGE` 等多种拆分方式；
* 子点名称会以 `原始点名.子点名` 的形式出现在实例中，直接作为 `asset_mappings.point_name`；
* 示例：

```json
{
  "sub_points": [
    {"name": "mode_code", "type": "UINT", "kind": "BITS_RANGE", "bit_from": 0, "bit_to": 1},
    {"name": "high_temp_bit", "type": "BOOL", "kind": "BIT", "bit": 2},
    {"name": "over_press_bit", "type": "BOOL", "kind": "BIT", "bit": 3}
  ]
}
```

---

### 5.5 通信实例表 `comm_instances`

```sql
CREATE TABLE comm_instances (
  id             INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL UNIQUE, -- 内部 ID，如 'PLC-01'
  display_name   TEXT    NOT NULL,        -- 显示名
  enabled        INTEGER NOT NULL DEFAULT 1,
  point_table_id INTEGER NOT NULL,
  protocol_type  TEXT    NOT NULL,        -- 冗余字段，明确协议类型
  protocol_config TEXT   NOT NULL,        -- JSON：IP/PORT/UNIT_ID/串口参数等
  polling_interval_ms INTEGER NOT NULL,   -- 轮询周期
  timeout_ms     INTEGER NOT NULL,        -- 超时
  retries        INTEGER NOT NULL,        -- 重试次数
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id)
);
```

---

### 5.6 资产表 `assets`

```sql
CREATE TABLE assets (
  id             INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL UNIQUE, -- 内部名，如 'NORTH_COMP_01'
  display_name   TEXT    NOT NULL,        -- 显示名，如 '北区1号压缩机'
  device_type_id INTEGER NOT NULL,
  location       TEXT    NOT NULL DEFAULT '',
  enabled        INTEGER NOT NULL DEFAULT 1,
  metadata_json  TEXT    NOT NULL DEFAULT '{}', -- 自定义元数据
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_type_id) REFERENCES device_types(id)
);
```

---

### 5.7 资产通信绑定表 `asset_comm_bindings`

```sql
CREATE TABLE asset_comm_bindings (
  id          INTEGER PRIMARY KEY,
  asset_id    INTEGER NOT NULL,  -- FK: assets.id
  instance_id INTEGER NOT NULL,  -- FK: comm_instances.id
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(asset_id) REFERENCES assets(id),
  FOREIGN KEY(instance_id) REFERENCES comm_instances(id)
);

CREATE UNIQUE INDEX idx_asset_comm_unique
ON asset_comm_bindings(asset_id, instance_id);
```

---

### 5.8 资产映射表 `asset_mappings`

```sql
CREATE TABLE asset_mappings (
  id             INTEGER PRIMARY KEY,
  asset_id       INTEGER NOT NULL,
  asset_tag_name TEXT    NOT NULL, -- 对应 device_type_tags.tag_name
  instance_id    INTEGER NOT NULL, -- 对应 comm_instances.id
  point_name     TEXT    NOT NULL, -- 对应 point_table_points 的子点名
  is_overridden  INTEGER NOT NULL DEFAULT 0, -- 是否覆盖自动映射
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(asset_id) REFERENCES assets(id),
  FOREIGN KEY(instance_id) REFERENCES comm_instances(id)
);

CREATE UNIQUE INDEX idx_asset_mappings_unique
ON asset_mappings(asset_id, asset_tag_name);

CREATE INDEX idx_asset_mappings_instance_point
ON asset_mappings(instance_id, point_name);
```

**非常关键：**

* 一条资产映射记录定义了：

  > “资产 A 的业务字段 X 来源于通信实例 I 的某个子点 P（完整点名如 `StatusWord4.mode_code`）。”

* 一个资产可以有多条记录指向 **不同通信实例**；
* B 就是通过 `instance_id + point_name` 反查这张表，把多个实例的数据拼成一个资产，且不需要保存 bit_index/bit_mask。

---

### 5.9 SOE 事件表 `soe_events`

```sql
CREATE TABLE soe_events (
  id               INTEGER PRIMARY KEY,
  asset_id         INTEGER NOT NULL,
  asset_tag_name   TEXT    NOT NULL,
  event_type       TEXT    NOT NULL, -- 'ALARM_ON'|'ALARM_OFF'|'STATE_CHANGE'|'CMD_SENT'|'CMD_FAIL'|'PARAM_CHANGE'|'SETPOINT_CHANGE'
  severity         INTEGER NOT NULL, -- 0~5
  value_num        REAL,
  value_text       TEXT    NOT NULL DEFAULT '',
  source_instance_id INTEGER,
  source_point_name TEXT,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 事件发生时间
  inserted_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 写入 DB 时间
  extra_json       TEXT    NOT NULL DEFAULT '{}',
  FOREIGN KEY(asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_soe_asset_time
ON soe_events(asset_id, created_at);

CREATE INDEX idx_soe_time
ON soe_events(created_at);
```

---

## 6. InfluxDB 结构

### 6.1 数据库与 RP

* 数据库：`iiot`

Retention Policies：

1. `raw_7d`

   * 保留 7 天原始数据；
   * 默认写入的 RP。

2. `agg_5m_365d`

   * 保留 365 天；
   * 用于 5 分钟粒度聚合数据。

---

### 6.2 `raw_points` measurement

* RP：`raw_7d`

Tags：

* `instance_id`（string）：通信实例名称，如 `PLC-01`；
* `point_name`（string）：点表点名，如 `OutletPressure`。

Fields：

* `raw_value`（float）：原始值；
* `eng_value`（float，可选）：工程值（如 A 已做 kx+b，可写入）；
* `quality`（int）：质量码。

**写入规则：**

* **只写入从设备采集到的数据**（MEASURE/ACCUM/PARAM 等），这些是 A 采集后通过 NNG 数据通道发送给 B 的；
* 状态字类点（例如 `StatusWord2`）写入 `raw_value`，不拆 bit；
* STATUS/COMMAND 的业务语义由 B 的 SOE 处理，不需要在 Influx 里维护；
* **重要**：写操作（SETPOINT/COMMAND/PARAM_SET 的下发指令）**不存入 Influx**，只产生 SOE；只有设备响应后 A 采集到的数据才写入 Influx。

---

### 6.3 `agg_5m_points` measurement

* RP：`agg_5m_365d`

Tags 同上。

Fields：

* `avg_value`、`min_value`、`max_value`、`quality`。

B 定时从 `raw_points` 按 5 分钟窗口聚合写入。

---

## 7. NNG 消息协议（A ↔ B）

### 7.1 通道

* 控制通道：`ipc:///var/run/iiot_ctrl.ipc`

  * B：REQ
  * A：REP

* 数据通道：`ipc:///var/run/iiot_data.ipc`

  * A：PUSH
  * B：PULL

所有消息为 JSON 文本。

---

### 7.2 控制消息

#### 7.2.1 CONFIG_SNAPSHOT（B→A）

下发采集配置快照。

```json
{
  "msg_type": "CONFIG_SNAPSHOT",
  "version": 5,
  "generated_at": "2025-11-16T10:00:00Z",
  "instances": [
    {
      "instance_id": "PLC-01",
      "enabled": true,
      "protocol_type": "modbus_tcp",
      "protocol_config": {
        "ip": "192.168.1.10",
        "port": 502,
        "unit_id": 1
      },
      "polling_interval_ms": 1000,
      "timeout_ms": 500,
      "retries": 2,
      "points": [
        {
          "point_name": "OutletPressure",
          "address": "40001",
          "io_type": "AI",
          "raw_type": "INT16",
          "byte_order": "BE",
          "scale_k": 0.1,
          "scale_b": 0.0
        },
        {
          "point_name": "StatusWord2",
          "address": "40010",
          "io_type": "DI",
          "raw_type": "BITFIELD16",
          "byte_order": "BE",
          "scale_k": 1.0,
          "scale_b": 0.0
        }
      ]
    }
  ]
}
```

A 应答：

```json
{
  "msg_type": "CONFIG_APPLY_RESULT",
  "version": 5,
  "status": "OK",
  "error_message": ""
}
```

---

#### 7.2.2 WRITE_POINT（B→A）

用于 SETPOINT / COMMAND / PARAM_SET 写入。

```json
{
  "msg_type": "WRITE_POINT",
  "request_id": "uuid-1234",
  "timestamp": "2025-11-16T10:00:01Z",
  "instance_id": "PLC-01",
  "point_name": "ParamSetReg",  // 或 'OutletPressureSet' / 'CmdWord'
  "raw_value": 123,             // 写到设备的原始值
  "write_kind": "PARAM_SET"     // 'SETPOINT' | 'COMMAND' | 'PARAM' | 'PARAM_SET'
}
```

A 应答：

```json
{
  "msg_type": "WRITE_POINT_RESULT",
  "request_id": "uuid-1234",
  "timestamp": "2025-11-16T10:00:01.200Z",
  "status": "OK",
  "error_message": ""
}
```

B 根据 `write_kind` 决定写何种 SOE：

* SETPOINT：必须写 SETPOINT_CHANGE SOE；
* COMMAND：必须写 CMD_SENT / CMD_FAIL SOE；
* PARAM_SET：必须写 PARAM_CHANGE SOE。

---

### 7.3 数据消息（A→B）

#### 7.3.1 POINT_VALUE

标量类点（包括：普通测量、累积量、参数、设定值等）。

```json
{
  "msg_type": "POINT_VALUE",
  "timestamp": "2025-11-16T10:00:00.123Z",
  "instance_id": "PLC-01",
  "point_name": "OutletPressure",
  "raw_value": 1234,
  "eng_value": 12.34,
  "quality": 0
}
```

#### 7.3.2 POINT_BITS

状态字点（BITFIELD16 等），A 解析出所有 bit。

```json
{
  "msg_type": "POINT_BITS",
  "timestamp": "2025-11-16T10:00:00.123Z",
  "instance_id": "PLC-01",
  "point_name": "StatusWord2",
  "raw_value": 47595,
  "bits": [0,1,0,0,0,0,0,0, 1,1,0,1,0,0,0,1],
  "quality": 0
}
```

B：

* 把 `raw_value` 写入 Influx；
* 用 `mapping_index[instance_id][point_name]` 找到所有业务字段（RUN_MODE、各种报警、命令反馈等），直接使用 A 拆好的子点值生成业务值，无需再做 bit 运算。

---

## 8. B 进程内存结构

### 8.1 映射索引 `mapping_index`

**目标**：实时数据处理绝不访问 SQLite，每条采集数据只做 O(1) 内存查表。

结构：

```python
mapping_index: dict[str, dict[str, list[MappingEntry]]]

class MappingEntry:
    asset_id: int
    asset_tag_name: str
    semantic_type: str     # MEASURE/STATUS/ACCUM/PARAM/SETPOINT/COMMAND/PARAM_SET
    data_type: str         # BOOL/INT/FLOAT/ENUM
    severity: int          # 0~5
    enum_map: dict | None  # data_type='ENUM' 时的 code->label
```

构建时机：

1. B 启动时；
2. 每次开发者/运维角色在 UI 保存配置（点表/通信实例/资产/映射）后。

构建过程：

1. 从 `asset_mappings` 联查 `assets`、`comm_instances`、`device_type_tags` 得到所有映射；
2. 构造 `MappingEntry`；
3. 按 `instance_name (comm_instances.name)` 和 `point_name` 填入：

```python
inst = comm_instances.name   # 比如 'PLC-01'
pt   = point_name            # 比如 'StatusWord4.mode_code'

mapping_index.setdefault(inst, {}).setdefault(pt, []).append(entry)
```

---

### 8.2 资产实时状态 `asset_state`

**目标**：为光字牌/实时接口提供当前业务字段状态。

结构：

```python
asset_state: dict[int, dict[str, Any]]

# 示例：
asset_state[1] = {
  "RUN_MODE": "自动",
  "OUTLET_PRESSURE": 12.5,
  "MOTOR_CURRENT": 37.0,
  "VIB_A": 6.2,
  "ALM_LOW_PRESS": True,
  "ALM_OVER_TEMP": False,
  ...
}
```

更新流程：

1. B 接收到某条消息（POINT_VALUE / POINT_BITS）；
2. 通过 `mapping_index[instance_id][point_name]` 获得所有 `MappingEntry`；
3. 逐条计算业务值；
4. 将 `asset_state[asset_id][asset_tag_name]` 更新为新值；
5. 若 `semantic_type='STATUS'`，检查旧值→新值变化，写入 SOE；
6. 同步通过 WebSocket 推送到前端。

---

## 9. 典型场景：从配置到光字牌 & 写指令

### 9.1 多通信实例组成一个设备（完整例子）

设备：**北区1号压缩机**（asset_id=1）

数据来源：

| 通信实例   | instance_name | 协议         | 提供的信号                                            |
| ------ | ------------- | ---------- | ------------------------------------------------ |
| PLC-01 | `PLC-01`      | Modbus TCP | `StatusWord2`（16 位混合：运行模式 + 报警）；`OutletPressure` |
| VFD-33 | `VFD-33`      | Modbus RTU | `MultiStatus`（模式 + 报警 + 电流）；                     |
| VIB-12 | `VIB-12`      | TCP 专有     | `VibA`（A 相振动）                                    |

**开发者/运维角色配置步骤：**

1. 在 `device_type_tags` 里为设备类型 `B_COMPRESSOR` 定义字段：

   * `OUTLET_PRESSURE` → `MEASURE`；
   * `RUN_MODE` → `STATUS` (ENUM)；
   * `ALM_LOW_PRESS`、`ALM_OVER_TEMP` 等 → `STATUS` (BOOL)；
   * `MOTOR_CURRENT` → `MEASURE`；
   * `VIB_A` → `MEASURE`；
   * `FREQ_SETPOINT` → `SETPOINT`；
   * `CMD_START` → `COMMAND`；
   * `PROTECT_THRESHOLD` → `PARAM`；
   * `PARAM_SET_PROTECT_THRESHOLD` → `PARAM_SET`。

2. 为 PLC 点表 `COMP_MODBUS_V1` 定义：

   * `OutletPressure`：INT16、kx=0.1；
   * `StatusWord4`：BITFIELD16，并在 `parse_rules_json` 里声明子点：
     * `mode_code`（`kind=BITS_RANGE`，bit0~1）；
     * `high_temp_bit`（`kind=BIT`，bit2）；
     * `over_press_bit`（`kind=BIT`，bit3）。

3. 为 VFD 点表定义：

   * `MultiStatus`：在 `parse_rules_json` 中拆出 `mode_code`、`alarms_bitfield`、`current` 等子点；
   * 如需再细分报警，可继续用 `sub_points` 指定更多 bit。

4. 为振动仪点表定义 `VibA`。

5. 创建 `comm_instances`：

   * `PLC-01` → `COMP_MODBUS_V1`；
   * `VFD-33` → `VFD_V1`；
   * `VIB-12` → `VIB_V1`。

6. 创建资产 `NORTH_COMP_01`（`device_type_id=B_COMPRESSOR`），并在 `asset_comm_bindings` 中绑定 `PLC-01`、`VFD-33`、`VIB-12`。

7. 在资产映射 UI 中，把字段接到具体子点：

   ```text
   资产: NORTH_COMP_01
   字段: OUTLET_PRESSURE → PLC-01.OutletPressure
   字段: RUN_MODE        → PLC-01.StatusWord4.mode_code
   字段: ALM_LOW_PRESS   → PLC-01.StatusWord4.over_press_bit
   字段: MOTOR_CURRENT   → VFD-33.MultiStatus.current
   字段: VIB_A           → VIB-12.VibA
   字段: CMD_START       → PLC-01.CmdWord.cmd_start_bit
   字段: PARAM_SET_PROTECT_THRESHOLD → PLC-01.ParamSetReg
   ```

8. B 重建 `mapping_index`，并生成 CONFIG_SNAPSHOT 下发给 A。

---

### 9.2 运行：采集 → 映射 → 光字牌

1. A 采集到：

   * `PLC-01.OutletPressure.raw=1234` → `eng=123.4`；
   * `PLC-01.StatusWord4.mode_code=3`；
   * `PLC-01.StatusWord4.high_temp_bit=1`；
   * `PLC-01.StatusWord4.over_press_bit=0`；
   * `VFD-33.MultiStatus.current=37.0`；
   * `VIB-12.VibA.eng=6.2`。

2. A 通过 NNG 发送 `POINT_VALUE` 消息，`point_name` 直接就是子点名（例如 `StatusWord4.mode_code`）。

3. B 处理 `PLC-01.StatusWord4.*`：

   * 查询 `mapping_index["PLC-01"]["StatusWord4.mode_code"]`、`["PLC-01"]["StatusWord4.high_temp_bit"]` 等，直接拿到对应字段；
   * 把子点值原样写进 `asset_state`，无需再做 bit 解析；
   * 例如：

     * `RUN_MODE="模式-手动"`；
     * `ALM_LOW_PRESS=True`；
     * `ALM_OVER_TEMP=False`。

   * 更新 `asset_state[1]`：

     ```python
     asset_state[1]["RUN_MODE"] = "模式-手动"
     asset_state[1]["ALM_LOW_PRESS"] = True
     asset_state[1]["ALM_OVER_TEMP"] = False
     ```

   * 比较旧值/新值，针对 STATUS 生成 SOE：

     * 低压报警从 0→1 → 写 ALARM_ON SOE；
     * 运行模式从“自动”→“手动” → 写 STATE_CHANGE SOE。

4. B 处理其他点（OutletPressure、MOTOR_CURRENT、VIB_A），更新 `asset_state` 并写入 Influx（raw_points）。

5. 光字牌前端通过 WebSocket 得到：

   * RUN_MODE 显示为“手动”高亮；
   * 各报警灯状态；
   * 出口压力、电机电流、振动等数值；
   * 实时 SOE 列表显示刚刚发生的报警和模式变化。

---

### 9.3 写指令示例：SETPOINT / COMMAND / PARAM_SET

#### 9.3.1 修改设定值（SETPOINT）

场景：普通用户将压缩机的频率设定从 48Hz 调到 50Hz。

1. 前端发：

   ```http
   POST /api/assets/1/tags/FREQ_SETPOINT/write
   {
     "value": 50.0
   }
   ```

2. B 处理：

   * 查 `device_type_tags` 确认 `FREQ_SETPOINT` 的 semantic_type='SETPOINT'；
   * 查 `asset_mappings` 找到：

     * `instance_id = PLC-01`；
     * `point_name = "FreqSetReg"`；
   * 根据点表的 `scale_k`, `scale_b` 反推 raw_value；
   * 构造 WRITE_POINT：

     ```json
     {
       "msg_type": "WRITE_POINT",
       "request_id": "uuid-1",
       "timestamp": "...",
       "instance_id": "PLC-01",
       "point_name": "FreqSetReg",
       "raw_value": 500,         // 举例
       "write_kind": "SETPOINT"
     }
     ```

3. A 执行写操作，返回 OK。

4. B **必须**：

   * 更新本地"最新设定值"缓存；
   * **立即产生 SETPOINT_CHANGE SOE**（不存入 Influx）：
     ```text
     event_type = 'SETPOINT_CHANGE'
     asset_tag_name = 'FREQ_SETPOINT'
     severity = (来自 device_type_tags)
     value_text = '频率设定 48Hz -> 50Hz'
     ```

5. 设备执行后，实际过程量（如频率 MEASURE）会变化，A 采集 MEASURE 数据写入 Influx，可通过 MEASURE 查看执行效果。SETPOINT 本身不存入 Influx。

---

#### 9.3.2 启动命令（COMMAND）

场景：普通用户点击“启动”按钮。

1. 前端：

   ```http
   POST /api/assets/1/tags/CMD_START/write
   {
     "value": true
   }
   ```

2. B：

   * 查 `device_type_tags` → semantic_type='COMMAND'；
   * 查 `asset_mappings` → 找到 `PLC-01.CmdWord.cmd_start_bit`；
   * 根据点表规则知道该子点对应哪个 bit，B 只需把布尔值转换为写入值（set/reset）；
   * 发送 WRITE_POINT(write_kind='COMMAND') 给 A。

3. A 写设备，返回 OK。

4. B 立刻写 SOE：

   ```text
   event_type = 'CMD_SENT'
   asset_tag_name = 'CMD_START'
   severity = (来自 device_type_tags)
   value_text = '发送启动命令'
   ```

5. 设备执行后，运行模式 STATUS 从“停机”→“运行”，B 会从 STATUS 流程写一条 STATE_CHANGE SOE（这是设备真实状态变化）。

---

#### 9.3.3 修改设备参数（PARAM & PARAM_SET）

设备有一个参数：`PROTECT_THRESHOLD`（保护门限），设备支持通过写寄存器修改该参数。

设计方式：

* `PROTECT_THRESHOLD`（semantic_type='PARAM'）：表示当前参数值（从设备读回来）；
* `PARAM_SET_PROTECT_THRESHOLD`（semantic_type='PARAM_SET'）：表示“对参数写入”的操作语义。

写参数流程：

1. 用户在“参数设置”页面，将门限从 80 改为 85：

   ```http
   POST /api/assets/1/tags/PARAM_SET_PROTECT_THRESHOLD/write
   {
     "value": 85.0
   }
   ```

2. B：

   * 查到 `semantic_type='PARAM_SET'`；
   * 查 `asset_mappings` → 例如：

     * `instance_id = PLC-01`
     * `point_name = 'ParamSetReg'`
   * 反向 kx+b 计算 raw_value；
   * 发送 WRITE_POINT(write_kind='PARAM_SET') 给 A。

3. A 写入参数寄存器（设备内部参数改变），返回 OK。

4. B **必须立即写一条 SOE**（不存入 Influx）：

   ```text
   event_type = 'PARAM_CHANGE'
   asset_tag_name = 'PROTECT_THRESHOLD'
   severity = (使用 PARAM 的 severity 或 PARAM_SET 的 severity)
   value_text = '保护门限 80 -> 85'
   ```

5. 下一个采集周期，A 从对应寄存器读出新的参数值，B 以 `PROTECT_THRESHOLD`（PARAM）字段展示，并将采集到的数据写入 Influx，形成参数历史曲线。

**这样：**

* `PARAM` = “实际参数值”（来自设备）；
* `PARAM_SET` = “参数写操作”（通过通信执行）；
  两者均基于通信实例，而不是平台本地配置。

---

## 10. 总结

这份文档定义了：

* **唯一的语义模型**（7 种 semantic_type），全部是通过通信实例实现的设备读写行为；
* **清晰的三层抽象**：信号（point）→ 业务字段（tag）→ 资产（asset）；
* **严谨的 SQLite 表结构**（带 DATETIME + DEFAULT CURRENT_TIMESTAMP），涵盖设备类型、业务字段、点表、通信实例、资产、映射、SOE；
* **InfluxDB 只作为设备时序数据存储**（raw + agg），并不用于状态/事件逻辑；
* **NNG 消息协议** 串起 B→A 配置和 A→B 数据 + 写命令；
* **B 的内存结构**（mapping_index + asset_state）保障高实时性，不在读路径访问数据库；
* **多通信实例组成一个设备** 的完整流程与示例；
* **复杂寄存器（高位枚举 + 低位 bit 等）** 的解析与映射方式；
* **SETPOINT / COMMAND / PARAM_SET** 的写回行为完整闭环：
  用户 → B → A → 设备 → A 采集 → B 业务解析 → SOE + 历史。

实现时，只要严格按照这里的表结构、消息格式、内存结构和流程来做，就能得到一套**真正能上线跑生产的工业网关数据平台**。

---

## 11. 前端配置与操作（React + shadcn）

> 目标：把“点表模板 → 子点 → 资产字段”这一链条在前端配置界面里完整走通，避免任何人手工处理 bit 运算。

### 11.1 菜单结构

左侧菜单保持两大块：

1. **Configuration**
   * Device Types（设备模板）
   * Comm Templates（通信模板）
   * Comm Instances（通信实例）
   * Assets & Mapping（设备实例与映射）
2. **SOE Viewer**（SOE 查询）

### 11.2 配置流程（以“数字点 4（多枚举）”为例）

#### 11.2.1 设备模板：定义业务字段

路径：`Configuration → Device Types`

1. 列表页：列出名称、内部名、描述、字段数量，工具栏提供搜索 + `新建设备模板`。
2. 详情页两个 Tab：
   * 基本信息：内部名、显示名、描述。
   * 业务字段（Tags）：可按 `semantic_type`/`group_name` 过滤，点击 `新增字段`。
3. 字段 Dialog：
   * `tag_name`、`display_name`
   * `data_type`（BOOL/INT/FLOAT/ENUM）
   * `semantic_type`
   * `engineering_unit`
   * `group_name`
   * `severity`
   * 若为 ENUM，提供表格式枚举编辑器（code+label），写入 `enum_json`。

> 例子中需要在这里创建 `RUN_STATUS`（ENUM）与 `ALM_HIGH_TEMP` / `ALM_OVER_PRESS`（BOOL）。

#### 11.2.2 通信模板：配置点表与子点

路径：`Configuration → Comm Templates`

1. 列表页：name、display_name、protocol_type、points_count。
2. Points Tab：
   * 表格列：point_name、display_name、address、raw_type、子点数量；
   * 每行提供 `编辑点` 与 `配置子点`。
3. `编辑点` Dialog：维护地址、raw_type、byte_order、scale、描述等。
4. `配置子点` Sheet：
   * 每个子点包含 `name`、`type`、`kind`（BIT / BITS_RANGE）、bit 或 bit_from/bit_to；
   * 支持增删行并实时预览；
   * 保存后写入 `parse_rules_json`，A 进程会产出形如 `StatusWord4.mode_code` 的子点。

#### 11.2.3 通信实例

路径：`Configuration → Comm Instances`

* 列表页：展示协议类型、点表模板、轮询周期等；
* 表单字段：`name`、`display_name`、`enabled`、点表模板（自动带出协议类型）、`protocol_config`（JSON 编辑器）、`polling_interval_ms`、`timeout_ms`、`retries`。

#### 11.2.4 设备实例与映射

路径：`Configuration → Assets & Mapping`

1. 资产列表：display_name、device_type、location、enabled，可 `新建设备`。
2. 新建设备向导：
   1. 基本信息：选择 `device_type`，填写 name / display_name / location / enabled。
   2. 选择通信实例：多选 `comm_instances`，保存后写入 `asset_comm_bindings`。
   3. 自动映射：后端按命名规则给出初始匹配统计，提供跳转至映射页。
3. 映射 UI：
   * 左侧：业务字段树（按 `group_name` 分组），显示「已映射/未映射」状态；
   * 右侧：信号选择器，先选实例，再列出该实例下所有点及子点；
   * 中间：当前字段映射详情，可解除绑定或保存；
   * 操作：选字段 → 点击子点 → 保存，写入 `asset_mappings`。

> 对“数字点 4”而言，在此把 RUN_STATUS 绑定到 `PLC-01.StatusWord4.mode_code`，把两个报警字段绑定到 `StatusWord4.high_temp_bit` / `StatusWord4.over_press_bit`。

### 11.3 SOE Viewer

路径：`SOE Viewer`

* 筛选卡片：时间范围（含快捷按钮）、资产多选、severity 多选、event_type 多选、关键字、`应用筛选`/`重置`；
* 结果表格：时间、资产、字段名（根据 `device_type_tags.display_name` 映射）、event_type、severity、value_text，支持分页和排序；
* 行展开显示 `extra_json`，适配新的 `soe_events` 结构。

### 11.4 交互注意事项

* 表单统一使用 React Hook Form + Zod，UI 组件统一使用 shadcn/ui；
* 所有下拉/按钮都要考虑中英文长度，自适应宽度使用 `flex-1` + `min-w-[xxx]`；
* 长耗时 API（如配置下发）要根据参数计算 Axios `timeout`，确保前端不会比后端先超时；
* 重新提交请求前必需清空旧结果状态，给用户清晰的“加载中”反馈；
* 文件下载必须采用 Axios + `responseType: 'blob'` 并在完成后调用 `URL.revokeObjectURL`；
* 滚动条/全局样式在 `src/index.css` 的 `@layer base` 中统一配置，深浅色模式保持一致体验。

通过这套 UI 流程，工程人员无需接触 bit 运算即可完成“设备模板 → 点表子点 → 资产映射 → SOE 查询”的闭环配置。
