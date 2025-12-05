/**
 * 网络路由 Tab
 * 显示和管理系统路由表
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { 
  Router as RouterIcon, 
  Plus, 
  RefreshCw, 
  Trash2, 
  AlertTriangle,
  ArrowUpCircle,
  ArrowRightCircle,
} from 'lucide-react'
import { toast } from 'sonner'

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'

import { getRoutes, deleteRoute } from '@/api/gateway'
import { useAuth } from '@/hooks/useAuth'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import { UserRole } from '@/types/permission'
import type { Route } from '@/types/gateway'

import { AddRouteDialog } from '@/components/gateway/AddRouteDialog'

export function NetworkRoutesTab() {
  const { t } = useTranslation(['gateway', 'common'])
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()
  const isPageVisible = usePageVisibility()

  const canManage = hasAnyRole([UserRole.DEVELOPER])

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<Route | undefined>()

  // 优化：60秒刷新 + 页面不可见时停止（原30秒）
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gateway', 'routes'],
    queryFn: getRoutes,
    refetchInterval: (query) => {
      if (!isPageVisible) return false // 页面不可见时停止
      return 60000 // 60秒（路由配置变化少，降低频率）
    },
    staleTime: 30000, // 30秒内复用缓存
  })

  const routes = data?.data?.routes || []

  // 删除路由
  const deleteMutation = useMutation({
    mutationFn: (route: Route) => deleteRoute(route.destination, route.gateway, route.interface),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'routes'] })
      toast.success(t('gateway:routes.deleteSuccess'))
      setDeleteDialogOpen(false)
      setSelectedRoute(undefined)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(t('gateway:routes.deleteFailed') + ': ' + message)
    },
  })

  const handleDelete = (route: Route) => {
    setSelectedRoute(route)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedRoute) {
      deleteMutation.mutate(selectedRoute)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RouterIcon className="h-5 w-5" />
              <CardTitle>{t('gateway:routes.title')}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('common:action.refresh')}
              </Button>
              {canManage && (
                <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('gateway:routes.addRoute')}
                </Button>
              )}
            </div>
          </div>
          <CardDescription>{t('gateway:routes.description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{t('gateway:routes.destination')}</TableHead>
                <TableHead>{t('gateway:routes.gateway')}</TableHead>
                <TableHead className="w-[120px]">{t('gateway:routes.interface')}</TableHead>
                <TableHead className="w-[100px]">{t('gateway:routes.metric')}</TableHead>
                <TableHead className="w-[100px]">{t('gateway:routes.protocol')}</TableHead>
                <TableHead className="w-[100px]">{t('gateway:routes.scope')}</TableHead>
                {canManage && <TableHead className="w-[80px] text-right">{t('common:action.title')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length > 0 ? (
                routes.map((route, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono font-semibold">
                      <div className="flex items-center gap-2">
                        {route.is_default && (
                          <ArrowUpCircle className="h-4 w-4 text-primary" />
                        )}
                        {route.destination}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {route.gateway === '0.0.0.0' ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <span className="text-primary font-semibold">{route.gateway}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{route.interface}</TableCell>
                    <TableCell>
                      {route.metric === 0 ? (
                        <Badge variant="outline">{t('gateway:routes.direct')}</Badge>
                      ) : (
                        <span className="font-mono">{route.metric}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={route.protocol === 'static' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {route.protocol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {route.scope}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(route)}
                          disabled={route.protocol === 'kernel'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="h-24 text-center">
                    {t('common:table.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 添加路由对话框 */}
      <AddRouteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>{t('gateway:routes.deleteConfirmTitle')}</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {selectedRoute?.is_default && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-destructive font-semibold">
                    {t('gateway:routes.deleteDefaultWarning')}
                  </p>
                </div>
              )}
              <p>{t('gateway:routes.deleteConfirm')}</p>
              {selectedRoute && (
                <div className="mt-4 p-3 rounded-lg bg-muted font-mono text-sm space-y-1">
                  <div>{t('gateway:routes.destination')}: {selectedRoute.destination}</div>
                  <div>{t('gateway:routes.gateway')}: {selectedRoute.gateway}</div>
                  <div>{t('gateway:routes.interface')}: {selectedRoute.interface}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common:action.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('common:action.deleting') : t('common:action.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

