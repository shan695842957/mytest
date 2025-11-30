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

* **模板映射 `template_mappings`**
  描述 **设备类型 + 点表模板** 之间的通用关系，比如：

  > “B 型压缩机上的业务字段 RUN_MODE
  > 来自点表 COMP_MODBUS_V1 中的 StatusWord2（低 8 位枚举）”

* **资产映射 `asset_mappings`**（非常关键）
  对每一个具体资产，我们要告诉系统：

  > “这个资产的 `RUN_MODE`，
  > 来自 `PLC-01` 的 `StatusWord2` 的某段位/某个点；
  > `MOTOR_CURRENT` 来自 `VFD-33.MultiStatus`；
  > `VIB_A` 来自 `VIB-12.VibA`。”

一个资产可以有多条映射记录，每条记录可以指向不同的 `instance_id` / `point_name`：

| asset   | asset_tag_name      | instance_id | point_name          | 示例含义         |
| ------- | ------------------- | ----------- | ------------------- | ------------ |
| 北区1号压缩机 | RUN_MODE            | PLC-01      | StatusWord2_Mode    | 运行模式枚举来自 PLC |
| 北区1号压缩机 | OUTLET_PRESSURE     | PLC-01      | OutletPressure      | 出口压力来自 PLC   |
| 北区1号压缩机 | MOTOR_CURRENT       | VFD-33      | MultiStatus_Current | 电流来自变频器      |
| 北区1号压缩机 | VIB_A               | VIB-12      | VibA                | 振动来自振动仪      |
| 北区1号压缩机 | CMD_START           | PLC-01      | CmdWord             | 启动命令对应某 bit  |
| 北区1号压缩机 | PARAM_SET_THRESHOLD | PLC-01      | ParamSetReg         | 写入某参数寄存器     |

**B 就通过这张表，将“多通信实例、多点”拼成“一个设备”的完整业务视图。**

---

# 一、SQLite 配置库：最终版结构


## 1. 设备侧（业务语义）

### 1.1 `device_types` 设备类型

> 一种机型的定义：有哪类业务字段。

```sql
CREATE TABLE device_types (
  id           INTEGER PRIMARY KEY,
  name         TEXT    NOT NULL UNIQUE, -- 内部名，如 'B_COMPRESSOR'
  display_name TEXT    NOT NULL,        -- UI 显示名，如 'B型压缩机'
  description  TEXT    NOT NULL DEFAULT '',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 1.2 `device_type_tags` 业务字段模板（带 enum_json）

> 描述“这类设备有哪些字段”和字段的语义。

```sql
CREATE TABLE device_type_tags (
  id             INTEGER PRIMARY KEY,
  device_type_id INTEGER NOT NULL,          -- FK: device_types.id
  tag_name       TEXT    NOT NULL,          -- 内部字段名，如 'RUN_STATUS'
  display_name   TEXT    NOT NULL,          -- UI 名，如 '运行状态'
  data_type      TEXT    NOT NULL,          -- 'BOOL' | 'INT' | 'FLOAT' | 'ENUM'
  semantic_type  TEXT    NOT NULL,          -- 'MEASURE'|'STATUS'|'ACCUM'|'PARAM'|'SETPOINT'|'COMMAND'|'PARAM_SET'
  engineering_unit TEXT NOT NULL DEFAULT '',-- 单位，可空字符串
  group_name     TEXT    NOT NULL DEFAULT '',-- 光字牌分组，如 '运行状态','工艺报警'
  severity       INTEGER NOT NULL DEFAULT 0, -- 严重级别 0~5（只对 STATUS/COMMAND/PARAM 有意义）
  enum_json      TEXT    NOT NULL DEFAULT '{}',-- data_type='ENUM' 时必须是 code->label 映射
  description    TEXT    NOT NULL DEFAULT '',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_type_id) REFERENCES device_types(id)
);

