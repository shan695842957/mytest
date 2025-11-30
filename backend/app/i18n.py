"""
国际化 (i18n) 支持
使用 Babel 管理多语言翻译
"""

import json
from pathlib import Path
from typing import Dict, Optional
from functools import lru_cache

from app.config import settings


class I18n:
    """国际化管理器"""
    
    def __init__(self):
        self.locales_dir = Path(__file__).parent / "locales"
        self.default_locale = settings.default_locale
        self._translations: Dict[str, Dict[str, str]] = {}
        self._load_translations()
    
    def _load_translations(self) -> None:
        """加载所有语言的翻译文件"""
        if not self.locales_dir.exists():
            self.locales_dir.mkdir(parents=True, exist_ok=True)
            return
        
        for locale in settings.supported_locales:
            locale_file = self.locales_dir / f"{locale}.json"
            if locale_file.exists():
                with open(locale_file, "r", encoding="utf-8") as f:
                    self._translations[locale] = json.load(f)
            else:
                self._translations[locale] = {}
    
    def translate(self, key: str, locale: Optional[str] = None) -> str:
        """
        翻译文本
        
        Args:
            key: 翻译键
            locale: 目标语言（默认使用配置的默认语言）
        
        Returns:
            翻译后的文本，如果找不到则返回键本身
        """
        locale = locale or self.default_locale
        translations = self._translations.get(locale, {})
        return translations.get(key, key)
    
    def t(self, key: str, locale: Optional[str] = None) -> str:
        """translate 的简写形式"""
        return self.translate(key, locale)


# 全局 i18n 实例
@lru_cache()
def get_i18n() -> I18n:
    """获取 i18n 实例（单例）"""
    return I18n()


# 便捷函数
def t(key: str, locale: Optional[str] = None) -> str:
    """全局翻译函数"""
    return get_i18n().translate(key, locale)

