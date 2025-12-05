/**
 * 串口测试工具页面
 * 
 * 功能：
 * 1. 列出所有可用串口
 * 2. 打开/关闭串口（支持多个串口同时打开）
 * 3. 配置串口参数（波特率、数据位、校验位等）
 * 4. 实时接收和显示数据
 * 5. 发送数据（HEX、ASCII、UTF-8格式）
 * 6. 多串口独立管理，互不干扰
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Usb,
  RefreshCw,
  Play,
  StopCircle,
  Send,
  Trash2,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

import {
  getSerialPorts,
  openSerialPort,
  closeSerialPort,
  sendSerialData,
  getSerialBuffer,
  getSerialStatus,
} from '@/api/serial'
import type {
  SerialPortInfo,
  OpenSerialRequest,
  SendDataRequest,
  ReceivedDataItem,
} from '@/types/serial'

/**
 * 串口配置表单Schema
 */
const serialConfigSchema = z.object({
  baudrate: z.coerce.number().min(1).max(1000000),
  bytesize: z.coerce.number().min(5).max(8),
  parity: z.enum(['N', 'E', 'O', 'M', 'S']),
  stopbits: z.coerce.number(),
  timeout: z.coerce.number().min(0.1).max(10.0),
})

type SerialConfigForm = z.infer<typeof serialConfigSchema>

/**
 * 已打开串口的状态
 */
interface OpenedPortState {
  port: string
  config: OpenSerialRequest
  receiveBuffer: ReceivedDataItem[]
  sendHistory: Array<{ data: string; timestamp: string; type: string }>
  autoScroll: boolean
  showTimestamp: boolean
  collapsed: boolean
}

/**
 * 串口测试工具页面组件
 */
