/**
 * 修改密码对话框
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'
import { useChangePassword } from '@/hooks/useUserQueries'
import { useAuth } from '@/hooks/useAuth'

const passwordSchema = z.object({
  old_password: z.string().optional(),
  new_password: z.string().min(6, '新密码至少6个字符'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: '两次密码不一致',
  path: ['confirm_password'],
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
}

export function ChangePasswordDialog({ open, onOpenChange, user }: ChangePasswordDialogProps) {
  const { t } = useTranslation('auth')
  const { user: currentUser } = useAuth()
  const changePwdMutation = useChangePassword()
  
  // 是否修改自己的密码（需要旧密码）
  const isChangingSelf = user?.id === currentUser?.id
  
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  })
  
  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])
  
  const onSubmit = async (data: PasswordFormData) => {
    if (!user) return
    
    try {
      await changePwdMutation.mutateAsync({
        id: user.id,
        data: {
          old_password: isChangingSelf ? data.old_password : undefined,
          new_password: data.new_password,
        },
      })
      onOpenChange(false)
      form.reset()
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  if (!user) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('user.change_password')}</DialogTitle>
          <DialogDescription>
            修改用户 <strong>{user.username}</strong> 的密码
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isChangingSelf && (
              <FormField
                control={form.control}
                name="old_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('user.old_password')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="请输入旧密码" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user.new_password')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="请输入新密码（至少6位）" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user.confirm_password')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="请再次输入新密码" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={changePwdMutation.isPending}
              >
                {t('common:common.cancel')}
              </Button>
              <Button type="submit" disabled={changePwdMutation.isPending}>
                {changePwdMutation.isPending ? t('common:common.loading') : t('common:common.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

