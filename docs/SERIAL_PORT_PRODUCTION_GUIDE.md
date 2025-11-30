# 串口测试工具 - 生产环境使用指南

## 📋 适用场景

串口测试工具适用于以下**真实生产场景**：

### 🏭 工业自动化
- **PLC 通信调试**：西门子、三菱、欧姆龙等 PLC
- **仪表设备调试**：Modbus RTU 仪表、传感器
- **执行器控制**：步进电机、伺服电机驱动器

### 🔌 嵌入式开发
- **单片机调试**：STM32、Arduino、ESP32 等
- **嵌入式 Linux**：树莓派、Jetson Nano 等
- **固件烧录**：通过串口下载固件

### 📡 通信设备
- **4G/5G 模块**：移远、广和通、芯讯通等
- **LoRa 模块**：SX1278、E32 等
- **GPS 模块**：NMEA-0183 协议解析

### 🛠️ 设备维护
- **串口服务器**：串口转以太网设备
- **UPS 电源**：通过串口监控 UPS 状态
- **交换机/路由器**：Console 口管理

---

## 🔌 支持的串口类型

### ✅ 真实物理串口
```
/dev/ttyS0, /dev/ttyS1, ...         # Linux 物理串口
COM1, COM2, COM3, ...               # Windows 物理串口
```

### ✅ USB 转串口设备
```
/dev/ttyUSB0, /dev/ttyUSB1, ...     # Linux USB 串口（CH340、CP2102、FT232 等）
/dev/ttyACM0, /dev/ttyACM1, ...     # Linux USB CDC 设备（Arduino）
COM3+                                # Windows USB 串口
```

### ✅ 蓝牙串口
```
/dev/rfcomm0, /dev/rfcomm1, ...     # Linux 蓝牙串口
```

### ❌ 不支持的设备
```
/dev/pts/*                           # 伪终端（不是真实串口）
```

---

## 🚀 真实使用场景示例

### 场景1: 调试 Modbus RTU 仪表

**设备**: 温湿度传感器（Modbus RTU，地址01，波特率9600）

#### 步骤：
1. **连接设备**: USB 转 RS485 模块插入电脑
2. **查看串口**: 
   ```bash
   ls -la /dev/ttyUSB*
   # 应该看到 /dev/ttyUSB0
   ```
3. **打开前端**: 访问 http://localhost:5173/tools/serial
4. **配置参数**:
   - 串口: `/dev/ttyUSB0`
   - 波特率: `9600`
   - 数据位: `8`
   - 校验位: `无校验 (N)`
   - 停止位: `1.0`
5. **点击打开串口**
6. **发送 Modbus 读取命令**:
   - 格式: `HEX`
   - 数据: `01 03 00 00 00 02 C4 0B`（读取地址01，寄存器0-1）
7. **查看响应**: 实时显示区会显示仪表返回的数据

---

### 场景2: 调试 4G 模块

**设备**: 移远 EC20 4G 模块

#### AT 命令测试：
1. **打开串口**: `/dev/ttyUSB2`（AT 命令口）
2. **配置**: 115200, 8N1
3. **发送 ASCII 命令**:
   ```
   AT              → 测试通信
   ATI             → 查询模块信息
   AT+CPIN?        → 查询 SIM 卡状态
   AT+CSQ          → 查询信号强度
   AT+COPS?        → 查询运营商
   ```
4. **查看响应**: 模块返回 `OK` 或数据

---

### 场景3: Arduino 串口监控

**设备**: Arduino Uno（Serial.print 输出调试信息）

#### 监控流程：
1. **打开串口**: `/dev/ttyACM0`
2. **配置**: 9600, 8N1（Arduino 默认）
3. **自动接收**: Arduino 每秒发送温度数据
4. **实时显示**:
   ```
   [10:30:01] HEX: 54 65 6D 70 3A 32 35 2E 33 43  ASCII: Temp:25.3C
   [10:30:02] HEX: 54 65 6D 70 3A 32 35 2E 34 43  ASCII: Temp:25.4C
   ```

---

### 场景4: 多串口并发测试

**设备**: 3 个 USB 转串口模块

