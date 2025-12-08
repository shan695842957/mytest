/**
 * 删除BMS实例确认对话框
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
import type { BMSInstance } from '@/api/bms'

interface DeleteBMSInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance: BMSInstance | null
  onConfirm: () => void
}

export function DeleteBMSInstanceDialog({
  open,
  onOpenChange,
  instance,
  onConfirm,
}: DeleteBMSInstanceDialogProps) {
  const { t } = useTranslation('config')
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('bms.instance.delete.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('bms.instance.delete.description', {
              name: instance?.display_name_zh || instance?.instance_name,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground">
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
