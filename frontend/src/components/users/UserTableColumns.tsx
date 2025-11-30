/**
 * 用户表格列定义
 */

import { useTranslation } from 'react-i18next'
import { MoreHorizontal, Edit, Trash2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@/types'
import { PermissionChecker } from '@/utils/permission'
import { formatDateTime } from '@/utils/format'

interface UserTableColumnsProps {
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onChangePassword: (user: User) => void
  currentUser: User | null
}

export function useUserTableColumns({
  onEdit,
  onDelete,
  onChangePassword,
  currentUser,
}: UserTableColumnsProps) {
  const { t } = useTranslation('auth')
  
  return [
    {
      header: 'ID',
      cell: (user: User) => <span className="font-mono text-sm">{user.id}</span>,
    },
    {
      header: t('user.username'),
      cell: (user: User) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.username}</span>
          {user.is_builtin && (
            <Badge variant="outline" className="text-xs">
              {t('user.is_builtin')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: t('user.role'),
      cell: (user: User) => (
        <Badge variant="secondary">
          {t(`role.${user.role}`)}
        </Badge>
      ),
    },
    {
      header: t('user.status'),
      cell: (user: User) => (
        <Badge variant={user.is_active ? 'default' : 'destructive'}>
          {user.is_active ? t('user.active') : t('user.inactive')}
        </Badge>
      ),
    },
    {
      header: t('user.created_at'),
      cell: (user: User) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(user.created_at)}
        </span>
      ),
    },
    {
      header: t('common:common.actions'),
      cell: (user: User) => {
        if (!currentUser) return null
        
        const canUpdate = PermissionChecker.canUpdateUser(currentUser, user)
        const canDelete = PermissionChecker.canDeleteUser(currentUser, user)
        const canChangePwd = PermissionChecker.canChangePassword(currentUser, user)
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common:common.actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {canUpdate && (
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="mr-2 size-4" />
                  {t('common:common.edit')}
                </DropdownMenuItem>
              )}
              
              {canChangePwd && (
                <DropdownMenuItem onClick={() => onChangePassword(user)}>
                  <Key className="mr-2 size-4" />
                  {t('user.change_password')}
                </DropdownMenuItem>
              )}
              
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(user)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 size-4" />
                    {t('common:common.delete')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

