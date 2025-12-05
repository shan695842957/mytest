/**
 * BMS 储能系统可视化组件 - 新版本
 * 
 * 设计特点：
 * 1. 拓扑图 + 数据面板，清晰展示业务逻辑
 * 2. 支持动态字段（不同厂家）
 * 3. 局部滚动，避免整屏滚动
 * 4. 实时数据更新接口
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type {
  BatteryStack,
  BatteryClusterLevel2,
  DataField,
  BreakerStatus,
} from '@/types/bms-new';

// ========== 共享组件 ==========

/**
 * 渲染动态字段数组
 */
const FieldsDisplay: React.FC<{ fields: DataField[]; size?: 'small' | 'large' }> = ({ 
  fields, 
  size = 'small' 
}) => {
  if (!fields || fields.length === 0) return null;
  
  const textSize = size === 'large' ? 'text-xl font-bold' : 'text-sm font-semibold';
  const labelSize = size === 'large' ? 'text-sm' : 'text-xs';
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {fields.map((field, idx) => (
        <div key={idx} className="flex flex-col">
          <span className={`${labelSize} text-muted-foreground mb-1`}>{field.name}</span>
          <span className={`${textSize} text-foreground`}>
            {typeof field.value === 'number' 
              ? field.value.toFixed(2) 
              : typeof field.value === 'boolean'
              ? field.value ? '是' : '否'
              : field.value}
            {field.unit && <span className="ml-1 text-sm text-muted-foreground">{field.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * 渲染断路器状态
 */
const BreakerStatusDisplay: React.FC<{ breaker: BreakerStatus; label?: string }> = ({ 
  breaker, 
  label = '断路器' 
}) => {
  if (breaker.closed !== undefined) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}:</span>
        {breaker.closed ? (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            合闸
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            分闸
          </Badge>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">正极:</span>
        {breaker.positiveClosed ? (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            合闸
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            分闸
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">负极:</span>
        {breaker.negativeClosed ? (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            合闸
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            分闸
          </Badge>
        )}
      </div>
    </div>
  );
};

/**
 * 电池单体显示组件（紧凑型）
 */
const CellDisplay: React.FC<{ cell: any; index: number; series: number; parallel: number }> = ({ 
  cell, 
  index,
  series,
  parallel
}) => {
  // 计算在串并联矩阵中的位置
  const seriesIndex = Math.floor(index / parallel);
  const parallelIndex = index % parallel;
  
  // 获取电压字段（通常第一个是电压）
  const voltageField = cell.fields.find((f: DataField) => 
    f.name.toLowerCase().includes('电压') || 
    f.name.toLowerCase().includes('voltage') ||
    f.name.toLowerCase().includes('v')
  );
  const voltage = voltageField ? (typeof voltageField.value === 'number' ? voltageField.value : 0) : 0;
  
  // 判断是否异常（电压范围 2.5V - 4.5V）
  const isAbnormal = voltage < 2.5 || voltage > 4.5;
  
  return (
    <div 
      className={`
        p-1.5 border rounded text-xs transition-colors
        ${isAbnormal ? 'bg-red-50 border-red-300' : 'bg-background hover:bg-muted'}
      `}
      title={`${cell.id}: ${cell.fields.map((f: DataField) => `${f.name}=${f.value}${f.unit || ''}`).join(', ')}`}
    >
      <div className="font-semibold text-[10px] mb-0.5">
        {seriesIndex + 1}-{parallelIndex + 1}
      </div>
      {voltageField && (
        <div className={`font-bold ${isAbnormal ? 'text-red-600' : 'text-foreground'}`}>
          {voltage.toFixed(2)}V
        </div>
      )}
    </div>
  );
};

/**
 * 电池包显示组件
 */
const PackDisplay: React.FC<{ 
  pack: any; 
  series: number; 
  parallel: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ pack, series, parallel, isExpanded, onToggle }) => {
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span>电池包 {pack.id}</span>
            {pack.fault && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                故障
              </Badge>
            )}
          </CardTitle>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* 包数据 */}
        {pack.fields && pack.fields.length > 0 && (
          <div className="mb-3">
            <FieldsDisplay fields={pack.fields} size="small" />
          </div>
        )}
        
        {/* 故障信息 */}
        {pack.faultMessage && (
          <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
            {pack.faultMessage}
          </div>
        )}
        
        {/* 单体显示（可展开/折叠） */}
        {isExpanded && (
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold mb-2 text-muted-foreground">
                电池单体 ({series}串{parallel}并)
              </div>
              <ScrollArea className="h-[200px] border rounded p-2 bg-muted/30">
                <div className="grid gap-1.5" style={{
                  gridTemplateColumns: `repeat(${parallel}, minmax(0, 1fr))`
                }}>
                  {pack.cells.map((cell: any, idx: number) => (
                    <CellDisplay 
                      key={cell.id || idx} 
                      cell={cell} 
                      index={idx}
                      series={series}
                      parallel={parallel}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* 温度测点 */}
            {pack.temperaturePoints && pack.temperaturePoints.length > 0 && (
              <div>
                <div className="text-sm font-semibold mb-2 text-muted-foreground">温度测点</div>
                <div className="flex flex-wrap gap-2">
                  {pack.temperaturePoints.map((tp: any, idx: number) => (
                    <Badge key={tp.id || idx} variant="outline" className="px-3 py-1">
                      <span className="text-xs">{tp.id}:</span>
                      <span className="ml-1 font-semibold">{tp.temperature.toFixed(1)}{tp.unit || '°C'}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ========== 三级架构组件 ==========

interface Level3BMSProps {
  data: BatteryStack;
  config: {
    packCountPerCluster: number;
    cellCountPerPack: number;
    temperaturePointCountPerPack: number;
    cellConfiguration?: { series: number; parallel: number };
  };
}

export const Level3BMS: React.FC<Level3BMSProps> = ({ data, config }) => {
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());
  
  const { cellConfiguration } = config;
  const series = cellConfiguration?.series || 1;
  const parallel = cellConfiguration?.parallel || config.cellCountPerPack;
  
  const togglePack = (packId: string) => {
    const newExpanded = new Set(expandedPacks);
    if (newExpanded.has(packId)) {
      newExpanded.delete(packId);
    } else {
      newExpanded.add(packId);
    }
    setExpandedPacks(newExpanded);
  };
  
  return (
    <div className="p-4 space-y-4">
      {/* 电池堆 - 总高压箱 */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-xl flex items-center justify-between">
            <span>电池堆 {data.id}</span>
            {data.mainHighVoltageBox.fault && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                故障
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold mb-3 text-muted-foreground">总高压箱</div>
              {data.mainHighVoltageBox.fields && data.mainHighVoltageBox.fields.length > 0 && (
                <div className="mb-3">
                  <FieldsDisplay fields={data.mainHighVoltageBox.fields} size="large" />
                </div>
              )}
              <div className="mb-3">
                <BreakerStatusDisplay breaker={data.mainHighVoltageBox.breaker} label="总断路器" />
              </div>
              {data.mainHighVoltageBox.faultMessage && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  {data.mainHighVoltageBox.faultMessage}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 电池簇（并联） */}
      <div>
        <div className="text-sm font-semibold mb-3 text-muted-foreground">
          电池簇（并联连接，共 {data.clusters.length} 簇）
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.clusters.map((cluster, clusterIdx) => (
            <Card key={cluster.id} className="border-2 border-blue-300">
              <CardHeader className="bg-blue-50 dark:bg-blue-950">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>电池簇 {cluster.id}</span>
                  {cluster.highVoltageBox.fault && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      故障
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {/* 簇高压箱 */}
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-semibold mb-2 text-muted-foreground">簇高压箱</div>
                  {cluster.highVoltageBox.fields && cluster.highVoltageBox.fields.length > 0 && (
                    <div className="mb-2">
                      <FieldsDisplay fields={cluster.highVoltageBox.fields} size="small" />
                    </div>
                  )}
                  <div className="mb-2">
                    <BreakerStatusDisplay breaker={cluster.highVoltageBox.breaker} label="簇断路器" />
                  </div>
                  {cluster.highVoltageBox.faultMessage && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                      {cluster.highVoltageBox.faultMessage}
                    </div>
                  )}
                </div>
                
                {/* 电池包（串联） */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2">
                    电池包（串联连接，共 {cluster.packs.length} 包）
                  </div>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {cluster.packs.map((pack, packIdx) => (
                        <div key={pack.id}>
                          {packIdx > 0 && (
                            <div className="flex items-center justify-center my-2">
                              <div className="flex-1 h-0.5 bg-border"></div>
                              <div className="px-2 text-xs text-muted-foreground">串联</div>
                              <div className="flex-1 h-0.5 bg-border"></div>
                            </div>
                          )}
                          <PackDisplay
                            pack={pack}
                            series={series}
                            parallel={parallel}
                            isExpanded={expandedPacks.has(pack.id)}
                            onToggle={() => togglePack(pack.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== 二级架构组件 ==========

interface Level2BMSProps {
  data: BatteryClusterLevel2;
  config: {
    packCount: number;
    cellCountPerPack: number;
    temperaturePointCountPerPack: number;
    cellConfiguration?: { series: number; parallel: number };
  };
}

export const Level2BMS: React.FC<Level2BMSProps> = ({ data, config }) => {
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());
  
  const { cellConfiguration } = config;
  const series = cellConfiguration?.series || 1;
  const parallel = cellConfiguration?.parallel || config.cellCountPerPack;
  
  const togglePack = (packId: string) => {
    const newExpanded = new Set(expandedPacks);
    if (newExpanded.has(packId)) {
      newExpanded.delete(packId);
    } else {
      newExpanded.add(packId);
    }
    setExpandedPacks(newExpanded);
  };
  
  return (
    <div className="p-4 space-y-4">
      {/* 电池簇 - 高压箱 */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-xl flex items-center justify-between">
            <span>电池簇 {data.id}</span>
            {data.highVoltageBox.fault && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                故障
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold mb-3 text-muted-foreground">簇高压箱</div>
              {data.highVoltageBox.fields && data.highVoltageBox.fields.length > 0 && (
                <div className="mb-3">
                  <FieldsDisplay fields={data.highVoltageBox.fields} size="large" />
                </div>
              )}
              <div className="mb-3">
                <BreakerStatusDisplay breaker={data.highVoltageBox.breaker} label="簇断路器" />
              </div>
              {data.highVoltageBox.faultMessage && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                  {data.highVoltageBox.faultMessage}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 电池包（串联） */}
      <div>
        <div className="text-sm font-semibold mb-3 text-muted-foreground">
          电池包（串联连接，共 {data.packs.length} 包）
        </div>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-2">
            {data.packs.map((pack, packIdx) => (
              <div key={pack.id}>
                {packIdx > 0 && (
                  <div className="flex items-center justify-center my-2">
                    <div className="flex-1 h-0.5 bg-border"></div>
                    <div className="px-2 text-xs text-muted-foreground">串联</div>
                    <div className="flex-1 h-0.5 bg-border"></div>
                  </div>
                )}
                <PackDisplay
                  pack={pack}
                  series={series}
                  parallel={parallel}
                  isExpanded={expandedPacks.has(pack.id)}
                  onToggle={() => togglePack(pack.id)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