export default function SerialPortPage() {
  const { t } = useTranslation('tools')
  const { t: tCommon } = useTranslation('common')
  const queryClient = useQueryClient()

  // 状态
  const [selectedPort, setSelectedPort] = useState<string>('')
  const [openedPorts, setOpenedPorts] = useState<Map<string, OpenedPortState>>(new Map())
  const [sendDataType, setSendDataType] = useState<'hex' | 'ascii' | 'utf8'>('hex')
  const [sendData, setSendData] = useState<string>('')

  // 接收数据区域的引用（用于自动滚动）
  const receiveRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  // 表单
  const form = useForm<SerialConfigForm>({
    resolver: zodResolver(serialConfigSchema),
    defaultValues: {
      baudrate: 9600,
      bytesize: 8,
      parity: 'N',
      stopbits: 1.0,
      timeout: 1.0,
    },
  })

  // 查询串口列表
  const {
    data: portsData,
    isLoading: portsLoading,
    refetch: refetchPorts,
  } = useQuery({
    queryKey: ['serial-ports'],
    queryFn: getSerialPorts,
  })

  // 🔄 页面加载时，从后端恢复已打开的串口状态
  useEffect(() => {
    const restoreOpenedPorts = async () => {
      try {
        const response = await getSerialStatus()
        if (response.success && response.data && response.data.length > 0) {
          // 恢复所有打开的串口
          const restoredPorts = new Map<string, OpenedPortState>()
          
          for (const status of response.data) {
            // 拉取离开期间累积的数据
            const bufferResponse = await getSerialBuffer({ port: status.port, clear: false })
            
            restoredPorts.set(status.port, {
              port: status.port,
              config: {
                port: status.port,
                baudrate: status.baudrate,
                bytesize: status.bytesize,
                parity: status.parity as 'N' | 'E' | 'O' | 'M' | 'S',
                stopbits: status.stopbits,
                timeout: status.timeout,
              },
              receiveBuffer: bufferResponse.success ? bufferResponse.data || [] : [],
              sendHistory: [],
              autoScroll: true,
              showTimestamp: true,
              collapsed: false,
            })
          }
          
          if (restoredPorts.size > 0) {
            setOpenedPorts(restoredPorts)
            toast.success(`已恢复 ${restoredPorts.size} 个串口连接`)
          }
        }
      } catch (error) {
        console.error('恢复串口状态失败:', error)
      }
    }
    
    restoreOpenedPorts()
  }, []) // 只在首次加载时执行

  // 打开串口Mutation
  const openMutation = useMutation({
    mutationFn: openSerialPort,
    onSuccess: (response, variables) => {
      if (response.success && response.code === 0) {
        toast.success(response.message)
        
        // 添加到已打开串口列表
        setOpenedPorts((prev) => {
          const next = new Map(prev)
          next.set(variables.port, {
            port: variables.port,
            config: variables,
            receiveBuffer: [],
            sendHistory: [],
            autoScroll: true,
            showTimestamp: true,
            collapsed: false,
          })
          return next
        })

        queryClient.invalidateQueries({ queryKey: ['serial-ports'] })
      } else {
        toast.error(response.message || t('serial.error.openFailed'))
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('serial.error.openFailed'))
    },
  })

  // 关闭串口Mutation
  const closeMutation = useMutation({
    mutationFn: closeSerialPort,
    onSuccess: (response, variables) => {
      if (response.success && response.code === 0) {
        toast.success(response.message)
        
        // 从已打开串口列表移除
        setOpenedPorts((prev) => {
          const next = new Map(prev)
          next.delete(variables.port)
          return next
        })

        queryClient.invalidateQueries({ queryKey: ['serial-ports'] })
      } else {
        toast.error(response.message || t('serial.error.closeFailed'))
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('serial.error.closeFailed'))
    },
  })

  // 发送数据Mutation
  const sendMutation = useMutation({
    mutationFn: sendSerialData,
    onSuccess: (response, variables) => {
      if (response.success && response.code === 0) {
        toast.success(response.message)
        
        // 添加到发送历史
        setOpenedPorts((prev) => {
          const next = new Map(prev)
          const portState = next.get(variables.port)
          if (portState) {
            portState.sendHistory.push({
              data: variables.data,
              timestamp: new Date().toISOString(),
              type: variables.data_type,
            })
            next.set(variables.port, portState)
          }
          return next
        })

        // 清空输入框
        setSendData('')
      } else {
        toast.error(response.message || t('serial.error.sendFailed'))
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('serial.error.sendFailed'))
    },
  })

  // 定时轮询接收数据
  useEffect(() => {
    if (openedPorts.size === 0) return

    const interval = setInterval(async () => {
      for (const [port] of openedPorts) {
        try {
          const response = await getSerialBuffer({ port, clear: false })
          if (response.success && response.data && response.data.length > 0) {
            setOpenedPorts((prev) => {
              const next = new Map(prev)
              const portState = next.get(port)
              if (portState) {
                // 只添加新数据
                const existingTimestamps = new Set(
                  portState.receiveBuffer.map((item) => item.timestamp)
                )
                const newItems = response.data!.filter(
                  (item) => !existingTimestamps.has(item.timestamp)
                )
                portState.receiveBuffer = [...portState.receiveBuffer, ...newItems]
                next.set(port, portState)
              }
              return next
            })
          }
        } catch (error) {
          console.error(`轮询串口 ${port} 失败:`, error)
        }
      }
    }, 500) // 每500ms轮询一次

    return () => clearInterval(interval)
  }, [openedPorts])

  // 自动滚动到底部
  useEffect(() => {
    for (const [port, state] of openedPorts) {
      if (state.autoScroll && state.receiveBuffer.length > 0) {
        const ref = receiveRefs.current.get(port)
        if (ref) {
          ref.scrollTop = ref.scrollHeight
        }
      }
    }
  }, [openedPorts])

  // 打开串口
  const handleOpenPort = (data: SerialConfigForm) => {
    if (!selectedPort) {
      toast.error(t('serial.error.portNotSelected'))
      return
    }

    const request: OpenSerialRequest = {
      port: selectedPort,
      baudrate: data.baudrate,
      bytesize: data.bytesize,
      parity: data.parity,
      stopbits: data.stopbits,
      timeout: data.timeout,
    }

    openMutation.mutate(request)
  }

  // 关闭串口
  const handleClosePort = (port: string) => {
    closeMutation.mutate({ port })
  }

  // 关闭所有串口
  const handleCloseAll = () => {
    for (const [port] of openedPorts) {
      closeMutation.mutate({ port })
    }
  }

  // 发送数据
  const handleSendData = (port: string) => {
    if (!sendData.trim()) {
      toast.error(t('serial.error.dataRequired'))
      return
    }

    const request: SendDataRequest = {
      port,
      data: sendData,
      data_type: sendDataType,
    }

    sendMutation.mutate(request)
  }

  // 清空接收缓冲
  const handleClearBuffer = useCallback((port: string) => {
    setOpenedPorts((prev) => {
      const next = new Map(prev)
      const portState = next.get(port)
      if (portState) {
        portState.receiveBuffer = []
        next.set(port, portState)
      }
      return next
    })
    toast.success(t('serial.success.bufferCleared'))
  }, [t])

  // 切换折叠状态
  const toggleCollapse = (port: string) => {
    setOpenedPorts((prev) => {
      const next = new Map(prev)
      const portState = next.get(port)
      if (portState) {
        portState.collapsed = !portState.collapsed
        next.set(port, portState)
      }
      return next
    })
  }

  // 格式化HEX数据显示
  const formatHexData = (hex: string) => {
    return hex.match(/.{1,2}/g)?.join(' ').toUpperCase() || hex
  }

  // 将HEX转为ASCII（仅显示可打印字符）
  const hexToAscii = (hex: string) => {
    const bytes = hex.match(/.{1,2}/g) || []
    return bytes
      .map((byte) => {
        const code = parseInt(byte, 16)
        return code >= 32 && code <= 126 ? String.fromCharCode(code) : '.'
      })
      .join('')
  }

  const ports = portsData?.data || []
  const availablePorts = ports.filter((p) => !p.is_opened)

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Usb className="h-5 w-5" />
          {t('serial.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('serial.description')}</p>
      </div>

      {/* 串口选择和配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('serial.portConfig')}</CardTitle>
              <CardDescription>
                {availablePorts.length > 0
                  ? t('serial.selectPort')
                  : t('serial.noPorts')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const result = await refetchPorts()
              if (result.data?.success) {
                toast.success(result.data.message || t('serial.success.listRetrieved'))
              }
            }}
            disabled={portsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${portsLoading ? 'animate-spin' : ''}`} />
            {t('serial.refreshPorts')}
          </Button>
          {openedPorts.size > 0 && (
            <Button variant="outline" size="sm" onClick={handleCloseAll}>
              <StopCircle className="h-4 w-4 mr-2" />
              {t('serial.closeAll')}
            </Button>
          )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {availablePorts.length === 0 ? (
            <Alert>
              <AlertDescription>{t('serial.noPortsDesc')}</AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleOpenPort)} className="space-y-4">
                {/* 串口选择 */}
                <div className="space-y-2">
                  <Label>{t('serial.selectPort')}</Label>
                  <Select value={selectedPort} onValueChange={setSelectedPort}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('serial.selectPort')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePorts.map((port) => (
                        <SelectItem key={port.port} value={port.port}>
                          {port.port} - {port.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 配置参数 */}
                <div className="grid grid-cols-5 gap-4">
                  <FormField
                    control={form.control}
                    name="baudrate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('serial.config.baudrate')}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[9600, 19200, 38400, 57600, 115200].map((rate) => (
                              <SelectItem key={rate} value={rate.toString()}>
                                {rate}
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
                    name="bytesize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('serial.config.bytesize')}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[5, 6, 7, 8].map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                {size}
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
                    name="parity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('serial.config.parity')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(['N', 'E', 'O', 'M', 'S'] as const).map((parity) => (
                              <SelectItem key={parity} value={parity}>
                                {t(`serial.parity.${parity}`)}
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
                    name="stopbits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('serial.config.stopbits')}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseFloat(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1.0, 1.5, 2.0].map((bits) => (
                              <SelectItem key={bits} value={bits.toString()}>
                                {bits}
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
                    name="timeout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('serial.config.timeout')} ({t('serial.config.timeoutUnit')})
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min={0.1}
                            max={10.0}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={!selectedPort || openMutation.isPending}>
                  <Play className="h-4 w-4 mr-2" />
                  {t('serial.openPort')}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* 已打开的串口列表 */}
      {openedPorts.size > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {t('serial.openedPorts')} ({openedPorts.size})
          </h2>

          {Array.from(openedPorts.entries()).map(([port, state]) => (
            <Card key={port} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{port}</CardTitle>
                    <Badge variant="default">{t('serial.status.opened')}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {state.config.baudrate} bps, {state.config.bytesize}
                      {t(`serial.parity.${state.config.parity}`).charAt(0)},
                      {state.config.stopbits}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCollapse(port)}
                    >
                      {state.collapsed ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleClosePort(port)}
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      {t('serial.closePort')}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!state.collapsed && (
                <CardContent className="space-y-4">
                  {/* 接收数据区域 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('serial.receiveData')}</Label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={state.showTimestamp}
                            onCheckedChange={(checked) => {
                              setOpenedPorts((prev) => {
                                const next = new Map(prev)
                                const portState = next.get(port)
                                if (portState) {
                                  portState.showTimestamp = checked
                                  next.set(port, portState)
                                }
                                return next
                              })
                            }}
                          />
                          <span className="text-sm">{t('serial.showTimestamp')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={state.autoScroll}
                            onCheckedChange={(checked) => {
                              setOpenedPorts((prev) => {
                                const next = new Map(prev)
                                const portState = next.get(port)
                                if (portState) {
                                  portState.autoScroll = checked
                                  next.set(port, portState)
                                }
                                return next
                              })
                            }}
                          />
                          <span className="text-sm">{t('serial.autoScroll')}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClearBuffer(port)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('serial.clearBuffer')}
                        </Button>
                      </div>
                    </div>
                    <div
                      ref={(el) => receiveRefs.current.set(port, el)}
                      className="h-64 overflow-y-auto bg-muted p-2 rounded font-mono text-sm"
                    >
                      {state.receiveBuffer.length === 0 ? (
                        <div className="text-muted-foreground text-center py-8">
                          {t('serial.noResult')}
                        </div>
                      ) : (
                        state.receiveBuffer.map((item, idx) => (
                          <div key={idx} className="py-1 hover:bg-background/50">
                            {state.showTimestamp && (
                              <span className="text-muted-foreground mr-2">
                                [{new Date(item.timestamp).toLocaleTimeString()}]
                              </span>
                            )}
                            <span className="text-primary">
                              HEX: {formatHexData(item.data)}
                            </span>
                            <span className="text-muted-foreground ml-4">
                              ASCII: {hexToAscii(item.data)}
                            </span>
                            <span className="text-muted-foreground ml-4">
                              ({item.length} {t('serial.stats.bytes')})
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* 发送数据区域 */}
                  <div className="space-y-2">
                    <Label>{t('serial.sendData')}</Label>
                    <div className="flex gap-2">
                      <Select
                        value={sendDataType}
                        onValueChange={(value: 'hex' | 'ascii' | 'utf8') =>
                          setSendDataType(value)
                        }
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hex">{t('serial.dataHex')}</SelectItem>
                          <SelectItem value="ascii">{t('serial.dataAscii')}</SelectItem>
                          <SelectItem value="utf8">{t('serial.dataUtf8')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder={t(`serial.${sendDataType}Placeholder`)}
                        value={sendData}
                        onChange={(e) => setSendData(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendData(port)
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleSendData(port)}
                        disabled={sendMutation.isPending}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {t('serial.send')}
                      </Button>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>
                      {t('serial.stats.received')}: {state.receiveBuffer.length}{' '}
                      {t('serial.stats.packets')}
                    </span>
                    <span>
                      {t('serial.stats.sent')}: {state.sendHistory.length}{' '}
                      {t('serial.stats.packets')}
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

