/**
 * 删除外设设备确认对话框
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
import { useDeletePeripheral } from '@/hooks/usePeripheralQueries'
import type { Peripheral } from '@/types'

interface DeletePeripheralDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  peripheral: Peripheral | null
}

export function DeletePeripheralDialog({
  open,
  onOpenChange,
  peripheral,
}: DeletePeripheralDialogProps) {
  const { t } = useTranslation('config')
  const deleteMutation = useDeletePeripheral()
  
  const handleDelete = async () => {
    if (!peripheral) return
    
    try {
      await deleteMutation.mutateAsync(peripheral.id)
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  if (!peripheral) return null
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('peripheral.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('peripheral.delete.description', { name: peripheral.display_name })}
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

