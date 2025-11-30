/**
 * 系统工具 - 端口扫描页面
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  Network, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Info,
  AlertTriangle,
  Terminal,
  User as UserIcon,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { scanPort, killProcess } from '@/api/tools'
import type { PortInfo } from '@/api/tools'

export default function PortScanPage() {
  const { t } = useTranslation(['tools', 'common'])
  const [scanResult, setScanResult] = useState<PortInfo | null>(null)
  const [showKillDialog, setShowKillDialog] = useState(false)

  // 表单Schema
  const formSchema = z.object({
    port: z.number().min(1).max(65535),
  })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      port: 8000,
    },
  })

  // 端口扫描
  const scanMutation = useMutation({
    mutationFn: scanPort,
    onSuccess: (response) => {
      if (response.data) {
        setScanResult(response.data)
        
        // 检查错误状态
        if (!response.success || response.code !== 0) {
          toast.error(response.message)
          return
        }
        
        if (response.data.is_occupied) {
          toast.warning(t('tools:portScan.occupied'))
        } else {
          toast.success(t('tools:portScan.free'))
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('common:error.unknown'))
    },
  })

  // 终止进程
  const killMutation = useMutation({
    mutationFn: killProcess,
    onSuccess: (response) => {
      // 检查错误状态
      if (!response.success || response.code !== 0) {
        toast.error(response.message)
        setShowKillDialog(false)
        return
      }
      
      toast.success(t('tools:portScan.processKilled'))
      setShowKillDialog(false)
      // 重新扫描
      form.handleSubmit(onSubmit)()
    },
    onError: (error: any) => {
      toast.error(error.message || t('common:error.unknown'))
    },
  })

  const onSubmit = (data: FormData) => {
    scanMutation.mutate({
      port: data.port,
    })
  }

  const handleKillProcess = () => {
    if (scanResult?.process) {
      killMutation.mutate(scanResult.process.pid)
    }
  }

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Network className="h-6 w-6" />
          {t('tools:portScan.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('tools:portScan.description')}
        </p>
      </div>

      {/* 扫描表单 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('tools:portScan.title')}</CardTitle>
          <CardDescription>{t('tools:portScan.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 端口号 */}
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('tools:portScan.port')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('tools:portScan.portPlaceholder')}
                        min={1}
                        max={65535}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 8000)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 提交按钮 */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={scanMutation.isPending}
                  className="min-w-[120px]"
                >
                  {scanMutation.isPending ? (
                    <>
                      <Search className="mr-2 h-4 w-4 animate-pulse" />
                      {t('tools:portScan.scanning')}
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      {t('tools:portScan.scan')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 扫描结果 */}
      {!scanResult ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('tools:portScan.scanHint')}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {scanResult.is_occupied ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-600">{t('tools:portScan.occupied')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-green-600">{t('tools:portScan.free')}</span>
                  </>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">
                {scanResult.host}:{scanResult.port}
              </Badge>
              <Badge variant="secondary">{scanResult.protocol}</Badge>
            </div>
          </CardHeader>

          {/* 进程信息 */}
          {scanResult.is_occupied && scanResult.process && (
            <CardContent>
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  {t('tools:portScan.processInfo')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  {/* PID */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {t('tools:portScan.pid')}
                    </div>
                    <div className="font-mono text-lg font-bold">
                      {scanResult.process.pid}
                    </div>
                  </div>

                  {/* 进程名称 */}
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {t('tools:portScan.processName')}
                    </div>
                    <div className="font-semibold">
                      {scanResult.process.name}
                    </div>
                  </div>

                  {/* 运行用户 */}
                  {scanResult.process.user && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {t('tools:portScan.user')}
                      </div>
                      <div className="font-mono">
                        {scanResult.process.user}
                      </div>
                    </div>
                  )}

                  {/* 命令行 */}
                  {scanResult.process.cmdline && (
                    <div className="space-y-1 md:col-span-2">
                      <div className="text-sm text-muted-foreground">
                        {t('tools:portScan.cmdline')}
                      </div>
                      <div className="font-mono text-xs bg-background p-2 rounded overflow-x-auto">
                        {scanResult.process.cmdline}
                      </div>
                    </div>
                  )}
                </div>

                {/* 终止进程按钮 */}
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowKillDialog(true)}
                    disabled={killMutation.isPending}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    {t('tools:portScan.killProcess')}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 终止进程确认对话框 */}
      <AlertDialog open={showKillDialog} onOpenChange={setShowKillDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('tools:portScan.killProcess')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('tools:portScan.killConfirm')}
              {scanResult?.process && (
                <div className="mt-2 p-2 bg-muted rounded text-sm font-mono">
                  PID: {scanResult.process.pid} - {scanResult.process.name}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKillProcess}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:action.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

