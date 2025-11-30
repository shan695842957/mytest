/**
 * Rathole 全局配置组件
 */

import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'

const configSchema = z.object({
  remote_host: z.string().min(1, '请输入远程服务器主机'),
  remote_port: z.string().optional(),
})

type ConfigFormValues = z.infer<typeof configSchema>

interface Props {
  remoteAddr: string
  onUpdate: (config: { remote_addr: string }) => void
  isUpdating: boolean
}

export function RatholeGlobalConfig({ remoteAddr, onUpdate, isUpdating }: Props) {
  const { t } = useTranslation(['tools', 'common'])

  // 解析 remote_addr 为 host:port
  const [remoteHost, remotePort] = remoteAddr.split(':')

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      remote_host: remoteHost || '',
      remote_port: remotePort || '',
    },
  })

  const handleSubmit = (values: ConfigFormValues) => {
    // 组合 host:port
    const remote_addr = values.remote_port
      ? `${values.remote_host}:${values.remote_port}`
      : values.remote_host
    onUpdate({ remote_addr })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('rathole.globalConfig')}</CardTitle>
        <CardDescription>{t('rathole.globalConfigDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* 远程服务器地址 */}
            <FormItem>
              <FormLabel>{t('rathole.remoteAddr')}</FormLabel>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="remote_host"
                  render={({ field }) => (
                    <FormControl>
                      <Input {...field} placeholder="mg.relectric.cn" className="w-64" />
                    </FormControl>
                  )}
                />
                <span className="text-muted-foreground">:</span>
                <FormField
                  control={form.control}
                  name="remote_port"
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="26667"
                        className="w-24"
                      />
                    </FormControl>
                  )}
                />
              </div>
              <FormDescription>{t('rathole.remoteAddrDescription')}</FormDescription>
              <FormMessage />
            </FormItem>

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {t('common:action.save')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

