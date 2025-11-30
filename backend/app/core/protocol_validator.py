"""
协议配置参数验证器
根据协议类型的参数定义验证 protocol_config
"""

from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.protocol_type import ProtocolType
from app.crud.protocol_type import protocol_type_crud
import json
import re


class ProtocolConfigValidator:
    """协议配置参数验证器"""
    
    @staticmethod
    async def validate_config(
        db: AsyncSession,
        protocol_type_name: str,
        protocol_config: Dict[str, Any]
    ) -> tuple[bool, Optional[str]]:
        """
        验证协议配置参数
        
        Args:
            db: 数据库会话
            protocol_type_name: 协议类型名称
            protocol_config: 协议配置字典
        
        Returns:
            (是否有效, 错误信息)
        """
        # 获取协议类型定义
        protocol_type = await protocol_type_crud.get_by_name(db, protocol_type_name, include_params=True)
        if not protocol_type:
            return False, f"协议类型 '{protocol_type_name}' 不存在"
        
        if not protocol_type.enabled:
            return False, f"协议类型 '{protocol_type_name}' 已禁用"
        
        # 获取参数定义
        params = protocol_type.params
        
        # 检查必填参数
        required_params = {p.param_name for p in params if p.required}
        provided_params = set(protocol_config.keys())
        missing_params = required_params - provided_params
        if missing_params:
            return False, f"缺少必填参数: {', '.join(missing_params)}"
        
        # 检查未知参数（不允许随意添加参数）
        defined_param_names = {p.param_name for p in params}
        unknown_params = provided_params - defined_param_names
        if unknown_params:
            return False, f"未知参数: {', '.join(unknown_params)}。只允许使用已定义的参数"
        
        # 验证每个参数
        for param_def in params:
            param_name = param_def.param_name
            if param_name not in protocol_config:
                continue  # 可选参数可以不存在
            
            value = protocol_config[param_name]
            error = ProtocolConfigValidator._validate_param_value(param_def, value)
            if error:
                return False, f"参数 '{param_def.display_name}' ({param_name}): {error}"
        
        return True, None
    
    @staticmethod
    def _validate_param_value(param_def, value: Any) -> Optional[str]:
        """验证单个参数值"""
        # 解析约束
        try:
            constraints = json.loads(param_def.constraints_json) if isinstance(param_def.constraints_json, str) else param_def.constraints_json
        except:
            constraints = {}
        
        # 类型检查
        if param_def.data_type == "string":
            if not isinstance(value, str):
                return f"必须是字符串类型，当前类型: {type(value).__name__}"
        elif param_def.data_type == "integer":
            if not isinstance(value, int):
                # 尝试转换
                try:
                    int(value)
                except:
                    return f"必须是整数类型，当前类型: {type(value).__name__}"
            else:
                # 检查范围
                if "min" in constraints and value < constraints["min"]:
                    return f"值 {value} 小于最小值 {constraints['min']}"
                if "max" in constraints and value > constraints["max"]:
                    return f"值 {value} 大于最大值 {constraints['max']}"
        elif param_def.data_type == "float":
            if not isinstance(value, (int, float)):
                try:
                    float(value)
                except:
                    return f"必须是浮点数类型，当前类型: {type(value).__name__}"
        elif param_def.data_type == "boolean":
            if not isinstance(value, bool):
                return f"必须是布尔类型，当前类型: {type(value).__name__}"
        elif param_def.data_type == "enum":
            enum_values = constraints.get("enum", [])
            if enum_values and value not in enum_values:
                return f"值 '{value}' 不在允许的枚举值中: {enum_values}"
        
        # 正则表达式验证
        if "pattern" in constraints:
            pattern = constraints["pattern"]
            if isinstance(value, str) and not re.match(pattern, value):
                return f"值 '{value}' 不符合格式要求（正则: {pattern}）"
        
        return None
    
    @staticmethod
    async def get_protocol_type_params(
        db: AsyncSession,
        protocol_type_name: str
    ) -> Optional[List[Dict[str, Any]]]:
        """
        获取协议类型的参数定义（用于前端表单生成）
        
        Returns:
            参数定义列表，格式：[
                {
                    "param_name": "ip",
                    "display_name": "IP地址",
                    "data_type": "string",
                    "required": True,
                    "default_value": "",
                    "placeholder": "例如：192.168.1.100",
                    "constraints": {...}
                },
                ...
            ]
        """
        protocol_type = await protocol_type_crud.get_by_name(db, protocol_type_name, include_params=True)
        if not protocol_type:
            return None
        
        result = []
        for param in sorted(protocol_type.params, key=lambda x: (x.order_index, x.id)):
            constraints = {}
            if param.constraints_json:
                try:
                    constraints = json.loads(param.constraints_json) if isinstance(param.constraints_json, str) else param.constraints_json
                except:
                    pass
            
            result.append({
                "param_name": param.param_name,
                "display_name": param.display_name,
                "data_type": param.data_type,
                "required": param.required,
                "default_value": param.default_value,
                "placeholder": param.placeholder or "",
                "description": param.description,
                "input_type": param.input_type or "text",
                "peripheral_type": param.peripheral_type,
                "constraints": constraints
            })
        
        return result