CREATE UNIQUE INDEX idx_device_type_tags_unique
ON device_type_tags(device_type_id, tag_name);
```

**要点：**

* 所有枚举字段的**所有可能值**只在这里定义；
* 不允许 per-asset 改枚举含义；要改就新建设备类型。

---

## 2. 通信侧（点表 & 实例）

### 2.1 `point_table_templates` 通信点表模板

> 标准点表：这类协议/设备的寄存器布局。

```sql
CREATE TABLE point_table_templates (
  id           INTEGER PRIMARY KEY,
  name         TEXT    NOT NULL UNIQUE, -- 内部名，如 'COMP_MODBUS_V1'
  display_name TEXT    NOT NULL,        -- UI 名
  protocol_type TEXT   NOT NULL,        -- 'modbus_tcp' | 'modbus_rtu' | 'custom_xxx'
  description  TEXT    NOT NULL DEFAULT '',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.2 `point_table_points` 点表点（含子点解析规则）

> **重点：parse_rules_json 告诉 A 怎么把一个寄存器拆成多个“子点”。**

```sql
CREATE TABLE point_table_points (
  id             INTEGER PRIMARY KEY,
  point_table_id INTEGER NOT NULL,      -- FK: point_table_templates.id
  point_name     TEXT    NOT NULL,      -- 内部名，如 'StatusWord4'
  display_name   TEXT    NOT NULL,      -- UI 名，如 '数字点 4 (多枚举)'
  address        TEXT    NOT NULL,      -- 协议地址，如 '40004'
  io_type        TEXT    NOT NULL,      -- 'AI' | 'AO' | 'DI' | 'DO' | 'STRING'
  raw_type       TEXT    NOT NULL,      -- 'INT16'|'UINT16'|'INT32'|'FLOAT32'|'BITFIELD16'...
  byte_order     TEXT    NOT NULL,      -- 'BE'|'LE'|'BE_SWAP'|'LE_SWAP'
  scale_k        REAL    NOT NULL DEFAULT 1.0,
  scale_b        REAL    NOT NULL DEFAULT 0.0,
  parse_rules_json TEXT NOT NULL DEFAULT '{}', -- 子点定义
  description    TEXT    NOT NULL DEFAULT '',
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id)
);

CREATE UNIQUE INDEX idx_points_unique
ON point_table_points(point_table_id, point_name);
```

**parse_rules_json 约定（给 A 用，也给前端显示子点用）：**

```json
{
  "sub_points": [
    {
      "name": "mode_code",       // 子点名：最终 instance 中的 point_name 实际是 'StatusWord4.mode_code'
      "type": "UINT",            // 'BOOL' | 'INT' | 'UINT' | 'FLOAT'
      "kind": "BITS_RANGE",      // 'BITS_RANGE' 表示从 bit_from 到 bit_to 拼成数字
      "bit_from": 0,
      "bit_to": 1
    },
    {
      "name": "high_temp_bit",
      "type": "BOOL",
      "kind": "BIT",
      "bit": 2
    },
    {
      "name": "over_press_bit",
      "type": "BOOL",
      "kind": "BIT",
      "bit": 3
    }
  ]
}
```

A 按这个规则，把一个 BITFIELD16 拆成多个子点上报。

---

### 2.3 `comm_instances` 通信实例

> 某个具体 PLC/变频器，挂某个点表模板。

```sql
CREATE TABLE comm_instances (
  id             INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL UNIQUE, -- 'PLC-01'
  display_name   TEXT    NOT NULL,        -- '1号压缩机PLC'
  enabled        INTEGER NOT NULL DEFAULT 1,
  point_table_id INTEGER NOT NULL,        -- FK: point_table_templates.id
  protocol_type  TEXT    NOT NULL,        -- 冗余，便于直接查
  protocol_config TEXT   NOT NULL,        -- JSON：ip/port/unit_id 或 串口参数
  polling_interval_ms INTEGER NOT NULL,
  timeout_ms     INTEGER NOT NULL,
  retries        INTEGER NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id)
);
```

---

## 3. 设备实例 & 映射

### 3.1 `assets` 设备实例

> 现场的“北区1号压缩机”这类实体。

```sql
CREATE TABLE assets (
  id             INTEGER PRIMARY KEY,
  name           TEXT    NOT NULL UNIQUE, -- 'NORTH_COMP_01'
  display_name   TEXT    NOT NULL,        -- '北区1号压缩机'
  device_type_id INTEGER NOT NULL,        -- FK: device_types.id
  location       TEXT    NOT NULL DEFAULT '',
  enabled        INTEGER NOT NULL DEFAULT 1,
  metadata_json  TEXT    NOT NULL DEFAULT '{}', -- 机组编号等扩展信息
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_type_id) REFERENCES device_types(id)
);
```

---

### 3.2 `asset_comm_bindings`（可选，但推荐）资产绑定的通信实例

> 单纯说明“这台设备用到了哪些通信实例”，方便 UI 过滤信号。

```sql
CREATE TABLE asset_comm_bindings (
  id          INTEGER PRIMARY KEY,
  asset_id    INTEGER NOT NULL,  -- FK: assets.id
  instance_id INTEGER NOT NULL,  -- FK: comm_instances.id
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(asset_id)    REFERENCES assets(id),
  FOREIGN KEY(instance_id) REFERENCES comm_instances(id)
);

CREATE UNIQUE INDEX idx_asset_comm_unique
ON asset_comm_bindings(asset_id, instance_id);
```

---

### 3.3 `asset_mappings` 资产映射（**现在全部 DIRECT**）

> 这一版里，**所有业务字段都绑定到“已经拆好的子点”上**。
> 所以不再需要 bit_Index/mask —— 这活已经交给 A 了。

```sql
CREATE TABLE asset_mappings (
  id             INTEGER PRIMARY KEY,
  asset_id       INTEGER NOT NULL,    -- FK: assets.id
  asset_tag_name TEXT    NOT NULL,    -- 对应 device_type_tags.tag_name
  instance_id    INTEGER NOT NULL,    -- FK: comm_instances.id
  point_name     TEXT    NOT NULL,    -- 包括子点，如 'StatusWord4.mode_code'
  is_overridden  INTEGER NOT NULL DEFAULT 0, -- 是否覆盖模板/自动映射
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(asset_id)    REFERENCES assets(id),
  FOREIGN KEY(instance_id) REFERENCES comm_instances(id)
);

CREATE UNIQUE INDEX idx_asset_mappings_unique
ON asset_mappings(asset_id, asset_tag_name);

CREATE INDEX idx_asset_mappings_instance_point
ON asset_mappings(instance_id, point_name);
```

> 现在的规则非常简单：
> **业务字段 ←(DIRECT)← 具体子点**。
> B 不再管 bit 运算。

---

## 4. SOE 事件记录（给查询用）

### 4.1 `soe_events`

```sql
CREATE TABLE soe_events (
  id               INTEGER PRIMARY KEY,
  asset_id         INTEGER NOT NULL,
  asset_tag_name   TEXT    NOT NULL,
  event_type       TEXT    NOT NULL, -- 'ALARM_ON'|'ALARM_OFF'|'STATE_CHANGE'|'CMD_SENT'|'CMD_FAIL'|'PARAM_CHANGE'
  severity         INTEGER NOT NULL,
  value_num        REAL,
  value_text       TEXT    NOT NULL DEFAULT '',
  source_instance_id INTEGER,
  source_point_name TEXT,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 事件时间
  inserted_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 写入时间
  extra_json       TEXT    NOT NULL DEFAULT '{}',
  FOREIGN KEY(asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_soe_asset_time
ON soe_events(asset_id, created_at);

CREATE INDEX idx_soe_time
ON soe_events(created_at);
```

---

# 二、新的前端操作设计（React + shadcn）

重点改动两块：

1. 通信模板 → 点表 → **子点配置**（指导 A 怎么拆）
2. 资产映射界面变得更简单：只做 `字段 ↔ 子点` 的 DIRECT 绑定。

其他菜单结构基本延用之前的。

---

## 1. 整体布局和菜单


**左侧菜单：**

1. Configuration

   * Device Types（设备模板）
   * Comm Templates（通信模板）
   * Comm Instances（通信实例）
   * Assets & Mapping（设备实例 & 映射）
2. SOE Viewer（SOE 查询）

---

## 2. 前端配置操作：一步步怎么点

我用你那张 **“数字点 4（多枚举）：运行 / 停机 / 故障 + 高温 / 超压”** 的图当例子讲操作流。

### 2.1 设备模板：定义业务字段（枚举 + 报警）

**路径**：`Configuration → Device Types`

1. **列表页**

   * 表格列：名称、内部名、描述、字段数量；
   * 工具栏：

     * 搜索框（name / display_name）
     * 按钮 `新建设备模板`。

2. **新建设备模板 / 编辑**

   * Tab1：基本信息（内部名、显示名、描述）。
   * Tab2：业务字段（Tags）

     * 上方工具栏：

       * 按 semantic_type / group_name 过滤；
       * 按钮 `新增字段`（光字牌最常用：STATUS 类型）。
     * 表格列：tag_name、display_name、data_type、semantic_type、group_name、severity。
     * 点击某行 `编辑` → 弹出 `Dialog` 表单：

       * tag_name（内部名）
       * display_name
       * data_type（Select：BOOL/INT/FLOAT/ENUM）
       * semantic_type（Select）
       * group_name
       * severity（滑条或 Select 0~5）
       * 当 data_type='ENUM' 时，展示一个 **枚举行编辑器**：

         * 表格式行编辑：

           * code（NumberInput）
           * label（Input）
         * 可增删行，底层生成 `enum_json`。

**实现“数字点 4”的设备字段：**

* 在此处创建：

  * `RUN_STATUS`（ENUM，group='运行状态'，enum_json=0运行/1停机/2故障）
  * `ALM_HIGH_TEMP`（BOOL，group='工艺报警'，severity=4）
  * `ALM_OVER_PRESS`（BOOL，group='工艺报警'，severity=5）

---

### 2.2 通信模板：配置数字点4 + 子点

**路径**：`Configuration → Comm Templates`

1. **列表页**

   * 表格：name、display_name、protocol_type、points_count。
   * 工具栏：搜索 + `新建`.

2. **模板详情（重点是点表 Tab）**

   * Tab1：基本信息；
   * Tab2：Points（点表）：

     * 工具栏：

       * 搜索 point_name/address
       * `新增点`
     * 表格列：

       * point_name / display_name / address / raw_type / 子点数量。
     * 每行右侧有按钮：

       * `编辑点`
       * `配置子点`

3. **编辑点（基础信息）**

   * 在 `Dialog` / `Sheet` 中：

     * point_name
     * display_name
     * address
     * io_type
     * raw_type（选择 BITFIELD16）
     * byte_order
     * scale_k / scale_b
     * 描述

4. **配置子点（关键 UI）**

   * 点击某行 `配置子点` 打开右侧 `Sheet`，标题类似：
     **“数字点 4 子点配置”**。
   * 子点列表：

     * 每一行一个子点：

       * 子点名（Input）：`mode_code` / `high_temp_bit` / `over_press_bit`
       * 子点类型（Select）：`BOOL` / `UINT` / `INT`
       * 解析类型（Select）：

         * `BIT`（单 bit）
         * `BITS_RANGE`（bit_from~bit_to）
       * 当选择 BIT：展示 `bit` 输入框（0~15）
       * 当选择 BITS_RANGE：展示 `bit_from` / `bit_to` 输入框
     * 可新增 / 删除行；
   * 底部 `保存`：

     * 前端将子点列表转换为结构化 JSON 填到 `parse_rules_json` 里；
     * 调用 `PUT /api/point-table-points/{id}`。

**这样：厂家的工程人员在“点表”这一页就把 “StatusWord4 怎么拆成 3 / T / F” 定死了。**

---

### 2.3 通信实例：绑定 PLC

**路径**：`Configuration → Comm Instances`

* 列表页：name、display_name、协议类型、点表模板、轮询周期。
* `新建` / `编辑` 表单：

  * name / display_name
  * enabled
  * 选择点表模板
  * 显示协议类型（可编辑或只读）
  * 协议配置（IP/端口/站号等）使用 `KeyValue` 或 JSON 编辑器
  * polling_interval_ms / timeout_ms / retries

> 建完 `PLC-01`，A 就会在 CONFIG_SNAPSHOT 里收到
> `StatusWord4` 及其 `sub_points` 配置。

---

### 2.4 设备实例：创建“北区1号压缩机”并绑定通信实例

**路径**：`Configuration → Assets & Mapping → Assets 子页`

1. **资产列表**

   * 表格：display_name、name、device_type、location、启用状态。
   * `新建设备` 按钮。

2. **新建设备向导（Wizard，3 步）**

**步骤 1：基本信息**

* 选择 device_type（下拉：`B_COMPRESSOR`）
* 填写 name / display_name / location / enabled
* 下一步

**步骤 2：选择使用的通信实例**

* 左侧为可选的 `comm_instances` 列表（支持搜索/勾选）
* 右侧为已选列表（tag 风格）
* 对于压缩机，选中 `PLC-01`（如果还有振动仪等，也可以勾选多个）
* 下一步

**步骤 3：生成初始映射**

* 调用后端 API：

  * 以 device_type 的 tag_name 和点表子点名做自动匹配（例如名字相同或根据规则匹配）；
  * 生成 `asset_comm_bindings` + `asset_mappings`；
* UI 只显示简要统计：

  * 已自动绑定字段数 / 总字段数；
  * 一键跳转到映射编辑页面。

---

### 2.5 资产映射：把业务字段接到具体子点

**路径**：`Configuration → Assets & Mapping → 点开某设备 → Mapping 子页`

新的映射 UI 非常简单，因为 B 这边不再管 BIT/MASK，只管“选哪个子点”。

#### 布局

* 左侧：业务字段树（按 group_name 分组）
* 右上：筛选当前可用的通信实例
* 右侧：信号点（含子点）列表
* 中间：所选字段的映射详情（可选）

##### 左侧：业务字段列表

* 使用 `Accordion` 按 group_name 分组：

  * “运行状态”、“工艺报警”、“工艺量”、“参数”等；
* 每个字段显示：

  * display_name
  * semantic_type / data_type Tag
  * 映射状态：

    * 已映射（绿色小点）
    * 未映射（灰色）

点击某字段，比如 `运行状态`：

* 在中间显示当前映射；
* 在右侧高亮当前绑定的信号点。

##### 右侧：信号点（含子点）列表

* 顶部：

  * 选择通信实例的 `Select`：`PLC-01` / `VFD-33` 等；
  * 搜索框（按 point_name/子点名）。
* 列表结构：

  * 先按 point 分组展示：

    * 标题：`StatusWord4`（数字点名称）
    * 下方列出其所有子点：

      * `StatusWord4.mode_code (UINT)`
      * `StatusWord4.high_temp_bit (BOOL)`
      * `StatusWord4.over_press_bit (BOOL)`
  * 子点行可点击，表示“将当前选中的业务字段绑定到这个子点”。

##### 中间：当前字段映射详情

* 显示：

  * 业务字段：`RUN_STATUS (ENUM / STATUS)`
  * 当前绑定：

    * `PLC-01.StatusWord4.mode_code`
  * 若当前未绑定，则显示“未绑定”。

* 提供按钮：

  * `解除绑定`
  * `保存`（改变后）

#### 映射操作流程（实现数字点 4 这张卡）

1. 在左侧选择字段 `RUN_STATUS`；
2. 在右侧通信实例里选择 `PLC-01`；
3. 在 `StatusWord4` 下点击子点 `StatusWord4.mode_code`；
4. 中间显示 “RUN_STATUS ← PLC-01.StatusWord4.mode_code”，点击保存；

同理：

* 选 `ALM_HIGH_TEMP` → 点击 `StatusWord4.high_temp_bit` → 保存；
* 选 `ALM_OVER_PRESS` → 点击 `StatusWord4.over_press_bit` → 保存；

完成后，左侧三个字段都显示为“已映射”。

---

## 3. SOE 查询页面（不变，只适配新结构）

**路径**：`SOE Viewer`

* 上部：过滤条件 Card

  * 时间范围（DateRangePicker + 快捷选项）
  * 设备（多选 Combobox）
  * Severity 多选（Tag/Checkbox）
  * Event Type 多选
  * 关键字搜索
  * `应用筛选` / `重置` 按钮
* 下部：事件表格

  * 时间、设备、字段名（从 tag_display_name）、event_type、severity、value_text
  * 支持分页 / 排序
  * 点击行展开详情（extra_json）

SOE 写入逻辑：

* B 在解析资产实时值时，如果 STATUS/COMMAND 等字段变化，根据 semantic_type + severity 写入 `soe_events`；
* 事件中的 `asset_tag_name` 对应 `device_type_tags.tag_name`，前端 JOIN 后显示中文名。

---

## 4. 对照一下：图片里的“数字点 4（多枚举）”从 0 到上线到底发生了什么

1. **设备模板**

   * 工程师在 Device Types→B 型压缩机里新建：

     * `RUN_STATUS`（ENUM：运行/停机/故障，group=运行状态）
     * `ALM_HIGH_TEMP`（BOOL，group=工艺报警）
     * `ALM_OVER_PRESS`（BOOL，group=工艺报警）

2. **通信模板**

   * 在 Comm Templates→压缩机点表 V1 里新建点 `StatusWord4`；
   * 在 “子点配置” 里添加：

     * `mode_code` = bit0..1 → UINT
     * `high_temp_bit` = bit2 → BOOL
     * `over_press_bit` = bit3 → BOOL

3. **通信实例**

   * Comm Instances 新建 `PLC-01`，绑定点表 V1。

4. **设备实例**

   * Assets 新建 `北区1号压缩机`，选择设备类型 B_COMPRESSOR；
   * 在向导第 2 步绑定 `PLC-01`；
   * 完成后进入 Mapping 页面。

5. **资产映射**

   * 在 Mapping 页面：

     * RUN_STATUS ← 选 `PLC-01.StatusWord4.mode_code`
     * ALM_HIGH_TEMP ← 选 `PLC-01.StatusWord4.high_temp_bit`
     * ALM_OVER_PRESS ← 选 `PLC-01.StatusWord4.over_press_bit`

6. **运行时**

   * A 按点表采 `StatusWord4`，按子点规则拆出 3 个子点值（3 / T / F）发给 B；
   * B 用 `asset_mappings` 直接把这 3 个子点喂给 3 个业务字段；
   * 再用 `enum_json` 把 3 映射成“故障”；
   * 前端光字牌：

     * 显示“数字点 4 (多枚举)”卡片；
     * 「运行状态」区域：3 个按钮，其中“故障”高亮，其余灰色；
     * 「工艺报警」区域：高温/超压，两块按钮按 bool 值亮灭；
   * 若状态变化，B 同时写 SOE 到 `soe_events`，SOE Viewer 能查。
