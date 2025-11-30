"""
串口测试工具 API
提供串口列表查询、打开/关闭、数据发送/接收功能
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
import serial
import serial.tools.list_ports
from datetime import datetime
import asyncio
from collections import defaultdict
import binascii

from app.api.deps import get_current_user, get_locale, get_request_id
from app.schemas.response import ApiResponse, success_response, error_response
from app.models.user import User
from app.core.permissions import check_role_permission, UserRole
from app.i18n import t

router = APIRouter(tags=["串口工具"])

# 全局串口管理器
class SerialPortManager:
    """串口管理器 - 管理多个串口连接"""
    
    def __init__(self):
        self.ports: dict[str, serial.Serial] = {}  # port_name -> Serial对象
        self.receive_buffers: dict[str, list] = defaultdict(list)  # port_name -> 接收缓冲区
        self.is_listening: dict[str, bool] = {}  # port_name -> 是否正在监听
        self.port_metadata: dict[str, dict] = {}  # port_name -> 元数据（打开时间、配置等）
    
    def open_port(self, port_name: str, baudrate: int, bytesize: int, 
                  parity: str, stopbits: float, timeout: float) -> serial.Serial:
        """打开串口"""
        if port_name in self.ports:
            raise ValueError(f"端口 {port_name} 已经打开")
        
        try:
            ser = serial.Serial(
                port=port_name,
                baudrate=baudrate,
                bytesize=bytesize,
                parity=parity,
                stopbits=stopbits,
                timeout=timeout
            )
            self.ports[port_name] = ser
            self.is_listening[port_name] = True
            
            # 保存元数据
            self.port_metadata[port_name] = {
                'opened_at': datetime.now(),
                'baudrate': baudrate,
                'bytesize': bytesize,
                'parity': parity,
                'stopbits': stopbits,
                'timeout': timeout,
                'total_received': 0,
                'total_sent': 0,
            }
            
            return ser
        except serial.SerialException as e:
            error_msg = str(e)
            # 给出更友好的错误提示
            if 'Permission denied' in error_msg:
                raise ValueError(f"权限不足：请添加当前用户到 dialout 组或使用 sudo 运行")
            elif 'No such file' in error_msg or 'does not exist' in error_msg:
                raise ValueError(f"设备不存在：{port_name} 未找到或已断开连接")
            elif 'Device or resource busy' in error_msg:
                raise ValueError(f"设备占用：{port_name} 已被其他程序打开")
            else:
                raise ValueError(f"打开串口失败: {error_msg}")
    
    def close_port(self, port_name: str):
        """关闭串口"""
        if port_name in self.ports:
            self.is_listening[port_name] = False
            self.ports[port_name].close()
            del self.ports[port_name]
            if port_name in self.receive_buffers:
                del self.receive_buffers[port_name]
            if port_name in self.port_metadata:
                del self.port_metadata[port_name]
    
    def send_data(self, port_name: str, data: bytes) -> int:
        """发送数据"""
        if port_name not in self.ports:
            raise ValueError(f"端口 {port_name} 未打开")
        bytes_sent = self.ports[port_name].write(data)
        # 更新发送统计
        if port_name in self.port_metadata:
            self.port_metadata[port_name]['total_sent'] += 1
        return bytes_sent
    
    def receive_data(self, port_name: str, size: int = 1024) -> bytes:
        """接收数据"""
        if port_name not in self.ports:
            raise ValueError(f"端口 {port_name} 未打开")
        return self.ports[port_name].read(size)
    
    def get_buffer(self, port_name: str) -> list:
        """获取接收缓冲区"""
        return self.receive_buffers.get(port_name, [])
    
    def clear_buffer(self, port_name: str):
        """清空接收缓冲区"""
        if port_name in self.receive_buffers:
            self.receive_buffers[port_name].clear()
    
    async def listen_port(self, port_name: str):
        """后台监听串口数据"""
        while self.is_listening.get(port_name, False) and port_name in self.ports:
            try:
                if self.ports[port_name].in_waiting > 0:
                    data = self.ports[port_name].read(self.ports[port_name].in_waiting)
                    if data:
                        self.receive_buffers[port_name].append({
                            'timestamp': datetime.now().isoformat(),
                            'data': data.hex(),
                            'length': len(data)
                        })
                        # 更新接收统计
                        if port_name in self.port_metadata:
                            self.port_metadata[port_name]['total_received'] += 1
                await asyncio.sleep(0.1)  # 100ms轮询一次
            except Exception as e:
                print(f"监听串口 {port_name} 出错: {e}")
                break

# 全局串口管理器实例
serial_manager = SerialPortManager()


# ==================== Pydantic 模型 ====================

class SerialPortInfo(BaseModel):
    """串口信息"""
    port: str = Field(..., description="串口设备名")
    description: str = Field(..., description="串口描述")
    hwid: str = Field(..., description="硬件ID")
    vid: Optional[int] = Field(None, description="厂商ID")
    pid: Optional[int] = Field(None, description="产品ID")
    serial_number: Optional[str] = Field(None, description="序列号")
    location: Optional[str] = Field(None, description="位置")
    manufacturer: Optional[str] = Field(None, description="制造商")
    product: Optional[str] = Field(None, description="产品名称")
    is_opened: bool = Field(False, description="是否已打开")


class OpenSerialRequest(BaseModel):
    """打开串口请求"""
    port: str = Field(..., description="串口设备名")
    baudrate: int = Field(9600, description="波特率")
    bytesize: int = Field(8, description="数据位", ge=5, le=8)
    parity: str = Field("N", description="校验位", pattern="^[NEMS]$")
    stopbits: float = Field(1.0, description="停止位")
    timeout: float = Field(1.0, description="超时时间（秒）", ge=0.1, le=10.0)


class CloseSerialRequest(BaseModel):
    """关闭串口请求"""
    port: str = Field(..., description="串口设备名")


class SendDataRequest(BaseModel):
    """发送数据请求"""
    port: str = Field(..., description="串口设备名")
    data: str = Field(..., description="要发送的数据")
    data_type: str = Field("hex", description="数据类型", pattern="^(hex|ascii|utf8)$")


class GetBufferRequest(BaseModel):
    """获取缓冲区请求"""
    port: str = Field(..., description="串口设备名")
    clear: bool = Field(False, description="是否清空缓冲区")


# ==================== API 端点 ====================

@router.get(
    "/list",
    response_model=ApiResponse[list[SerialPortInfo]],
    summary="获取串口列表",
    description="查询系统所有可用串口设备"
)
async def list_serial_ports(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[list[SerialPortInfo]]:
    """获取串口列表"""
    
    # 权限检查：只有开发者和运维可以使用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("serial.error.permissionDenied", locale)
    )
    
    try:
        # 获取系统所有串口设备
        ports = serial.tools.list_ports.comports()
        result = []
        
        for port in ports:
            result.append(SerialPortInfo(
                port=port.device,
                description=port.description,
                hwid=port.hwid,
                vid=port.vid,
                pid=port.pid,
                serial_number=port.serial_number,
                location=port.location,
                manufacturer=port.manufacturer,
                product=port.product,
                is_opened=port.device in serial_manager.ports
            ))
        
        return success_response(
            data=result,
            message=t("serial.success.listRetrieved", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        return success_response(
            data=[],
            message=f"{t('serial.error.listFailed', locale)}: {str(e)}",
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.post(
    "/open",
    response_model=ApiResponse[dict],
    summary="打开串口",
    description="打开指定串口并开始监听数据"
)
async def open_serial_port(
    request: OpenSerialRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """打开串口"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("serial.error.permissionDenied", locale)
    )
    
    try:
        # 打开串口
        ser = serial_manager.open_port(
            port_name=request.port,
            baudrate=request.baudrate,
            bytesize=request.bytesize,
            parity=request.parity,
            stopbits=request.stopbits,
            timeout=request.timeout
        )
        
        # 启动后台监听任务
        background_tasks.add_task(serial_manager.listen_port, request.port)
        
        return success_response(
            data={
                "port": request.port,
                "baudrate": request.baudrate,
                "bytesize": request.bytesize,
                "parity": request.parity,
                "stopbits": request.stopbits,
                "is_open": ser.is_open,
                "opened_at": datetime.now().isoformat()
            },
            message=f"{t('serial.success.opened', locale)}: {request.port}",
            locale=locale,
            request_id=request_id
        )
    except ValueError as e:
        # 业务错误（如端口已打开）
        return success_response(
            data=None,
            message=f"{t('serial.error.openFailed', locale)}: {str(e)}",
            code=400,
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        # 系统错误（如串口不支持、权限不足等）
        error_msg = str(e)
        return success_response(
            data=None,
            message=f"{t('serial.error.openFailed', locale)}: {error_msg}",
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.post(
    "/close",
    response_model=ApiResponse[None],
    summary="关闭串口",
    description="关闭指定串口并停止监听"
)
async def close_serial_port(
    request: CloseSerialRequest,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """关闭串口"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("serial.error.permissionDenied", locale)
    )
    
    try:
        # 关闭串口
        serial_manager.close_port(request.port)
        
        return success_response(
            data=None,
            message=f"{t('serial.success.closed', locale)}: {request.port}",
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        return success_response(
            data=None,
            message=f"{t('serial.error.closeFailed', locale)}: {str(e)}",
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.post(
    "/send",
    response_model=ApiResponse[dict],
    summary="发送数据",
    description="向指定串口发送数据（支持HEX、ASCII、UTF-8格式）"
)
async def send_serial_data(
    request: SendDataRequest,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """发送数据"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("serial.error.permissionDenied", locale)
    )
    
    try:
        # 根据数据类型转换数据
        if request.data_type == "hex":
            # HEX格式：去除空格后转换
            data_bytes = binascii.unhexlify(request.data.replace(" ", "").replace("0x", ""))
        elif request.data_type == "ascii":
            # ASCII格式
            data_bytes = request.data.encode('ascii')
        elif request.data_type == "utf8":
            # UTF-8格式
            data_bytes = request.data.encode('utf-8')
        else:
            raise ValueError(f"不支持的数据类型: {request.data_type}")
        
        # 发送数据
        bytes_sent = serial_manager.send_data(request.port, data_bytes)
        
        return success_response(
            data={
                "port": request.port,
                "bytes_sent": bytes_sent,
                "data_hex": data_bytes.hex(),
                "sent_at": datetime.now().isoformat()
            },
            message=f"{t('serial.success.sent', locale)} ({bytes_sent} bytes)",
            locale=locale,
            request_id=request_id
        )
    except ValueError as e:
        return success_response(
            data=None,
            message=f"{t('serial.error.sendFailed', locale)}: {str(e)}",
            code=400,
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        return success_response(
            data=None,
            message=f"{t('serial.error.sendFailed', locale)}: {str(e)}",
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.post(
    "/buffer",
    response_model=ApiResponse[list],
    summary="获取接收缓冲区",
    description="获取指定串口的接收数据缓冲区"
)
async def get_serial_buffer(
    request: GetBufferRequest,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[list]:
    """获取接收缓冲区"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("serial.error.permissionDenied", locale)
    )
    
    try:
        buffer = serial_manager.get_buffer(request.port)
        
        # 如果需要清空缓冲区
        if request.clear:
            serial_manager.clear_buffer(request.port)
        
        return success_response(
            data=buffer,
            message=t("serial.success.bufferRetrieved", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        return success_response(
            data=[],
            message=f"{t('serial.error.bufferFailed', locale)}: {str(e)}",
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.get(
    "/status",
    response_model=ApiResponse[list[dict]],
    summary="获取已打开串口状态",
    description="获取所有已打开串口的状态信息"
)
async def get_serial_status(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[list[dict]]:
    """
    获取已打开串口状态（从内存读取）
    
    返回所有当前打开的串口，包括：
    - 串口配置参数
    - 打开时间
    - 运行时长
    - 收发统计
    - 缓冲区大小
    """
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("serial.error.permissionDenied", locale)
    )
    
    try:
        result = []
        for port_name, ser in serial_manager.ports.items():
            metadata = serial_manager.port_metadata.get(port_name, {})
            opened_at = metadata.get('opened_at', datetime.now())
            
            # 计算运行时长（秒）
            uptime = int((datetime.now() - opened_at).total_seconds())
            
            result.append({
                "port": port_name,
                "is_open": ser.is_open,
                "baudrate": metadata.get('baudrate', ser.baudrate),
                "bytesize": metadata.get('bytesize', ser.bytesize),
                "parity": metadata.get('parity', ser.parity),
                "stopbits": metadata.get('stopbits', ser.stopbits),
                "timeout": metadata.get('timeout', ser.timeout),
                "opened_at": opened_at.isoformat(),
                "uptime": uptime,
                "in_waiting": ser.in_waiting,
                "buffer_size": len(serial_manager.receive_buffers.get(port_name, [])),
                "total_received": metadata.get('total_received', 0),
                "total_sent": metadata.get('total_sent', 0),
            })
        
        return success_response(
            data=result,
            message=t("serial.success.statusRetrieved", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        return success_response(
            data=[],
            message=f"{t('serial.error.statusFailed', locale)}: {str(e)}",
            code=500,
            locale=locale,
            request_id=request_id
        )

