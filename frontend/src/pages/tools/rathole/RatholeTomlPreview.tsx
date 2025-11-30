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
        <CardTitle className="flex items-center justify-between">
          <span>{t('rathole.tomlContent')}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyToml}>
              <Copy className="mr-2 h-4 w-4" />
              {t('rathole.copy')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadToml()}>
              <Download className="mr-2 h-4 w-4" />
              {t('rathole.download')}
            </Button>
            <Button variant="outline" size="sm" onClick={onRefreshToml}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea value={tomlContent} readOnly className="font-mono text-sm min-h-[500px]" />
      </CardContent>
    </Card>
  )
}
