/**
 * 个人中心页面
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User as UserIcon, Key, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChangePasswordDialog } from '@/components/users/ChangePasswordDialog'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/utils/format'

export default function ProfilePage() {
  const { t: tAuth } = useTranslation('auth')
  const { t } = useTranslation('user')
  const { user } = useAuth()
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  
  if (!user) return null
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本信息卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UserIcon className="size-6" />
              </div>
              <div>
                <CardTitle>{t('profile.basic.title')}</CardTitle>
                <CardDescription>{t('profile.basic.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{t('profile.basic.username')}</span>
              <span className="font-medium">{user.username}</span>
            </div>
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{t('profile.basic.role')}</span>
              <Badge variant="secondary" className="text-sm">
                {tAuth(`role.${user.role}`)}
              </Badge>
            </div>
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{t('profile.basic.status')}</span>
              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                {user.is_active ? tAuth('user.active') : tAuth('user.inactive')}
              </Badge>
            </div>
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{t('profile.basic.accountType')}</span>
              {user.is_builtin ? (
                <Badge variant="outline">{tAuth('user.is_builtin')}</Badge>
              ) : (
                <span className="text-sm">{t('profile.basic.normalAccount')}</span>
              )}
            </div>
            <Separator />
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{t('profile.basic.createdAt')}</span>
              <span className="text-sm font-mono">
                {formatDateTime(user.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* 权限说明卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="size-6" />
              </div>
              <div>
                <CardTitle>{t('profile.permission.title')}</CardTitle>
                <CardDescription>{t('profile.permission.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold">{tAuth(`role.${user.role}`)}</h4>
              <p className="text-sm text-muted-foreground">
                {tAuth(`role.description.${user.role}`)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* 安全设置卡片 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Key className="size-6" />
              </div>
              <div>
                <CardTitle>{t('profile.security.title')}</CardTitle>
                <CardDescription>{t('profile.security.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <h4 className="font-medium mb-1">{t('profile.security.changePassword')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('profile.security.changePasswordHint')}
                </p>
              </div>
              <Button onClick={() => setPasswordDialogOpen(true)}>
                <Key className="mr-2 size-4" />
                {t('profile.security.changePassword')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 修改密码对话框 */}
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        user={user}
      />
    </div>
  )
}
