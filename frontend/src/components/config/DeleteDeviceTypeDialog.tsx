/**
 * 删除设备类型确认对话框
 */

import { useTranslation } from 'react-i18next'
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
import type { DeviceType } from '@/types'
import { useDeleteDeviceType } from '@/hooks/useDeviceTypeQueries'

interface DeleteDeviceTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceType: DeviceType | null
}

export function DeleteDeviceTypeDialog({ open, onOpenChange, deviceType }: DeleteDeviceTypeDialogProps) {
  const { t } = useTranslation('config')
  const deleteMutation = useDeleteDeviceType()
  
  const handleDelete = async () => {
    if (!deviceType) return
    
    try {
      await deleteMutation.mutateAsync(deviceType.id)
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  if (!deviceType) return null
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deviceType.success.deleted')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('common:message.confirm_delete')}
            <div className="mt-4 rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">显示名称:</span>
                <span className="font-medium">{deviceType.display_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">内部名称:</span>
                <span className="font-mono text-sm">{deviceType.name}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-destructive">
              ⚠️ 此操作不可撤销，请确认是否删除该设备类型。
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t('common:common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? t('common:common.loading') : t('common:common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

