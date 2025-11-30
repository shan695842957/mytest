/**
 * 用户表单对话框 - 创建/编辑用户
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { User } from '@/types'
import { UserRole as UserRoleEnum } from '@/types'
import { useCreateUser, useUpdateUser } from '@/hooks/useUserQueries'

const userFormSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符'),
  password: z.string().min(6, '密码至少6个字符').optional(),
  role: z.nativeEnum(UserRoleEnum),
  is_active: z.boolean(),
})

type UserFormData = z.infer<typeof userFormSchema>

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const { t } = useTranslation('auth')
  const isEdit = !!user
  
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '',
      role: UserRoleEnum.USER,
      is_active: true,
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        password: '',
        role: user.role,
        is_active: user.is_active,
      })
    } else {
      form.reset({
        username: '',
        password: '',
        role: UserRoleEnum.USER,
        is_active: true,
      })
    }
  }, [user, form])
  
  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          id: user.id,
          data: {
            username: data.username,
            role: data.role,
            is_active: data.is_active,
          },
        })
      } else {
        await createMutation.mutateAsync({
          username: data.username,
          password: data.password!,
          role: data.role,
        })
      }
      onOpenChange(false)
      form.reset()
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('user.edit') : t('user.create')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '修改用户信息' : '创建新用户账号'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user.username')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="请输入用户名" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!isEdit && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="请输入密码（至少6位）" />
                    </FormControl>
                    <FormDescription>
                      初始密码，用户可以稍后修改
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('user.role')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRoleEnum.DEVELOPER}>
                        {t('role.developer')}
                      </SelectItem>
                      <SelectItem value={UserRoleEnum.OPERATOR}>
                        {t('role.operator')}
                      </SelectItem>
                      <SelectItem value={UserRoleEnum.USER}>
                        {t('role.user')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t(`role.description.${field.value}`)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('user.status')}</FormLabel>
                    <FormDescription>
                      启用后用户可以正常登录系统
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common:common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common:common.loading') : t('common:common.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

