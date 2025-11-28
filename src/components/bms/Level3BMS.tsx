/**
 * 三级架构BMS可视化组件
 * 电池堆 -> 电池簇 -> 电池包 -> 电池单体
 */

import React from 'react';
import { BatteryStackData, BreakerStatus } from '@/types/bms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Level3BMSProps {
  /** 电池堆数据 */
  data: BatteryStackData;
  /** 配置信息 */
  config: {
    packCountPerCluster: number;
    cellCountPerPack: number;
    temperaturePointCountPerPack: number;
    cellConfiguration?: { series: number; parallel: number };
  };
}

/**
 * 渲染断路器状态
 */
const BreakerStatusDisplay: React.FC<{ breaker: BreakerStatus }> = ({ breaker }) => {
  // 某些供应商使用单个合闸标志位
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
  
  // 某些供应商使用正负极分别控制
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
      {cell.voltage !== undefined && (
        <div className="text-xs text-gray-600">电压: {cell.voltage.toFixed(2)}V</div>
      )}
      {cell.temperature !== undefined && (
        <div className="text-xs text-gray-600">温度: {cell.temperature.toFixed(1)}°C</div>
      )}
      {cell.soc !== undefined && (
        <div className="text-xs text-gray-600">SOC: {cell.soc.toFixed(1)}%</div>
      )}
      {cell.soh !== undefined && (
        <div className="text-xs text-gray-600">SOH: {cell.soh.toFixed(1)}%</div>
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
        {/* 包级数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-sm">
          {pack.voltage !== undefined && (
            <div>
              <span className="text-gray-600">电压:</span>
              <span className="ml-2 font-semibold">{pack.voltage.toFixed(2)}V</span>
            </div>
          )}
          {pack.current !== undefined && (
            <div>
              <span className="text-gray-600">电流:</span>
              <span className="ml-2 font-semibold">{pack.current.toFixed(2)}A</span>
            </div>
          )}
          {pack.power !== undefined && (
            <div>
              <span className="text-gray-600">功率:</span>
              <span className="ml-2 font-semibold">{pack.power.toFixed(2)}W</span>
            </div>
          )}
          {pack.soc !== undefined && (
            <div>
              <span className="text-gray-600">SOC:</span>
              <span className="ml-2 font-semibold">{pack.soc.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        {pack.faultMessage && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {pack.faultMessage}
          </div>
        )}
        
        {/* 单体显示 - 使用滚动容器避免整屏滚动 */}
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
        
        {/* 温度测点显示 */}
        {pack.temperaturePoints && pack.temperaturePoints.length > 0 && (
          <div>
            <div className="text-sm font-semibold mb-2 text-gray-700">温度测点</div>
            <div className="flex flex-wrap gap-2">
              {pack.temperaturePoints.map((tp: any, idx: number) => (
                <div key={tp.id || idx} className="px-3 py-1 bg-blue-50 border border-blue-200 rounded text-sm">
                  <span className="text-gray-600">测点{tp.id}:</span>
                  <span className="ml-2 font-semibold">{tp.temperature.toFixed(1)}°C</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * 电池簇显示组件
 */
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
        {/* 簇高压箱数据 */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold mb-3 text-gray-800">簇高压箱</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {cluster.highVoltageBox.voltage !== undefined && (
              <div>
                <span className="text-sm text-gray-600">簇电压:</span>
                <div className="text-lg font-bold text-blue-600">{cluster.highVoltageBox.voltage.toFixed(2)}V</div>
              </div>
            )}
            {cluster.highVoltageBox.current !== undefined && (
              <div>
                <span className="text-sm text-gray-600">簇电流:</span>
                <div className="text-lg font-bold text-blue-600">{cluster.highVoltageBox.current.toFixed(2)}A</div>
              </div>
            )}
            {cluster.highVoltageBox.power !== undefined && (
              <div>
                <span className="text-sm text-gray-600">簇功率:</span>
                <div className="text-lg font-bold text-blue-600">{cluster.highVoltageBox.power.toFixed(2)}W</div>
              </div>
            )}
            {cluster.highVoltageBox.soc !== undefined && (
              <div>
                <span className="text-sm text-gray-600">簇SOC:</span>
                <div className="text-lg font-bold text-blue-600">{cluster.highVoltageBox.soc.toFixed(1)}%</div>
              </div>
            )}
          </div>
          <div className="mb-3">
            <BreakerStatusDisplay breaker={cluster.highVoltageBox.breaker} />
          </div>
          {cluster.highVoltageBox.faultMessage && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {cluster.highVoltageBox.faultMessage}
            </div>
          )}
        </div>
        
        {/* 电池包列表 - 包与包之间串联 */}
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

/**
 * 三级架构BMS主组件
 */
export const Level3BMS: React.FC<Level3BMSProps> = ({ data, config }) => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 电池堆标题 */}
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
            {/* 总高压箱数据 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-semibold mb-4 text-gray-800">总高压箱</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {data.mainHighVoltageBox.voltage !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">总电压:</span>
                    <div className="text-2xl font-bold text-green-600">{data.mainHighVoltageBox.voltage.toFixed(2)}V</div>
                  </div>
                )}
                {data.mainHighVoltageBox.current !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">总电流:</span>
                    <div className="text-2xl font-bold text-green-600">{data.mainHighVoltageBox.current.toFixed(2)}A</div>
                  </div>
                )}
                {data.mainHighVoltageBox.power !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">总功率:</span>
                    <div className="text-2xl font-bold text-green-600">{data.mainHighVoltageBox.power.toFixed(2)}W</div>
                  </div>
                )}
                {data.mainHighVoltageBox.soc !== undefined && (
                  <div>
                    <span className="text-sm text-gray-600">总SOC:</span>
                    <div className="text-2xl font-bold text-green-600">{data.mainHighVoltageBox.soc.toFixed(1)}%</div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <BreakerStatusDisplay breaker={data.mainHighVoltageBox.breaker} />
              </div>
              {data.mainHighVoltageBox.loadBalancing && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600">负载均衡:</span>
                  <Badge variant={data.mainHighVoltageBox.loadBalancing.enabled ? "success" : "secondary"} className="ml-2">
                    {data.mainHighVoltageBox.loadBalancing.enabled ? "启用" : "禁用"}
                  </Badge>
                  {data.mainHighVoltageBox.loadBalancing.status && (
                    <span className="ml-2 text-sm text-gray-600">{data.mainHighVoltageBox.loadBalancing.status}</span>
                  )}
                </div>
              )}
              {data.mainHighVoltageBox.protection && (
                <div className="mb-2">
                  <span className="text-sm text-gray-600">保护状态:</span>
                  {data.mainHighVoltageBox.protection.shortCircuit && (
                    <Badge variant="destructive" className="ml-2">短路保护</Badge>
                  )}
                  {data.mainHighVoltageBox.protection.overload && (
                    <Badge variant="warning" className="ml-2">过载保护</Badge>
                  )}
                </div>
              )}
              {data.mainHighVoltageBox.faultMessage && (
                <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {data.mainHighVoltageBox.faultMessage}
                </div>
              )}
            </div>
            
            {/* 电池簇列表 - 簇与簇之间并联 */}
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
