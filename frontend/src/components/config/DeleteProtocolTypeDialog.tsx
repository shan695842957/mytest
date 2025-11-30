/**
 * 删除协议类型确认对话框
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
import { useDeleteProtocolType } from '@/hooks/useProtocolTypeQueries'
import type { ProtocolType } from '@/types'

interface DeleteProtocolTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolType: ProtocolType | null
}

export function DeleteProtocolTypeDialog({
  open,
  onOpenChange,
  protocolType,
}: DeleteProtocolTypeDialogProps) {
  const { t } = useTranslation('config')
  const deleteMutation = useDeleteProtocolType()
  
  const handleDelete = async () => {
    if (!protocolType) return
    
    try {
      await deleteMutation.mutateAsync(protocolType.id)
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  if (!protocolType) return null
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('protocolType.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('protocolType.delete.description', { name: protocolType.display_name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', { ns: 'common' })}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? t('common.deleting', { ns: 'common' }) : t('common.delete', { ns: 'common' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

