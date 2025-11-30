/**
 * Rathole 服务列表组件
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, RefreshCw, Edit, Trash2 } from 'lucide-react'
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
      <div className="flex items-center justify-end gap-2">
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('rathole.createService')}
        </Button>
        <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('common:action.refresh')}
        </Button>
      </div>

      <div className="rounded-md border">
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

