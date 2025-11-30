/**
 * 添加路由对话框
 * 可复用的独立组件
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

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

import { addRoute, getNetworkConfig } from '@/api/gateway'
import type { RouteCreate } from '@/types/gateway'

// CIDR验证正则（支持 0.0.0.0/0 或 192.168.1.0/24）
const CIDR_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\/([0-9]|[12][0-9]|3[0-2]))?$/
const IP_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

// 表单验证Schema
const routeFormSchema = z.object({
  destination: z
    .string()
    .min(1, '目标网络不能为空')
    .regex(CIDR_REGEX, '目标网络格式不正确（如 192.168.1.0/24 或 0.0.0.0/0）'),
  gateway: z
    .string()
    .min(1, '网关地址不能为空')
    .regex(IP_REGEX, '网关地址格式不正确'),
  interface: z
    .string()
    .min(1, '接口不能为空'),
  metric: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .default(100),
})

type RouteFormData = z.infer<typeof routeFormSchema>

interface AddRouteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRouteDialog({ open, onOpenChange }: AddRouteDialogProps) {
  const { t } = useTranslation(['gateway', 'common'])
  const queryClient = useQueryClient()

  // 获取网络接口列表
  const { data: networkData } = useQuery({
    queryKey: ['gateway', 'network'],
    queryFn: getNetworkConfig,
    enabled: open,
  })

  const interfaces = networkData?.data?.interfaces || []

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      destination: '',
      gateway: '',
      interface: '',
      metric: 100,
    },
  })

  // 添加路由
  const addMutation = useMutation({
    mutationFn: (data: RouteCreate) => addRoute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'routes'] })
      toast.success(t('gateway:routes.addSuccess'))
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(t('gateway:routes.addFailed') + ': ' + message)
    },
  })

  const onSubmit = (data: RouteFormData) => {
    addMutation.mutate(data)
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('gateway:routes.addRoute')}</DialogTitle>
          <DialogDescription>
            {t('gateway:routes.addRouteDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* 警告提示 */}
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">
                {t('gateway:routes.warning')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('gateway:routes.warningMessage')}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 目标网络 */}
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gateway:routes.destination')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="192.168.1.0/24 或 0.0.0.0/0"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('gateway:routes.destinationHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 网关地址 */}
            <FormField
              control={form.control}
              name="gateway"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gateway:routes.gateway')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="192.168.1.1"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('gateway:routes.gatewayHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 出接口 */}
            <FormField
              control={form.control}
              name="interface"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gateway:routes.interface')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder={t('gateway:routes.selectInterface')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {interfaces
                        .filter(iface => iface.is_up && iface.ip_address)
                        .map((iface) => (
                          <SelectItem key={iface.name} value={iface.name} className="font-mono">
                            {iface.name} ({iface.ip_address})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('gateway:routes.interfaceHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 路由权重 */}
            <FormField
              control={form.control}
              name="metric"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gateway:routes.metric')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={1000}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 100)}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('gateway:routes.metricHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={addMutation.isPending}
              >
                {t('common:action.cancel')}
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? t('common:action.saving') : t('common:action.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

