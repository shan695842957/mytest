/**
 * Rathole 服务列表组件
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MaterialListItem } from '@/components/common/MaterialListItem'
import { Badge } from '@/components/ui/badge'
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
import type { RatholeService } from '@/types'

interface Props {
  services: RatholeService[]
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  onEditClick: (service: RatholeService) => void
  onDeleteClick: (service_name: string) => void
}

export function RatholeServiceList({
  services,
  isLoading,
  onRefresh,
  onCreateClick,
  onEditClick,
  onDeleteClick,
}: Props) {
  const { t } = useTranslation(['tools', 'common'])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingServiceName, setDeletingServiceName] = useState<string>('')

  const handleDeleteClick = (service_name: string) => {
    setDeletingServiceName(service_name)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    onDeleteClick(deletingServiceName)
    setDeleteDialogOpen(false)
    setDeletingServiceName('')
  }

  return (
    <div className="space-y-4">
      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <Button onClick={onCreateClick} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {t('rathole.createService')}
        </Button>
        <Button variant="outline" onClick={onRefresh} disabled={isLoading} className="w-full sm:w-auto">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common:action.refresh')}
        </Button>
      </div>

      {/* 桌面端表格视图 */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('rathole.serviceName')}</TableHead>
              <TableHead>{t('rathole.token')}</TableHead>
              <TableHead>{t('rathole.localAddr')}</TableHead>
              <TableHead>{t('rathole.tableRatholeDescription')}</TableHead>
              <TableHead className="text-right">{t('common:action.title')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t('rathole.noServices')}
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.service_name}>
                  <TableCell className="font-medium font-mono">
                    {service.service_name}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {service.token.length > 12
                      ? `${service.token.substring(0, 12)}...`
                      : service.token}
                  </TableCell>
                  <TableCell className="font-mono">{service.local_addr}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {service.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditClick(service)}
                        title={t('common:action.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(service.service_name)}
                        title={t('common:action.delete')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 移动端卡片列表视图 */}
      <div className="md:hidden">
        {services.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-muted-foreground">
            {t('rathole.noServices')}
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((service) => (
              <MaterialListItem
                key={service.service_name}
                icon={
                  <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary font-mono text-xs">
                    {service.service_name.slice(0, 2).toUpperCase()}
                  </div>
                }
                title={service.service_name}
                description={
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-mono">
                        {service.token.length > 12
                          ? `${service.token.substring(0, 12)}...`
                          : service.token}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {service.local_addr}
                      </Badge>
                    </div>
                    {service.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {service.description}
                      </span>
                    )}
                  </div>
                }
                actions={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditClick(service)}>
                        <Edit className="mr-2 size-4" />
                        {t('common:action.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(service.service_name)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        {t('common:action.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rathole.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('rathole.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingServiceName('')}>
              {t('common:action.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:action.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