#### 并发操作：
1. **同时打开 3 个串口**:
   - `/dev/ttyUSB0` - PLC 通信（9600）
   - `/dev/ttyUSB1` - 仪表监控（19200）
   - `/dev/ttyUSB2` - 4G 模块（115200）
2. **独立操作**: 每个串口独立配置、发送、接收
3. **互不干扰**: 缓冲区独立，数据不会混淆

---

## 🔧 WSL2 环境配置（生产环境）

如果你在 WSL2 中运行，需要配置 USB 设备共享：

### Step 1: 安装 usbipd（Windows）

```powershell
# PowerShell（管理员）
winget install --interactive --exact dorssel.usbipd-win
```

### Step 2: 安装 USB/IP 工具（WSL2）

```bash
sudo apt update
sudo apt install linux-tools-generic hwdata -y
sudo update-alternatives --install /usr/local/bin/usbip usbip \
  $(find /usr/lib/linux-tools -name usbip | tail -n1) 20
```

### Step 3: 共享 USB 串口设备

```powershell
# PowerShell（管理员）

# 1. 查看所有 USB 设备
usbipd list

# 输出示例：
# BUSID  VID:PID    DEVICE                          STATE
# 1-1    1a86:7523  USB-SERIAL CH340                Not shared
# 2-3    10c4:ea60  Silicon Labs CP210x USB to...   Not shared

# 2. 绑定设备（只需绑定一次）
usbipd bind --busid 1-1

# 3. 附加到 WSL2（每次重启后需要重新附加）
usbipd attach --wsl --busid 1-1
```

### Step 4: WSL2 验证

```bash
# 查看串口设备
ls -la /dev/ttyUSB*

# 输出示例：
# crw-rw---- 1 root dialout 188, 0 Nov 12 10:00 /dev/ttyUSB0

# 添加当前用户到 dialout 组（避免权限问题）
sudo usermod -a -G dialout $USER

# 重新登录或使用 newgrp 生效
newgrp dialout
```

### Step 5: 测试串口

```bash
# 安装测试工具
sudo apt install minicom -y

# 测试串口（波特率 9600）
minicom -D /dev/ttyUSB0 -b 9600

# Ctrl+A Z 查看帮助
# Ctrl+A X 退出
```

---

## 🎯 生产环境最佳实践

### 1. 权限管理

```bash
# 添加用户到 dialout 组（永久生效）
sudo usermod -a -G dialout $USER

# 临时赋予权限（不推荐）
sudo chmod 666 /dev/ttyUSB0
```

### 2. 串口独占性

⚠️ **串口是独占资源**，同一时间只能被一个程序打开！

如果提示 `Device or resource busy`，检查：
```bash
# 查看哪个程序占用了串口
sudo lsof /dev/ttyUSB0

# 或
sudo fuser /dev/ttyUSB0

# 终止占用进程
sudo kill -9 <PID>
```

### 3. 设备稳定性

- **避免热插拔**: 先关闭串口，再拔插设备
- **检测设备**: 拔插后串口号可能变化
- **使用 udev 规则**: 固定串口号

#### 固定串口号（udev 规则）

```bash
# 查看设备信息
udevadm info -a -n /dev/ttyUSB0 | grep ATTRS{serial}

# 创建 udev 规则
sudo nano /etc/udev/rules.d/99-usb-serial.rules

# 添加规则（根据序列号固定设备名）
SUBSYSTEM=="tty", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", ATTRS{serial}=="12345", SYMLINK+="ttyPLC"

# 重新加载规则
sudo udevadm control --reload-rules
sudo udevadm trigger

# 现在设备会固定为 /dev/ttyPLC
```

### 4. 多串口管理

对于多设备系统，建议命名规则：
```
/dev/ttyPLC     - PLC 通信
/dev/ttyMETER   - 仪表数据采集
/dev/ttyGPS     - GPS 定位
/dev/tty4G      - 4G 通信模块
```

---

## 🧪 常见协议示例

### Modbus RTU 读取命令

