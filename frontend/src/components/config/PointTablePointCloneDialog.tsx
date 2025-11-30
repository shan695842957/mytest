/**
 * 点表点复制对话框
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
import { Switch } from '@/components/ui/switch'
import type { PointTablePoint } from '@/types'
import { useClonePointTablePoint } from '@/hooks/usePointTableQueries'
import type { ClonePointTablePointRequest } from '@/types'
import { useIOTypes, useRawTypes, useByteOrders } from '@/hooks/useDictQueries'

const cloneSchema = z.object({
  point_name: z.string().min(1, '点名不能为空').max(100, '点名最多100个字符'),
  display_name: z.string().min(1, '显示名不能为空').max(200, '显示名最多200个字符'),
  address: z.string().min(1, '地址不能为空').max(100, '地址最多100个字符'),
  io_type: z.enum(['AI', 'AO', 'DI', 'DO', 'STRING']),
  raw_type: z.string().min(1, '原始类型不能为空'),
  byte_order: z.enum(['BE', 'LE', 'BE_SWAP', 'LE_SWAP']),
  scale_k: z.number(),
  scale_b: z.number(),
  description: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type ClonePointFormData = z.infer<typeof cloneSchema>

interface PointTablePointCloneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  point?: PointTablePoint | null
}

export function PointTablePointCloneDialog({
  open,
  onOpenChange,
  point,
}: PointTablePointCloneDialogProps) {
  const { t } = useTranslation('config')
  const cloneMutation = useClonePointTablePoint()
  const { data: ioTypes } = useIOTypes()
  const { data: rawTypes } = useRawTypes()
  const { data: byteOrders } = useByteOrders()
  
  const form = useForm<ClonePointFormData>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      point_name: '',
      display_name: '',
      address: '',
      io_type: 'AI',
      raw_type: '',
      byte_order: 'BE',
      scale_k: 1,
      scale_b: 0,
      description: '',
      is_active: true,
    },
  })
  
  useEffect(() => {
    if (point) {
      form.reset({
        point_name: `${point.point_name}_copy`,
        display_name: `${point.display_name} (${t('pointTable.pointClone.copySuffix')})`,
        address: point.address,
        io_type: point.io_type as ClonePointFormData['io_type'],
        raw_type: point.raw_type,
        byte_order: point.byte_order as ClonePointFormData['byte_order'],
        scale_k: point.scale_k,
        scale_b: point.scale_b,
        description: point.description || '',
        is_active: point.is_active,
      })
    } else {
      form.reset({
        point_name: '',
        display_name: '',
        address: '',
        io_type: 'AI',
        raw_type: '',
        byte_order: 'BE',
        scale_k: 1,
        scale_b: 0,
        description: '',
        is_active: true,
      })
    }
  }, [point, form, t])
  
  const onSubmit = async (data: ClonePointFormData) => {
    if (!point) return
    const payload: ClonePointTablePointRequest = {
      point_name: data.point_name,
      display_name: data.display_name,
      address: data.address,
      io_type: data.io_type,
      raw_type: data.raw_type,
      byte_order: data.byte_order,
      scale_k: data.scale_k,
      scale_b: data.scale_b,
      description: data.description || undefined,
      is_active: data.is_active,
    }
    try {
      await cloneMutation.mutateAsync({ pointId: point.id, data: payload })
      onOpenChange(false)
    } catch {
      // handled
    }
  }
  
  const isSubmitting = cloneMutation.isPending
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('pointTable.pointClone.title')}</DialogTitle>
          <DialogDescription>{t('pointTable.pointClone.description')}</DialogDescription>
        </DialogHeader>
        
        {point ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="point_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pointTable.pointForm.pointName')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例如：StatusWord2_copy" />
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
                      <FormLabel>{t('pointTable.pointForm.displayName')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="显示名" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pointTable.pointForm.address')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="寄存器地址" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="io_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pointTable.pointForm.ioType')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ioTypes?.data?.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="raw_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pointTable.pointForm.rawType')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rawTypes?.data?.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
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
                  name="byte_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pointTable.pointForm.byteOrder')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {byteOrders?.data?.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scale_k"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pointTable.pointForm.scaleK')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scale_b"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pointTable.pointForm.scaleB')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pointTable.pointForm.description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="点表点描述" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{t('pointTable.pointForm.isActive')}</FormLabel>
                      <p className="text-sm text-muted-foreground">{t('pointTable.pointClone.activeHint')}</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('common:common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {t('pointTable.pointClone.submit')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('pointTable.pointClone.noSource')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

