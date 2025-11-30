/**
 * 删除协议类型参数确认对话框
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
import { useDeleteProtocolTypeParam } from '@/hooks/useProtocolTypeQueries'
import type { ProtocolType, ProtocolTypeParam } from '@/types'

interface DeleteProtocolTypeParamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  param: ProtocolTypeParam | null
  protocolType: ProtocolType | null
}

export function DeleteProtocolTypeParamDialog({
  open,
  onOpenChange,
  param,
  protocolType,
}: DeleteProtocolTypeParamDialogProps) {
  const { t } = useTranslation('config')
  const deleteMutation = useDeleteProtocolTypeParam()
  
  const handleDelete = async () => {
    if (!param || !protocolType) return
    
    try {
      await deleteMutation.mutateAsync({
        paramId: param.id,
        protocolTypeId: protocolType.id,
      })
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  if (!param || !protocolType) return null
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('protocolType.param.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('protocolType.param.delete.description', {
              paramName: param.display_name,
              protocolName: protocolType.display_name,
            })}
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

