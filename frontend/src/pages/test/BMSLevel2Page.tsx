/**
 * BMS 二级架构展示页面
 * 电池簇 → 电池包 → 电池单体
 * 
 * Tab页：
 * - SYS: 系统监控（簇基本信息、断路器控制、包拓扑）
 * - BCU: 簇控制单元（簇详细信息、遥测遥信数据）
 * - BMU: 包管理单元（包内单体信息、温度测点）
 * - EVT: 事件记录（系统遥控信息）
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function BMSLevel2Page() {
  const { t } = useTranslation('testPanel')
  const [activeTab, setActiveTab] = useState('sys')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('bms_level2_title', 'BMS 二级架构')}</CardTitle>
          <CardDescription>
            {t('bms_level2_description', '电池簇 → 电池包 → 电池单体结构')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sys">
                {t('bms_tab_sys', 'SYS')}
              </TabsTrigger>
              <TabsTrigger value="bcu">
                {t('bms_tab_bcu', 'BCU')}
              </TabsTrigger>
              <TabsTrigger value="bmu">
                {t('bms_tab_bmu', 'BMU')}
              </TabsTrigger>
              <TabsTrigger value="evt">
                {t('bms_tab_evt', 'EVT')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sys" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_sys_title', '系统监控')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms_sys_placeholder', 'SYS 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bcu" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_bcu_title', '簇控制单元')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms_bcu_placeholder', 'BCU 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bmu" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_bmu_title', '包管理单元')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms_bmu_placeholder', 'BMU 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="evt" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_evt_title', '事件记录')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms_evt_placeholder', 'EVT 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