```hex
# 读取保持寄存器（功能码 03）
01 03 00 00 00 02 C4 0B
│  │  │     │     └─ CRC16（自动计算）
│  │  │     └─ 数量（2个寄存器）
│  │  └─ 起始地址（0x0000）
│  └─ 功能码（03 读取）
└─ 设备地址（01）

# 响应：
01 03 04 00 64 00 C8 XX XX
│  │  │  │     │     └─ CRC16
│  │  │  │     └─ 寄存器1的值（200）
│  │  │  └─ 寄存器0的值（100）
│  │  └─ 字节数（4字节）
│  └─ 功能码（03）
└─ 设备地址（01）
```

### GPS NMEA-0183 协议

```
# 发送查询命令（ASCII）
$PMTK314,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0*28

# 接收 GPRMC 数据（ASCII）
$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
```

### AT 命令（4G 模块）

```
# 发送（ASCII + CRLF）
AT\r\n

# 响应
OK\r\n

# 拨号
ATD10086;\r\n
```

---

## 📊 性能指标

| 指标 | 规格 | 说明 |
|-----|------|-----|
| **同时打开串口数** | 最多 10 个 | 受系统资源限制 |
| **接收轮询频率** | 500ms | 每 0.5 秒检查一次新数据 |
| **缓冲区大小** | 无限制 | 仅受内存限制 |
| **最大波特率** | 1000000 | 1Mbps（受硬件限制） |
| **数据格式** | HEX/ASCII/UTF-8 | 三种格式支持 |
| **权限控制** | Developer + Operator | 生产环境安全 |

---

## 🔐 安全建议

### 1. 权限最小化

- ✅ 只给需要的用户分配 Developer 或 Operator 角色
- ✅ 定期审查审计日志（所有串口操作都会记录）
- ✅ 使用 dialout 组而不是 sudo

### 2. 数据保护

- ⚠️ 串口数据可能包含敏感信息（密码、密钥等）
- ⚠️ 接收缓冲区保存在内存中，应定期清空
- ⚠️ 不要在生产环境中长期打开串口监听

### 3. 设备保护

- ⚠️ 错误的命令可能损坏设备
- ⚠️ 发送数据前确认格式和内容
- ⚠️ 注意电气隔离和防雷保护

---

## 🐛 常见问题

### Q1: 没有检测到串口设备

**解决方案**：
```bash
# 检查设备是否连接
lsusb              # 查看 USB 设备
dmesg | grep tty   # 查看内核日志

# 检查驱动是否加载
lsmod | grep usbserial

# 手动加载驱动（如果需要）
sudo modprobe usbserial
sudo modprobe cp210x   # CP210x 芯片
sudo modprobe ch341    # CH340/CH341 芯片
sudo modprobe ftdi_sio # FTDI 芯片
```

### Q2: 权限不足 (Permission denied)

**解决方案**：
```bash
# 方法1: 添加用户到 dialout 组（推荐）
sudo usermod -a -G dialout $USER
# 需要重新登录生效

# 方法2: 临时修改权限（不推荐）
sudo chmod 666 /dev/ttyUSB0

# 方法3: 使用 sudo 运行后端（不推荐）
sudo python run.py
```

### Q3: 设备占用 (Device busy)

**解决方案**：
```bash
# 查找占用进程
sudo lsof /dev/ttyUSB0
# 或
sudo fuser /dev/ttyUSB0

# 终止进程
sudo kill -9 <PID>

# 常见占用程序：
# - ModemManager: 自动检测 4G 模块
# - brltty: 盲文设备支持
```

**永久禁用 ModemManager**（如果不需要）：
```bash
sudo systemctl stop ModemManager
sudo systemctl disable ModemManager
```

### Q4: 串口号变化

**问题**: 拔插后 `/dev/ttyUSB0` 变成 `/dev/ttyUSB1`

**解决方案**: 使用 udev 规则固定设备名（见上文）

### Q5: WSL2 无法访问串口

**解决方案**: 使用 usbipd 共享（见上文）或在 Windows 原生运行后端

---

## 🎓 进阶用法

### 1. 批量操作多个串口

