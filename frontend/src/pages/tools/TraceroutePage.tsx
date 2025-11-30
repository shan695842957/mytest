/**
 * 系统工具 - Traceroute 路由追踪页面
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Route, 
  Play, 
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { tracerouteTest } from '@/api/tools'
import type { TracerouteResult } from '@/api/tools'

export default function TraceroutePage() {
  const { t } = useTranslation(['tools', 'common'])
  const [traceResult, setTraceResult] = useState<TracerouteResult | null>(null)

  // 表单Schema
  const formSchema = z.object({
    target: z.string().min(1, { message: t('tools:ping.error.targetRequired') }),
    max_hops: z.number().min(1).max(64),
    timeout: z.number().min(1).max(30),
  })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target: '',
      max_hops: 30,
      timeout: 5,
    },
  })

  // Traceroute测试
  const traceMutation = useMutation({
    mutationFn: tracerouteTest,
    onSuccess: (response) => {
      if (response.data) {
        setTraceResult(response.data)
        
        // 检查是否是错误状态（success=false 或 code != 0）
        if (!response.success || response.code !== 0) {
          toast.error(response.message)  // ← 显示标准错误消息（已i18n）
          return
        }
        
        if (response.data.success) {
          toast.success(t('tools:traceroute.result') + `: ${response.data.total_hops} ${t('tools:traceroute.hop')}`)
        } else {
          toast.error(t('tools:traceroute.timeout'))
        }
      }
    },
    onError: (error: any) => {
      // 网络错误或其他异常
      toast.error(error.message || t('common:error.unknown'))
    },
  })

  const onSubmit = (data: FormData) => {
    // 清空之前的结果
    setTraceResult(null)
    
    traceMutation.mutate({
      target: data.target,
      max_hops: data.max_hops,
      timeout: data.timeout,
    })
  }

  // 计算平均延迟
  const getAvgLatency = (rtt1?: number, rtt2?: number, rtt3?: number) => {
    const rtts = [rtt1, rtt2, rtt3].filter((r): r is number => r != null)
    if (rtts.length === 0) return null
    return rtts.reduce((a, b) => a + b, 0) / rtts.length
  }

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Route className="h-6 w-6" />
          {t('tools:traceroute.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('tools:traceroute.description')}
        </p>
      </div>

      {/* Traceroute表单 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools:traceroute.title')}</CardTitle>
          <CardDescription>{t('tools:traceroute.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 目标地址 */}
                <FormField
                  control={form.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>{t('tools:traceroute.target')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('tools:traceroute.targetPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 最大跳数 */}
                <FormField
                  control={form.control}
                  name="max_hops"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tools:traceroute.maxHops')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={64}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription>1-64</FormDescription>
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
                      <FormLabel>{t('tools:traceroute.timeout')}</FormLabel>
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
                            {t('tools:traceroute.timeoutUnit')}
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t('tools:traceroute.timeoutDesc')}
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
                  disabled={traceMutation.isPending}
                  className="min-w-[120px]"
                >
                  {traceMutation.isPending ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      {t('tools:traceroute.tracing')}
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      {t('tools:traceroute.startTrace')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 追踪结果 */}
      {!traceResult ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('tools:traceroute.traceHint')}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* 结果概览 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {traceResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span>{t('tools:traceroute.result')}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-600">{t('tools:traceroute.timeout')}</span>
                    </>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(traceResult.executed_at)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{traceResult.target}</Badge>
                <Badge variant="secondary">
                  {t('tools:traceroute.totalHops')}: {traceResult.total_hops}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* 路由跳点列表 */}
          {traceResult.hops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('tools:traceroute.result')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">{t('tools:traceroute.hop')}</TableHead>
                      <TableHead>{t('tools:traceroute.ipAddress')}</TableHead>
                      <TableHead>{t('tools:traceroute.hostname')}</TableHead>
                      <TableHead>RTT1</TableHead>
                      <TableHead>RTT2</TableHead>
                      <TableHead>RTT3</TableHead>
                      <TableHead>{t('tools:traceroute.avgLatency')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {traceResult.hops.map((hop) => {
                      const avgLatency = getAvgLatency(hop.rtt1, hop.rtt2, hop.rtt3)
                      
                      return (
                        <TableRow key={hop.hop_number}>
                          <TableCell className="font-bold">
                            <div className="flex items-center gap-2">
                              <span>{hop.hop_number}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell>
                            {hop.ip ? (
                              <span className="font-mono text-sm">{hop.ip}</span>
                            ) : hop.timeout ? (
                              <Badge variant="destructive">{t('tools:traceroute.timeout')}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hop.hostname ? (
                              <span className="text-sm">{hop.hostname}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hop.rtt1 != null ? (
                              <span className="font-mono text-sm text-blue-600">
                                {hop.rtt1.toFixed(2)} ms
                              </span>
                            ) : (
                              <span className="text-muted-foreground">*</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hop.rtt2 != null ? (
                              <span className="font-mono text-sm text-cyan-600">
                                {hop.rtt2.toFixed(2)} ms
                              </span>
                            ) : (
                              <span className="text-muted-foreground">*</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hop.rtt3 != null ? (
                              <span className="font-mono text-sm text-teal-600">
                                {hop.rtt3.toFixed(2)} ms
                              </span>
                            ) : (
                              <span className="text-muted-foreground">*</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {avgLatency != null ? (
                              <span className="font-mono text-sm font-semibold text-green-600">
                                {avgLatency.toFixed(2)} ms
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 详细输出 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tools:ping.output')}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-[400px] overflow-y-auto">
                <code>{traceResult.output}</code>
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

