/**
 * 系统工具 - ARP表查看页面
 */
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { 
  Network, 
  RefreshCw,
  Info,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

import { getARPTable } from '@/api/tools'

export default function ARPTablePage() {
  const { t } = useTranslation(['tools', 'common'])

  // 获取ARP表
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['arp-table'],
    queryFn: getARPTable,
    refetchInterval: false, // 不自动刷新
  })

  const arpEntries = data?.data || []

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            {t('tools:arp.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('tools:arp.description')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? t('tools:arp.refreshing') : t('tools:arp.refresh')}
        </Button>
      </div>

      {/* ARP表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('tools:arp.title')}</CardTitle>
            {!isLoading && (
              <Badge variant="secondary">
                {t('tools:arp.totalEntries', { count: arpEntries.length })}
              </Badge>
            )}
          </div>
          <CardDescription>{t('tools:arp.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : arpEntries.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{t('tools:arp.noEntries')}</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tools:arp.ip')}</TableHead>
                  <TableHead>{t('tools:arp.mac')}</TableHead>
                  <TableHead>{t('tools:arp.interface')}</TableHead>
                  <TableHead>{t('tools:arp.type')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arpEntries.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{entry.ip}</TableCell>
                    <TableCell className="font-mono text-sm">{entry.mac}</TableCell>
                    <TableCell>
                      {entry.interface ? (
                        <Badge variant="outline">{entry.interface}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.type ? (
                        <Badge variant="secondary">{entry.type}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

