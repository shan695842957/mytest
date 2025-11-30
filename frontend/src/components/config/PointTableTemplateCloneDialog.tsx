/**
 * 通信模板复制对话框
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { PointTableTemplate } from '@/types'
import { useClonePointTableTemplate } from '@/hooks/usePointTableQueries'
import type { ClonePointTableTemplateRequest } from '@/types'

const cloneSchema = z.object({
  name: z.string().min(1, '内部名称不能为空').max(100, '内部名称最多100个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  protocol_type: z.string().min(1, '协议类型不能为空'),
  description: z.string().optional().or(z.literal('')),
})

type CloneFormData = z.infer<typeof cloneSchema>

interface PointTableTemplateCloneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: PointTableTemplate | null
}

export function PointTableTemplateCloneDialog({
  open,
  onOpenChange,
  template,
}: PointTableTemplateCloneDialogProps) {
  const { t } = useTranslation('config')
  const cloneMutation = useClonePointTableTemplate()
  
  const form = useForm<CloneFormData>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      name: '',
      display_name: '',
      protocol_type: '',
      description: '',
    },
  })
  
  useEffect(() => {
    if (template) {
      form.reset({
        name: `${template.name}_copy`,
        display_name: `${template.display_name} (${t('pointTable.clone.copySuffix')})`,
        protocol_type: template.protocol_type,
        description: template.description || '',
      })
    } else {
      form.reset({
        name: '',
        display_name: '',
        protocol_type: '',
        description: '',
      })
    }
  }, [template, form, t])
  
  const onSubmit = async (data: CloneFormData) => {
    if (!template) return
    const payload: ClonePointTableTemplateRequest = {
      name: data.name,
      display_name: data.display_name,
      protocol_type: data.protocol_type,
      description: data.description || undefined,
    }
    try {
      await cloneMutation.mutateAsync({ id: template.id, data: payload })
      onOpenChange(false)
    } catch (error) {
      // 错误在 mutation 中处理
    }
  }
  
  const isSubmitting = cloneMutation.isPending
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('pointTable.clone.title')}</DialogTitle>
          <DialogDescription>{t('pointTable.clone.description')}</DialogDescription>
        </DialogHeader>
        
        {template ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pointTable.form.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('pointTable.list.searchPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pointTable.form.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('pointTable.form.displayName')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="protocol_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pointTable.form.protocolType')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：modbus_tcp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pointTable.form.description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="通信模板描述" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('common:common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {t('pointTable.clone.submit')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('pointTable.clone.noSource')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

