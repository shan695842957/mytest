/**
 * 网络设置 Tab
 * 显示网卡、DNS、网关配置
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Network, Wifi, Globe, RefreshCw, CheckCircle2, XCircle, Edit } from 'lucide-react'

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

import { getNetworkConfig } from '@/api/gateway'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/permission'
import type { NetworkInterface as NetworkInterfaceType } from '@/types/gateway'

import { DNSEditDialog, NetworkInterfaceEditDialog } from '@/components/gateway'

export function NetworkSettingsTab() {
  const { t } = useTranslation(['gateway', 'common'])
  const { hasAnyRole } = useAuth()

  const canManage = hasAnyRole([UserRole.DEVELOPER, UserRole.OPERATOR])

  const [dnsDialogOpen, setDnsDialogOpen] = useState(false)
  const [interfaceDialogOpen, setInterfaceDialogOpen] = useState(false)
  const [selectedInterface, setSelectedInterface] = useState<NetworkInterfaceType | undefined>()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gateway', 'network'],
    queryFn: getNetworkConfig,
  })

  const networkConfig = data?.data

  const handleEditDNS = () => {
    setDnsDialogOpen(true)
  }

  const handleEditInterface = (iface: NetworkInterfaceType) => {
    setSelectedInterface(iface)
    setInterfaceDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('gateway:network.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('gateway:network.description')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('common:action.refresh')}
        </Button>
      </div>

      {/* DNS配置卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>{t('gateway:network.dns')}</CardTitle>
            </div>
            {canManage && (
              <Button variant="outline" size="sm" onClick={handleEditDNS}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common:action.edit')}
              </Button>
            )}
          </div>
          <CardDescription>{t('gateway:network.dnsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:network.primaryDNS')}
              </div>
              <div className="text-lg font-mono">
                {networkConfig?.dns.primary || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:network.secondaryDNS')}
              </div>
              <div className="text-lg font-mono">
                {networkConfig?.dns.secondary || 'N/A'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Globe className="h-4 w-4" />
                {t('gateway:network.defaultGateway')}
              </div>
              <div className="text-lg font-mono font-semibold text-primary">
                {networkConfig?.default_gateway || 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 网络接口列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              <CardTitle>{t('gateway:network.interfaces')}</CardTitle>
            </div>
          </div>
          <CardDescription>{t('gateway:network.interfacesDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">{t('gateway:network.interfaceName')}</TableHead>
                <TableHead>{t('gateway:network.ipAddress')}</TableHead>
                <TableHead>{t('gateway:network.netmask')}</TableHead>
                <TableHead>{t('gateway:network.broadcast')}</TableHead>
                <TableHead>{t('gateway:network.gateway')}</TableHead>
                <TableHead className="w-[140px]">{t('gateway:network.macAddress')}</TableHead>
                <TableHead className="w-[180px]">{t('gateway:network.status')}</TableHead>
                {canManage && <TableHead className="w-[80px] text-right">{t('common:action.title')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {networkConfig?.interfaces && networkConfig.interfaces.length > 0 ? (
                networkConfig.interfaces.map((iface, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium font-mono">
                      <div className="flex items-center gap-2">
                        {iface.name.startsWith('eth') ? (
                          <Network className="h-4 w-4 text-blue-500" />
                        ) : iface.name.startsWith('wlan') || iface.name.startsWith('wifi') ? (
                          <Wifi className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Globe className="h-4 w-4 text-gray-500" />
                        )}
                        {iface.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{iface.ip_address || '-'}</TableCell>
                    <TableCell className="font-mono">{iface.netmask || '-'}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {iface.broadcast || '-'}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-primary">
                      {iface.gateway || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{iface.mac_address || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {iface.is_up ? (
                          <Badge variant="default" className="gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('gateway:network.linkUp')}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            {t('gateway:network.linkDown')}
                          </Badge>
                        )}
                        {iface.is_running ? (
                          <Badge variant="outline" className="gap-1 w-fit text-green-600 border-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('gateway:network.running')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 w-fit text-gray-500">
                            <XCircle className="h-3 w-3" />
                            {t('gateway:network.notRunning')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditInterface(iface)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canManage ? 8 : 7} className="h-24 text-center">
                    {t('common:table.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DNS编辑对话框 */}
      <DNSEditDialog
        open={dnsDialogOpen}
        onOpenChange={setDnsDialogOpen}
        dnsConfig={networkConfig?.dns}
      />

      {/* 网卡编辑对话框 */}
      <NetworkInterfaceEditDialog
        open={interfaceDialogOpen}
        onOpenChange={setInterfaceDialogOpen}
        networkInterface={selectedInterface}
      />
    </div>
  )
}

