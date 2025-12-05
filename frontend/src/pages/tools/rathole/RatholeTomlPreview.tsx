/**
 * Rathole TOML 预览组件
 */

import { useTranslation } from 'react-i18next'
import { RefreshCw, Download, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { downloadToml } from '@/api/rathole'

interface Props {
  tomlContent: string
  onRefreshToml: () => void
}

export function RatholeTomlPreview({ tomlContent, onRefreshToml }: Props) {
  const { t } = useTranslation(['tools', 'common'])

  // 复制到剪贴板
  const handleCopyToml = () => {
    if (tomlContent) {
      navigator.clipboard.writeText(tomlContent)
      toast.success(t('rathole.copiedToClipboard'))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <span>{t('rathole.tomlContent')}</span>
          {/* 移动端：按钮纵向排列，桌面端：横向排列 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyToml} className="w-full sm:w-auto">
              <Copy className="mr-2 h-4 w-4" />
              {t('rathole.copy')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadToml()} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              {t('rathole.download')}
            </Button>
            <Button variant="outline" size="sm" onClick={onRefreshToml} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 md:mr-0" />
              <span className="ml-2 sm:hidden">{t('common:action.refresh')}</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea 
          value={tomlContent} 
          readOnly 
          className="font-mono text-sm min-h-[300px] md:min-h-[500px]" 
        />
      </CardContent>
    </Card>
  )
}
