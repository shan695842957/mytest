/**
 * BMS层级配置表单组件
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  getBMSHierarchyConfig,
  createBMSHierarchyConfig,
  updateBMSHierarchyConfig,
  type BMSHierarchyConfig,
  type CreateBMSHierarchyConfigRequest,
  type UpdateBMSHierarchyConfigRequest,
} from '@/api/bms'

interface BMSHierarchyConfigFormProps {
  instanceId: number
  architectureName?: string
}

export function BMSHierarchyConfigForm({ instanceId, architectureName }: BMSHierarchyConfigFormProps) {
  const { t } = useTranslation(['config', 'common'])
  const queryClient = useQueryClient()
  const isLevelThree = (architectureName ?? '').toLowerCase() === 'level3'

  // 获取层级配置
  const { data: hierarchyConfigData, isLoading } = useQuery({
    queryKey: ['bms-hierarchy-config', instanceId],
    queryFn: () => getBMSHierarchyConfig(instanceId),
    enabled: !!instanceId,
  })

  const hierarchyConfig = hierarchyConfigData?.data as BMSHierarchyConfig | undefined
  const isEdit = !!hierarchyConfig

  // 表单Schema
  const formSchema = z.object({
    cluster_count: z.number().min(1, t('validation.min', { min: 1, ns: 'common' })),
    pack_count_per_cluster: z.number().min(1, t('validation.min', { min: 1, ns: 'common' })),
    series_count: z.number().min(1, t('validation.min', { min: 1, ns: 'common' })),
    parallel_count: z.number().min(1, t('validation.min', { min: 1, ns: 'common' })),
    temperature_point_count: z.number().min(0, t('validation.min', { min: 0, ns: 'common' })),
    description_zh: z.string().optional(),
    description_en: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cluster_count: 1,
      pack_count_per_cluster: 1,
      series_count: 15,
      parallel_count: 2,
      temperature_point_count: 0,
      description_zh: '',
      description_en: '',
    },
  })

  // 编辑模式：填充表单
  useEffect(() => {
    if (hierarchyConfig) {
      form.reset({
        cluster_count: hierarchyConfig.cluster_count,
        pack_count_per_cluster: hierarchyConfig.pack_count_per_cluster,
        series_count: hierarchyConfig.series_count,
        parallel_count: hierarchyConfig.parallel_count,
        temperature_point_count: hierarchyConfig.temperature_point_count,
        description_zh: hierarchyConfig.description_zh,
        description_en: hierarchyConfig.description_en,
      })
    } else if (!isLevelThree) {
      form.setValue('cluster_count', 1)
    }
  }, [hierarchyConfig, form, isLevelThree])

  // 创建Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBMSHierarchyConfigRequest) =>
      createBMSHierarchyConfig(instanceId, data),
    onSuccess: () => {
      toast.success(t('bms.hierarchy_config.created_success', '层级配置创建成功'))
      queryClient.invalidateQueries({ queryKey: ['bms-hierarchy-config'] })
    },
    onError: (error: any) => {
      toast.error(t('bms.hierarchy_config.create_failed', '层级配置创建失败'), {
        description: error?.response?.data?.detail || error.message,
      })
    },
  })

  // 更新Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateBMSHierarchyConfigRequest) =>
      updateBMSHierarchyConfig(instanceId, data),
    onSuccess: () => {
      toast.success(t('bms.hierarchy_config.updated_success', '层级配置更新成功'))
      queryClient.invalidateQueries({ queryKey: ['bms-hierarchy-config'] })
    },
    onError: (error: any) => {
      toast.error(t('bms.hierarchy_config.update_failed', '层级配置更新失败'), {
        description: error?.response?.data?.detail || error.message,
      })
    },
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    const payload = {
      ...data,
      cluster_count: isLevelThree ? data.cluster_count ?? 1 : 1,
    }
    if (isEdit) {
      updateMutation.mutate(payload as UpdateBMSHierarchyConfigRequest)
    } else {
      createMutation.mutate(payload as CreateBMSHierarchyConfigRequest)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('bms.config.hierarchy_config', '层级配置')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('bms.config.hierarchy_config', '层级配置')}</CardTitle>
        <CardDescription>
          {t('bms.hierarchy_config.description', '配置BMS实例的层级结构：簇数量、每簇包数量、串并数、温度测点数')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 层级结构配置 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">
                {t('bms.hierarchy_config.structure', '层级结构')}
              </h3>

              <div className={cn('grid gap-4', isLevelThree ? 'md:grid-cols-2 grid-cols-1' : 'grid-cols-1')}>
                {isLevelThree ? (
                  <FormField
                    control={form.control}
                    name="cluster_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('bms.hierarchy_config.cluster_count', '簇数量')}
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            min={1}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('bms.hierarchy_config.cluster_count_desc', '三级架构为堆下簇数，二级架构通常为 1')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                    {t(
                      'bms.hierarchy_config.cluster_count_level2',
                      '二级架构默认只有一个簇，系统会自动使用 1。'
                    )}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="pack_count_per_cluster"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('bms.hierarchy_config.pack_count_per_cluster', '每簇包数量')}
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          min={1}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('bms.hierarchy_config.pack_count_per_cluster_desc', '每个簇下的包数量')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="series_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('bms.hierarchy_config.series_count', '串联数')}
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          min={1}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('bms.hierarchy_config.series_count_desc', '每个包的串联数（如 15）')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parallel_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('bms.hierarchy_config.parallel_count', '并联数')}
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          min={1}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('bms.hierarchy_config.parallel_count_desc', '每个包的并联数（如 2）')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="temperature_point_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('bms.hierarchy_config.temperature_point_count', '温度测点数量')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        min={0}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('bms.hierarchy_config.temperature_point_count_desc', '每个包的温度测点数量（统一配置，若没有则填 0）')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 描述信息 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">
                {t('bms.hierarchy_config.description_section', '描述信息')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description_zh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bms.hierarchy_config.description_zh', '中文描述')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="可选" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bms.hierarchy_config.description_en', '英文描述')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="可选" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? t('common:saving')
                  : isEdit
                  ? t('common:update')
                  : t('common:create')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