```python
# 例如：同时监控 3 个 PLC
ports = [
    {'port': '/dev/ttyUSB0', 'baudrate': 9600},   # PLC1
    {'port': '/dev/ttyUSB1', 'baudrate': 19200},  # PLC2
    {'port': '/dev/ttyUSB2', 'baudrate': 9600},   # PLC3
]

# 依次打开，前端会显示 3 个独立卡片
```

### 2. 自动化测试脚本

可以使用前端 API 编写自动化测试：

```typescript
// 自动化测试示例
async function testSerialDevice() {
  // 1. 打开串口
  await openSerialPort({
    port: '/dev/ttyUSB0',
    baudrate: 9600,
    bytesize: 8,
    parity: 'N',
    stopbits: 1.0,
    timeout: 1.0
  })
  
  // 2. 发送测试命令
  await sendSerialData({
    port: '/dev/ttyUSB0',
    data: '01 03 00 00 00 02 C4 0B',
    data_type: 'hex'
  })
  
  // 3. 等待响应
  await sleep(1000)
  
  // 4. 读取缓冲区
  const buffer = await getSerialBuffer({
    port: '/dev/ttyUSB0',
    clear: false
  })
  
  console.log('接收到数据:', buffer.data)
  
  // 5. 关闭串口
  await closeSerialPort({ port: '/dev/ttyUSB0' })
}
```

### 3. 数据导出

将接收的数据导出为日志文件：

```typescript
// 导出接收数据
const exportData = (port: string) => {
  const state = openedPorts.get(port)
  if (!state) return
  
  const lines = state.receiveBuffer.map(item => 
    `${item.timestamp} | HEX: ${item.data} | ASCII: ${hexToAscii(item.data)}`
  )
  
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `serial_${port.replace('/', '_')}_${Date.now()}.log`
  link.click()
}
```

---

## 📝 部署建议

### Docker 部署（需要设备映射）

```dockerfile
# Dockerfile
FROM python:3.12-slim

# 安装依赖
RUN pip install pyserial

# 运行
CMD ["python", "run.py"]
```

```yaml
# docker-compose.yml
services:
  backend:
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0  # 映射串口设备
      - /dev/ttyUSB1:/dev/ttyUSB1
    privileged: true  # 或使用 cap_add: - SYS_RAWIO
```

### Systemd 服务（生产环境）

```ini
# /etc/systemd/system/lccu-backend.service
[Unit]
Description=LCCU Backend Service
After=network.target

[Service]
Type=simple
User=lccu
Group=dialout
WorkingDirectory=/opt/lccu-v/backend
ExecStart=/opt/lccu-v/.venv/bin/python run.py
Restart=always

# 串口设备权限
SupplementaryGroups=dialout

[Install]
WantedBy=multi-user.target
```

---

## ✅ 生产就绪检查清单

部署到生产环境前，确认：

- [ ] USB 转串口驱动已安装
- [ ] 用户已添加到 dialout 组
- [ ] udev 规则已配置（固定设备名）
- [ ] 串口设备权限正确（660 或 666）
- [ ] ModemManager 已禁用（如果干扰）
- [ ] WSL2 已配置 usbipd（如果使用 WSL2）
- [ ] 审计日志已启用（自动）
- [ ] 只有授权用户可访问（Developer + Operator）
- [ ] 设备连接稳定（电源、接线）
- [ ] 防雷保护措施（工业环境）

---

## 📞 技术支持

### 常用命令速查

```bash
# 查看串口设备
ls -la /dev/tty{S,USB,ACM}*

# 查看 USB 设备
lsusb -v

# 查看内核日志
dmesg | tail -20

# 测试串口通信
echo "test" > /dev/ttyUSB0
cat /dev/ttyUSB0

# 查看波特率
stty -F /dev/ttyUSB0

# 设置波特率
stty -F /dev/ttyUSB0 9600
```

---

**重要提示**：
- 🔴 本工具仅用于**开发、测试、维护**场景
- 🔴 **不要**在生产环境长期运行
- 🔴 **不要**通过互联网暴露串口接口
- 🔴 操作工业设备前，**务必确认命令正确性**

---

*最后更新: 2025-11-12*
*适用版本: v1.0.0*

