"""
初始化BMS系统默认数据
包括：架构类型、页面配置
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.database import AsyncSessionLocal
from app.models.bms import BMSArchitecture, BMSPageConfig


async def init_bms_data():
    """初始化BMS系统默认数据"""
    async with AsyncSessionLocal() as db:
        try:
            # 检查是否已有架构数据
            result = await db.execute(select(BMSArchitecture))
            existing_architectures = result.scalars().all()
            
            if len(existing_architectures) > 0:
                print("✅ BMS架构数据已存在，跳过初始化")
                return
            
            # 创建二级架构
            level2 = BMSArchitecture(
                name='level2',
                display_name_zh='二级架构',
                display_name_en='Level 2 Architecture',
                description_zh='电池簇 → 电池包 → 电池单体',
                description_en='Battery Cluster → Battery Pack → Battery Cell'
            )
            db.add(level2)
            await db.flush()  # 获取ID
            
            # 创建三级架构
            level3 = BMSArchitecture(
                name='level3',
                display_name_zh='三级架构',
                display_name_en='Level 3 Architecture',
                description_zh='电池堆 → 电池簇 → 电池包 → 电池单体',
                description_en='Battery Stack → Battery Cluster → Battery Pack → Battery Cell'
            )
            db.add(level3)
            await db.flush()  # 获取ID
            
            # 创建二级架构的页面配置
            level2_pages = [
                BMSPageConfig(
                    architecture_id=level2.id,
                    page_type='SYS',
                    display_name_zh='系统监控',
                    display_name_en='System Monitoring',
                    description_zh='系统监控页面',
                    description_en='System Monitoring Page'
                ),
                BMSPageConfig(
                    architecture_id=level2.id,
                    page_type='BCU',
                    display_name_zh='簇控制单元',
                    display_name_en='Cluster Control Unit',
                    description_zh='簇控制单元页面',
                    description_en='Cluster Control Unit Page'
                ),
                BMSPageConfig(
                    architecture_id=level2.id,
                    page_type='BMU',
                    display_name_zh='包管理单元',
                    display_name_en='Pack Management Unit',
                    description_zh='包管理单元页面',
                    description_en='Pack Management Unit Page'
                ),
            ]
            
            # 创建三级架构的页面配置
            level3_pages = [
                BMSPageConfig(
                    architecture_id=level3.id,
                    page_type='SYS',
                    display_name_zh='系统监控',
                    display_name_en='System Monitoring',
                    description_zh='系统监控页面',
                    description_en='System Monitoring Page'
                ),
                BMSPageConfig(
                    architecture_id=level3.id,
                    page_type='BAU',
                    display_name_zh='堆控制单元',
                    display_name_en='Stack Control Unit',
                    description_zh='堆控制单元页面',
                    description_en='Stack Control Unit Page'
                ),
                BMSPageConfig(
                    architecture_id=level3.id,
                    page_type='BCU',
                    display_name_zh='簇控制单元',
                    display_name_en='Cluster Control Unit',
                    description_zh='簇控制单元页面',
                    description_en='Cluster Control Unit Page'
                ),
                BMSPageConfig(
                    architecture_id=level3.id,
                    page_type='BMU',
                    display_name_zh='包管理单元',
                    display_name_en='Pack Management Unit',
                    description_zh='包管理单元页面',
                    description_en='Pack Management Unit Page'
                ),
            ]
            
            for page in level2_pages + level3_pages:
                db.add(page)
            
            await db.commit()
            print("✅ BMS架构和页面配置初始化完成")
            print(f"   - 二级架构（ID: {level2.id}）")
            print(f"   - 三级架构（ID: {level3.id}）")
            print(f"   - 页面配置：{len(level2_pages + level3_pages)} 个")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ BMS数据初始化失败: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(init_bms_data())
