/**
 * 点表模板表单对话框 - 创建/编辑点表模板
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProtocolTypes } from '@/hooks/useDictQueries'
import type { PointTableTemplate } from '@/types'
import { useCreatePointTableTemplate, useUpdatePointTableTemplate } from '@/hooks/usePointTableQueries'
import type { CreatePointTableTemplateRequest, UpdatePointTableTemplateRequest } from '@/types'

const templateFormSchema = z.object({
  name: z.string().min(1, '内部名称不能为空').max(100, '内部名称最多100个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  protocol_type: z.string().min(1, '协议类型不能为空'),
  description: z.string().optional().or(z.literal('')),
})

type TemplateFormData = z.infer<typeof templateFormSchema>

interface PointTableTemplateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: PointTableTemplate | null
}

export function PointTableTemplateFormDialog({
  open,
  onOpenChange,
  template,
}: PointTableTemplateFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!template
  
  const { data: protocolTypes } = useProtocolTypes()
  const createMutation = useCreatePointTableTemplate()
  const updateMutation = useUpdatePointTableTemplate()
  
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      protocol_type: '',
      description: '',
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        display_name: template.display_name,
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
  }, [template, form])
  
  const onSubmit = async (data: TemplateFormData) => {
    try {
      if (isEdit && template) {
        const updateData: UpdatePointTableTemplateRequest = {
          display_name: data.display_name,
          protocol_type: data.protocol_type,
          description: data.description || undefined,
        }
        await updateMutation.mutateAsync({ id: template.id, data: updateData })
      } else {
        const createData: CreatePointTableTemplateRequest = {
          name: data.name,
          display_name: data.display_name,
          protocol_type: data.protocol_type,
          description: data.description || undefined,
        }
        await createMutation.mutateAsync(createData)
      }
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('pointTable.form.update') : t('pointTable.form.create')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新通信模板信息' : '创建新的通信模板'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pointTable.form.name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="例如：COMP_MODBUS_V1"
                      disabled={isEdit}
                    />
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
                    <Input {...field} placeholder="例如：压缩机Modbus点表V1" />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择协议类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {protocolTypes?.data?.map((pt) => (
                        <SelectItem key={pt.value} value={pt.value}>
                          {pt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common:common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common:common.loading') : t('common:common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

