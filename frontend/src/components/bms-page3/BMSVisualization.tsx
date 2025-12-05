/**
 * BMS 储能系统可视化组件
 * 
 * ============================================
 * 使用说明
 * ============================================
 * 
 * 本文件包含三级架构和二级架构两个可视化组件。
 * 
 * 组件列表：
 * - Level3BMS: 三级架构组件（电池堆 → 电池簇 → 电池包 → 电池单体）
 * - Level2BMS: 二级架构组件（电池簇 → 电池包 → 电池单体）
 * 
 * 使用方式：
 * ```tsx
 * import { Level3BMS, Level2BMS } from '@/components/bms-page3/BMSVisualization';
 * import { useLevel3BMS } from '@/hooks/useBMSPage3';
 * import { createLevel3BMSData } from '@/utils/bmsFactory';
 * 
 * // 创建初始数据
 * const config = {
 *   clusterCount: 3,
 *   packCountPerCluster: 4,
 *   cellCountPerPack: 30,
 *   temperaturePointCountPerPack: 5,
 * };
 * const initialData = createLevel3BMSData(config);
 * 
 * // 使用Hook管理数据
 * const bms = useLevel3BMS(initialData);
 * 
 * // 渲染组件
 * <Level3BMS data={bms.data} config={config} />
 * ```
 * 
 * 数据更新：
 * 通过 useBMS Hook 提供的更新函数更新数据，详见 hooks/useBMSPage3.ts
 * 
 * 特性：
 * - 使用动态字段数组，支持多语言字段名
 * - 清晰展示串并联关系（簇并联、包串联）
 * - 避免整屏滚动，使用局部滚动容器
 * - 支持不同供应商的数据结构差异
 * 
 * 依赖：
 * - React 19+
 * - Tailwind CSS
 * - lucide-react (图标)
 * - @radix-ui/react-tabs (标签页)
 */

import React from 'react';
import { BatteryStackData, BatteryClusterDataLevel2, BreakerStatus, DataField } from '@/types/bms-page3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

// ========== 共享组件 ==========

/**
 * 渲染动态字段数组
 */
