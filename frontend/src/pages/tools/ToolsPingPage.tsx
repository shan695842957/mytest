/**
 * 系统工具 - Ping 测试页面
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Network, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Info,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { pingTest, getNetworkInterfaces } from '@/api/tools'
import type { PingResult, PingRequest } from '@/api/tools'
import { formatDateTime } from '@/utils/format'

export default function ToolsPingPage() {
  const { t } = useTranslation(['tools', 'common'])
  const [pingResult, setPingResult] = useState<PingResult | null>(null)

  // 获取网卡列表
  const { data: interfacesData } = useQuery({
    queryKey: ['network-interfaces'],
    queryFn: getNetworkInterfaces,
  })

  const interfaces = interfacesData?.data || []

  // 表单Schema
  const formSchema = z.object({
    target: z.string().min(1, { message: t('tools:ping.error.targetRequired') }),
    count: z.number().min(1).max(100),
    timeout: z.number().min(1).max(30),
    interface: z.string().optional(),
  })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target: '',
      count: 4,
      timeout: 5,
      interface: undefined,
    },
  })

  // Ping测试
  const pingMutation = useMutation({
    mutationFn: pingTest,
    onSuccess: (response) => {
      if (response.data) {
        setPingResult(response.data)
        
        // 检查错误状态
        if (!response.success || response.code !== 0) {
          toast.error(response.message)
          return
        }
        
        if (response.data.success) {
          toast.success(t('tools:ping.success'))
        } else {
          toast.error(response.data.error_message || t('tools:ping.failed'))
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('common:error.unknown'))
    },
  })

  const onSubmit = (data: FormData) => {
    const request: PingRequest = {
      target: data.target,
      count: data.count,
      timeout: data.timeout,
      interface: data.interface || undefined,
    }
    pingMutation.mutate(request)
  }

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Network className="h-5 w-5" />
          {t('tools:ping.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('tools:ping.description')}
        </p>
      </div>

      {/* Ping表单 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools:ping.title')}</CardTitle>
          <CardDescription>{t('tools:ping.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 目标地址 */}
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('tools:ping.target')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('tools:ping.targetPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ping次数 */}
                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tools:ping.count')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 4)}
                        />
                      </FormControl>
                      <FormDescription>1-100</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 超时时间 */}
                <FormField
                  control={form.control}
                  name="timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tools:ping.timeout')}</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">
                            {t('tools:ping.timeoutUnit')}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>1-30</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 指定网卡 */}
                <FormField
                  control={form.control}
                  name="interface"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('tools:ping.interface')}</FormLabel>
                      <Select
                        value={field.value || 'none'}
                        onValueChange={(value) =>
                          field.onChange(value === 'none' ? undefined : value)
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('tools:ping.interfacePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            {t('tools:ping.interfacePlaceholder')}
                          </SelectItem>
                          {interfaces.map((iface) => (
                            <SelectItem key={iface.name} value={iface.name}>
                              {iface.display_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('tools:ping.interfacePlaceholder')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={pingMutation.isPending}
                  className="min-w-[120px]"
                >
                  {pingMutation.isPending ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      {t('tools:ping.testing')}
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {t('tools:ping.startTest')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {!pingResult ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('tools:ping.testHint')}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* 结果状态 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {pingResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">{t('tools:ping.success')}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-600">{t('tools:ping.failed')}</span>
                    </>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(pingResult.executed_at)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline">{pingResult.target}</Badge>
                {pingResult.interface_used && (
                  <Badge variant="secondary">{pingResult.interface_used}</Badge>
                )}
                {!pingResult.interface_used && (
                  <Badge variant="secondary">{t('tools:ping.noInterface')}</Badge>
                )}
              </div>
            </CardHeader>

            {/* 统计信息 */}
            {pingResult.statistics && (
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 发送数据包 */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {t('tools:ping.packetsSent')}
                    </div>
                    <div className="text-2xl font-bold">
                      {pingResult.statistics.packets_sent}
                    </div>
                  </div>

                  {/* 接收数据包 */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      {t('tools:ping.packetsReceived')}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {pingResult.statistics.packets_received}
                    </div>
                  </div>

                  {/* 丢失数据包 */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      {t('tools:ping.packetsLost')}
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {pingResult.statistics.packets_lost}
                    </div>
                  </div>

                  {/* 丢包率 */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {t('tools:ping.lossRate')}
                    </div>
                    <div className={`text-2xl font-bold ${
                      pingResult.statistics.loss_rate === 0 
                        ? 'text-green-600' 
                        : pingResult.statistics.loss_rate < 10
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {pingResult.statistics.loss_rate.toFixed(1)}%
                    </div>
                  </div>

                  {/* 最小延迟 */}
                  {pingResult.statistics.min_time != null && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {t('tools:ping.minTime')}
                      </div>
                      <div className="text-lg font-semibold text-blue-600">
                        {pingResult.statistics.min_time.toFixed(2)} ms
                      </div>
                    </div>
                  )}

                  {/* 平均延迟 */}
                  {pingResult.statistics.avg_time != null && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {t('tools:ping.avgTime')}
                      </div>
                      <div className="text-lg font-semibold text-cyan-600">
                        {pingResult.statistics.avg_time.toFixed(2)} ms
                      </div>
                    </div>
                  )}

                  {/* 最大延迟 */}
                  {pingResult.statistics.max_time != null && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">
                        {t('tools:ping.maxTime')}
                      </div>
                      <div className="text-lg font-semibold text-orange-600">
                        {pingResult.statistics.max_time.toFixed(2)} ms
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* 详细输出 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tools:ping.output')}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                <code>{pingResult.output || pingResult.error_message}</code>
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

