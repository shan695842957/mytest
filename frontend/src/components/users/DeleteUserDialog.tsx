/**
 * 删除用户确认对话框
 */

import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/types'
import { useDeleteUser } from '@/hooks/useUserQueries'

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const { t } = useTranslation('auth')
  const deleteMutation = useDeleteUser()
  
  const handleDelete = async () => {
    if (!user) return
    
    try {
      await deleteMutation.mutateAsync(user.id)
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  if (!user) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('user.delete')}</DialogTitle>
          <DialogDescription>
            {t('common:message.confirm_delete')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">用户名:</span>
              <span className="font-medium">{user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">角色:</span>
              <Badge variant="secondary">{t(`role.${user.role}`)}</Badge>
            </div>
          </div>
          
          <p className="mt-4 text-sm text-destructive">
            ⚠️ 此操作不可撤销，请确认是否删除该用户。
          </p>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t('common:common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('common:common.loading') : t('common:common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