const FieldsDisplay: React.FC<{ fields: DataField[]; className?: string }> = ({ fields, className = '' }) => {
  if (!fields || fields.length === 0) return null;
  
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${className}`}>
      {fields.map((field, idx) => (
        <div key={idx}>
          <span className="text-sm text-gray-600">{field.name}:</span>
          <span className="ml-2 font-semibold">
            {typeof field.value === 'number' 
              ? field.value.toFixed(2) 
              : typeof field.value === 'boolean'
              ? field.value ? '是' : '否'
              : field.value}
            {field.unit && <span className="ml-1 text-gray-500">{field.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * 渲染大号字段数组（用于高压箱）
 */
const LargeFieldsDisplay: React.FC<{ fields: DataField[]; className?: string }> = ({ fields, className = '' }) => {
  if (!fields || fields.length === 0) return null;
  
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {fields.map((field, idx) => (
        <div key={idx}>
          <span className="text-sm text-gray-600">{field.name}:</span>
          <div className="text-2xl font-bold text-blue-600">
            {typeof field.value === 'number' 
              ? field.value.toFixed(2) 
              : typeof field.value === 'boolean'
              ? field.value ? '是' : '否'
              : field.value}
            {field.unit && <span className="ml-1 text-lg text-gray-500">{field.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 渲染断路器状态
 */
const BreakerStatusDisplay: React.FC<{ breaker: BreakerStatus }> = ({ breaker }) => {
  if (breaker.closed !== undefined) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">断路器:</span>
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
        <span className="text-sm text-gray-600">正极:</span>
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
        <span className="text-sm text-gray-600">负极:</span>
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
 * 电池单体显示组件
 */
const CellDisplay: React.FC<{ cell: any; index: number }> = ({ cell, index }) => {
  return (
    <div className="p-2 border rounded bg-white hover:bg-gray-50 transition-colors">
      <div className="text-xs font-semibold text-gray-700 mb-1">单体 {index + 1}</div>
      {cell.fields && cell.fields.length > 0 ? (
        <div className="space-y-1">
          {cell.fields.map((field: DataField, idx: number) => (
            <div key={idx} className="text-xs text-gray-600">
              {field.name}: {typeof field.value === 'number' ? field.value.toFixed(2) : String(field.value)}
              {field.unit && <span className="ml-1">{field.unit}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400">无数据</div>
      )}
    </div>
  );
};

/**
 * 电池包显示组件
 */
const PackDisplay: React.FC<{ pack: any; config: any }> = ({ pack, config }) => {
  const { cellConfiguration } = config;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>电池包 {pack.id}</span>
          {pack.fault && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              故障
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pack.fields && pack.fields.length > 0 && (
          <div className="mb-4">
            <FieldsDisplay fields={pack.fields} />
          </div>
        )}
        
        {pack.faultMessage && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {pack.faultMessage}
          </div>
        )}
        
        <div className="mb-4">
          <div className="text-sm font-semibold mb-2 text-gray-700">
            电池单体
            {cellConfiguration && (
              <span className="text-xs text-gray-500 ml-2">
                ({cellConfiguration.series}串{cellConfiguration.parallel}并)
              </span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto border rounded p-2 bg-gray-50">
            <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-[repeat(15,minmax(0,1fr))] gap-2">
              {pack.cells.map((cell: any, idx: number) => (
                <CellDisplay key={cell.id || idx} cell={cell} index={idx} />
              ))}
            </div>
          </div>
        </div>
        
        {pack.temperaturePoints && pack.temperaturePoints.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2 text-gray-700">温度测点</div>
            <div className="flex flex-wrap gap-2">
              {pack.temperaturePoints.map((tp: any, idx: number) => (
                <div key={tp.id || idx} className="px-3 py-1 bg-blue-50 border border-blue-200 rounded text-sm">
                  <span className="text-gray-600">测点{tp.id}:</span>
                  <span className="ml-2 font-semibold">{tp.temperature.toFixed(1)}{tp.unit || '°C'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ========== 三级架构组件 ==========

interface Level3BMSProps {
  data: BatteryStackData;
  config: {
    packCountPerCluster: number;
    cellCountPerPack: number;
    temperaturePointCountPerPack: number;
    cellConfiguration?: { series: number; parallel: number };
  };
}

const ClusterDisplay: React.FC<{ cluster: any; config: any }> = ({ cluster, config }) => {
  return (
    <Card className="mb-6 border-2 border-blue-300">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-xl flex items-center justify-between">
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
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold mb-3 text-gray-800">簇高压箱</div>
          {cluster.highVoltageBox.fields && cluster.highVoltageBox.fields.length > 0 && (
            <div className="mb-3">
              <LargeFieldsDisplay fields={cluster.highVoltageBox.fields} />
            </div>
          )}
          <div className="mb-3">
            <BreakerStatusDisplay breaker={cluster.highVoltageBox.breaker} />
          </div>
          {cluster.highVoltageBox.faultMessage && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {cluster.highVoltageBox.faultMessage}
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <div className="text-sm text-gray-600 mb-2">电池包（串联连接）</div>
          <div className="space-y-2">
            {cluster.packs.map((pack: any, idx: number) => (
              <div key={pack.id || idx}>
                {idx > 0 && (
                  <div className="flex justify-center my-1">
                    <div className="w-8 h-0.5 bg-gray-400"></div>
                    <div className="px-2 text-xs text-gray-500">串联</div>
                    <div className="w-8 h-0.5 bg-gray-400"></div>
                  </div>
                )}
                <PackDisplay pack={pack} config={config} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Level3BMS: React.FC<Level3BMSProps> = ({ data, config }) => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 border-2 border-green-400">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-2xl flex items-center justify-between">
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
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-semibold mb-4 text-gray-800">总高压箱</div>
              {data.mainHighVoltageBox.fields && data.mainHighVoltageBox.fields.length > 0 && (
                <div className="mb-4">
                  <LargeFieldsDisplay fields={data.mainHighVoltageBox.fields} />
                </div>
              )}
              <div className="mb-4">
                <BreakerStatusDisplay breaker={data.mainHighVoltageBox.breaker} />
              </div>
              {data.mainHighVoltageBox.faultMessage && (
                <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {data.mainHighVoltageBox.faultMessage}
                </div>
              )}
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-3">电池簇（并联连接）</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.clusters.map((cluster, idx) => (
                  <div key={cluster.id || idx}>
                    {idx > 0 && idx % 2 === 0 && (
                      <div className="flex items-center justify-center my-2">
                        <div className="flex-1 h-0.5 bg-gray-400"></div>
                        <div className="px-3 text-xs text-gray-500">并联</div>
                        <div className="flex-1 h-0.5 bg-gray-400"></div>
                      </div>
                    )}
                    <ClusterDisplay cluster={cluster} config={config} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ========== 二级架构组件 ==========

interface Level2BMSProps {
  data: BatteryClusterDataLevel2;
  config: {
    packCount: number;
    cellCountPerPack: number;
    temperaturePointCountPerPack: number;
    cellConfiguration?: { series: number; parallel: number };
  };
}

export const Level2BMS: React.FC<Level2BMSProps> = ({ data, config }) => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 border-2 border-blue-400">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-2xl flex items-center justify-between">
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
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-semibold mb-4 text-gray-800">簇高压箱</div>
              {data.highVoltageBox.fields && data.highVoltageBox.fields.length > 0 && (
                <div className="mb-4">
                  <LargeFieldsDisplay fields={data.highVoltageBox.fields} />
                </div>
              )}
              <div className="mb-3">
                <BreakerStatusDisplay breaker={data.highVoltageBox.breaker} />
              </div>
              {data.highVoltageBox.faultMessage && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {data.highVoltageBox.faultMessage}
                </div>
              )}
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-3">电池包（串联连接）</div>
              <div className="space-y-2">
                {data.packs.map((pack, idx) => (
                  <div key={pack.id || idx}>
                    {idx > 0 && (
                      <div className="flex justify-center my-1">
                        <div className="w-8 h-0.5 bg-gray-400"></div>
                        <div className="px-2 text-xs text-gray-500">串联</div>
                        <div className="w-8 h-0.5 bg-gray-400"></div>
                      </div>
                    )}
                    <PackDisplay pack={pack} config={config} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
