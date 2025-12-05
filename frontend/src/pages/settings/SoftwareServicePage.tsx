/**
 * 软件设置-服务管理页面
 * 应用服务：服务状态、日志级别、服务控制、缓存清理
 */
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Info, Server, Circle, RefreshCw } from 'lucide-react'
import { ServiceManagementTab } from './tabs/ServiceManagementTab'
import { getServicesStatus } from '@/api/gateway'
import { useAuth } from '@/hooks/useAuth'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { UserRole } from '@/types/permission'

export default function SoftwareServicePage() {
  const { t } = useTranslation(['gateway', 'common'])
  const { hasAnyRole } = useAuth()
  const isPageVisible = usePageVisibility()
  
  const isDeveloper = hasAnyRole([UserRole.DEVELOPER])

  // 优化：60秒刷新 + 页面不可见时停止（原10秒）
  const { data: servicesData, isLoading: servicesLoading, refetch } = useQuery({
    queryKey: ['gateway', 'services'],
    queryFn: getServicesStatus,
    refetchInterval: (query) => {
      if (!isPageVisible) return false // 页面不可见时停止
      return 60000 // 60秒（服务状态变化少，降低频率）
    },
    staleTime: 30000, // 30秒内复用缓存
  })

  const services = servicesData?.data

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'connected':
        return 'text-green-500'
      case 'stopped':
        return 'text-gray-400'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Server className="h-5 w-5" />
          {t('gateway:software.serviceTitle')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('gateway:software.serviceDescription')}</p>
      </div>
      
      {/* 运维者只读提示 */}
      {!isDeveloper && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('gateway:software.readOnlyHint')}
          </AlertDescription>
        </Alert>
      )}

      {/* 服务状态 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle>{t('gateway:software.servicesStatus')}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common:action.refresh')}
            </Button>
          </div>
          <CardDescription>{t('gateway:software.servicesDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {servicesLoading ? (
            <div className="p-6">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">{t('gateway:info.status')}</TableHead>
                  <TableHead>{t('gateway:info.serviceName')}</TableHead>
                  <TableHead className="w-[100px]">{t('gateway:info.port')}</TableHead>
                  <TableHead className="w-[120px]">{t('gateway:info.version')}</TableHead>
                  <TableHead className="w-[150px]">{t('gateway:info.uptime')}</TableHead>
                  <TableHead className="w-[100px]">PID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services && services.length > 0 ? (
                  services.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Circle className={`h-3 w-3 fill-current ${getStatusIcon(service.status)}`} />
                      </TableCell>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {service.port || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {service.version || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {service.uptime || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {service.pid || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {t('common:table.noData')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <ServiceManagementTab readOnly={!isDeveloper} />
    </div>
  )
}

