/**
 * 删除资产确认对话框
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
import type { Asset } from '@/types'
import { useDeleteAsset } from '@/hooks/useAssetQueries'

interface DeleteAssetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
}

export function DeleteAssetDialog({ open, onOpenChange, asset }: DeleteAssetDialogProps) {
  const { t } = useTranslation('config')
  const deleteMutation = useDeleteAsset()
  
  const handleDelete = async () => {
    if (!asset) return
    
    try {
      await deleteMutation.mutateAsync(asset.id)
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  if (!asset) return null
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('asset.success.deleted')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('common:message.confirm_delete')}
            <div className="mt-4 rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">名称:</span>
                <span className="font-medium">{asset.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">显示名称:</span>
                <span className="font-medium">{asset.display_name}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-destructive">
              ⚠️ 此操作不可撤销，请确认是否删除该资产。
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

