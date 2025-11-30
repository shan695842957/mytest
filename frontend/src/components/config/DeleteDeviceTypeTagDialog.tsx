/**
 * 删除业务字段确认对话框
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
import type { DeviceTypeTag } from '@/types'
import { useDeleteDeviceTypeTag } from '@/hooks/useDeviceTypeQueries'

interface DeleteDeviceTypeTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag: DeviceTypeTag | null
}

export function DeleteDeviceTypeTagDialog({ open, onOpenChange, tag }: DeleteDeviceTypeTagDialogProps) {
  const { t } = useTranslation('config')
  const deleteMutation = useDeleteDeviceTypeTag()
  
  const handleDelete = async () => {
    if (!tag) return
    
    try {
      await deleteMutation.mutateAsync(tag.id)
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  if (!tag) return null
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deviceType.detail.deleteTag')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('common:message.confirm_delete')}
            <div className="mt-4 rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">字段名:</span>
                <span className="font-mono text-sm">{tag.tag_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">显示名:</span>
                <span className="font-medium">{tag.display_name}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-destructive">
              ⚠️ 此操作不可撤销，请确认是否删除该业务字段。
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

