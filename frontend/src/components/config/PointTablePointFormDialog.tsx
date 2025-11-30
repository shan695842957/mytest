/**
 * 点表点表单对话框 - 创建/编辑点表点
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2 } from 'lucide-react'
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
import { useIOTypes, useRawTypes, useByteOrders } from '@/hooks/useDictQueries'
import type { PointTablePoint } from '@/types'
import { useCreatePointTablePoint, useUpdatePointTablePoint } from '@/hooks/usePointTableQueries'
import type { CreatePointTablePointRequest, UpdatePointTablePointRequest } from '@/types'

const pointFormSchema = z.object({
  point_name: z.string().min(1, '点名不能为空').max(100, '点名最多100个字符'),
  display_name: z.string().min(1, '显示名不能为空').max(200, '显示名最多200个字符'),
  address: z.string().min(1, '地址不能为空').max(100, '地址最多100个字符'),
  io_type: z.enum(['AI', 'AO', 'DI', 'DO', 'STRING']),
  raw_type: z.string().min(1, '原始类型不能为空'),
  byte_order: z.enum(['BE', 'LE', 'BE_SWAP', 'LE_SWAP']),
  scale_k: z.number().default(1),
  scale_b: z.number().default(0),
  parse_rules_json: z
    .object({
      sub_points: z
        .array(
          z.object({
            name: z.string().min(1, '子点名称不能为空'),
            type: z.string().min(1, '子点类型不能为空'),
            kind: z.enum(['BIT', 'BITS_RANGE']),
            bit: z.number().optional(),
            bit_from: z.number().optional(),
            bit_to: z.number().optional(),
          })
        )
        .optional(),
    })
    .passthrough()
    .optional(),
  description: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

type PointFormData = z.infer<typeof pointFormSchema>

interface PointTablePointFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: number
  point?: PointTablePoint | null
}

export function PointTablePointFormDialog({
  open,
  onOpenChange,
  templateId,
  point,
}: PointTablePointFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!point
  
  const { data: ioTypes } = useIOTypes()
  const { data: rawTypes } = useRawTypes()
  const { data: byteOrders } = useByteOrders()
  
  const createMutation = useCreatePointTablePoint()
  const updateMutation = useUpdatePointTablePoint()
  
  const form = useForm<PointFormData>({
    resolver: zodResolver(pointFormSchema),
    defaultValues: {
      point_name: '',
      display_name: '',
      address: '',
      io_type: 'AI',
      raw_type: '',
      byte_order: 'BE',
      scale_k: 1,
      scale_b: 0,
      parse_rules_json: {},
      description: '',
      is_active: true,
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (point) {
      form.reset({
        point_name: point.point_name,
        display_name: point.display_name,
        address: point.address,
        io_type: point.io_type as any,
        raw_type: point.raw_type,
        byte_order: point.byte_order as any,
        scale_k: point.scale_k,
        scale_b: point.scale_b,
        parse_rules_json: point.parse_rules_json || {},
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
        parse_rules_json: {},
        description: '',
        is_active: true,
      })
    }
  }, [point, form])
  
  const onSubmit = async (data: PointFormData) => {
    try {
      if (isEdit && point) {
        const updateData: UpdatePointTablePointRequest = {
          display_name: data.display_name,
          address: data.address,
          io_type: data.io_type,
          raw_type: data.raw_type,
          byte_order: data.byte_order,
          scale_k: data.scale_k,
          scale_b: data.scale_b,
          parse_rules_json: data.parse_rules_json,
          description: data.description || undefined,
          is_active: data.is_active,
        }
        await updateMutation.mutateAsync({ pointId: point.id, data: updateData })
      } else {
        const createData: CreatePointTablePointRequest = {
          point_name: data.point_name,
          display_name: data.display_name,
          address: data.address,
          io_type: data.io_type,
          raw_type: data.raw_type,
          byte_order: data.byte_order,
          scale_k: data.scale_k,
          scale_b: data.scale_b,
          parse_rules_json: data.parse_rules_json,
          description: data.description || undefined,
          is_active: data.is_active,
        }
        await createMutation.mutateAsync({ templateId, data: createData })
      }
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('pointTable.detail.editPoint') : t('pointTable.detail.addPoint')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新点表点信息' : '为点表模板添加新的点'}
          </DialogDescription>
        </DialogHeader>
        
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
                      <Input
                        {...field}
                        placeholder="例如：PRESSURE_001"
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
                    <FormLabel>{t('pointTable.pointForm.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：压力1" />
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
                      <Input {...field} placeholder="例如：40001" />
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ioTypes?.data?.map((iot) => (
                          <SelectItem key={iot.value} value={iot.value}>
                            {iot.label}
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择原始类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rawTypes?.data?.map((rt) => (
                          <SelectItem key={rt.value} value={rt.value}>
                            {rt.label}
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
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {byteOrders?.data?.map((bo) => (
                          <SelectItem key={bo.value} value={bo.value}>
                            {bo.label}
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
                        step="0.001"
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
                        step="0.001"
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
              name="parse_rules_json"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('pointTable.pointForm.subPoints')}</FormLabel>
                  <FormControl>
                    <div className="space-y-3 rounded-md border p-3">
                      {[
                        ...(Array.isArray(field.value?.sub_points) ? field.value!.sub_points : []),
                        ...(Array.isArray(field.value?.sub_points) && field.value!.sub_points.length > 0
                          ? []
                          : [
                              {
                                name: '',
                                type: 'BOOL',
                                kind: 'BIT',
                                bit: 0,
                              },
                            ]),
                      ].map((sp, index, arr) => {
                        const subPoints = arr
                        const update = (next: typeof subPoints) => {
                          field.onChange({ ...(field.value || {}), sub_points: next })
                        }
                        const current = [...subPoints]
                        return (
                          <div key={`${sp.name || 'sp'}-${index}`} className="space-y-2 rounded-md border p-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  {t('pointTable.pointForm.subPointName')}
                                </div>
                                <Input
                                  placeholder={t('pointTable.pointForm.subPointNamePlaceholder')}
                                  value={sp.name}
                                  onChange={(e) => {
                                    current[index] = { ...sp, name: e.target.value }
                                    update(current)
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  {t('pointTable.pointForm.subPointType')}
                                </div>
                                <Input
                                  placeholder={t('pointTable.pointForm.subPointTypePlaceholder')}
                                  value={sp.type}
                                  onChange={(e) => {
                                    current[index] = { ...sp, type: e.target.value }
                                    update(current)
                                  }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  {t('pointTable.pointForm.subPointKind')}
                                </div>
                                <Select
                                  value={sp.kind}
                                  onValueChange={(val) => {
                                    const nextKind = val as 'BIT' | 'BITS_RANGE'
                                    current[index] =
                                      nextKind === 'BIT'
                                        ? { ...sp, kind: nextKind, bit_from: undefined, bit_to: undefined, bit: sp.bit ?? 0 }
                                        : { ...sp, kind: nextKind, bit: undefined, bit_from: sp.bit_from ?? 0, bit_to: sp.bit_to ?? 0 }
                                    update(current)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('pointTable.pointForm.subPointKindPlaceholder')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="BIT">{t('pointTable.pointForm.kindBit')}</SelectItem>
                                    <SelectItem value="BITS_RANGE">{t('pointTable.pointForm.kindBitsRange')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {sp.kind === 'BIT' ? (
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">
                                    {t('pointTable.pointForm.bitIndex')}
                                  </div>
                                  <Input
                                    type="number"
                                    value={sp.bit ?? 0}
                                    onChange={(e) => {
                                      current[index] = { ...sp, bit: parseInt(e.target.value || '0', 10) }
                                      update(current)
                                    }}
                                  />
                                </div>
                              ) : (
                                <>
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">
                                      {t('pointTable.pointForm.bitFrom')}
                                    </div>
                                    <Input
                                      type="number"
                                      value={sp.bit_from ?? 0}
                                      onChange={(e) => {
                                        current[index] = { ...sp, bit_from: parseInt(e.target.value || '0', 10) }
                                        update(current)
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">
                                      {t('pointTable.pointForm.bitTo')}
                                    </div>
                                    <Input
                                      type="number"
                                      value={sp.bit_to ?? 0}
                                      onChange={(e) => {
                                        current[index] = { ...sp, bit_to: parseInt(e.target.value || '0', 10) }
                                        update(current)
                                      }}
                                    />
                                  </div>
                                </>
                              )}
                              
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const next = current.filter((_, i) => i !== index)
                                    update(next.length ? next : [{ name: '', type: 'BOOL', kind: 'BIT', bit: 0 }])
                                  }}
                                >
                                  <Trash2 className="size-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                       
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const current = Array.isArray(field.value?.sub_points) ? field.value!.sub_points : []
                            const next = [
                              ...current,
                              {
                                name: '',
                                type: 'BOOL',
                                kind: 'BIT',
                                bit: 0,
                              },
                            ]
                            field.onChange({ ...(field.value || {}), sub_points: next })
                          }}
                        >
                          <Plus className="mr-2 size-4" />
                          {t('pointTable.pointForm.addSubPoint')}
                        </Button>
                      </div>
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
                  <FormLabel>{t('pointTable.pointForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="点表点描述" rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t('pointTable.pointForm.isActive')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                {isLoading ? t('common:common.loading') : t('common:common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

