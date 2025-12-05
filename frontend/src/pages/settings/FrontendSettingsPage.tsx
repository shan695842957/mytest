/**
 * 前端设置页面
 * 包含主题、语言、外观等所有前端相关设置
 */

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/hooks/useTheme'
import { SUPPORTED_LOCALES, type LocaleKey } from '@/config/i18n'
import type { ThemeColor } from '@/config/theme'
import { Palette, Moon, Sun, Globe, CheckCircle2 } from 'lucide-react'

// 主题配色列表
const COLOR_THEMES = [
  { value: 'neutral', icon: '⚫' },
  { value: 'blue', icon: '💙' },
  { value: 'green', icon: '💚' },
  { value: 'purple', icon: '💜' },
  { value: 'yellow', icon: '💛' },
] as const

export default function FrontendSettingsPage() {
  const { t, i18n } = useTranslation('settings')
  const { mode, color, setMode, setColor } = useTheme()

  const changeLanguage = (locale: LocaleKey) => {
    i18n.changeLanguage(locale)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t('frontend.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('frontend.description')}
        </p>
      </div>

      {/* 主题配色 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t('frontend.theme.title')}</CardTitle>
              <CardDescription>
                {t('frontend.theme.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={color} onValueChange={(value) => setColor(value as ThemeColor)}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {COLOR_THEMES.map((theme) => (
                <label
                  key={theme.value}
                  htmlFor={theme.value}
                  className={`
                    relative flex cursor-pointer flex-col gap-3 rounded-lg border-2 p-4 
                    transition-all hover:border-primary/50 hover:shadow-md
                    ${color === theme.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{theme.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t(`frontend.theme.${theme.value}.name`)}</span>
                          {color === theme.value && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{t(`frontend.theme.${theme.value}.desc`)}</p>
                      </div>
                    </div>
                    <RadioGroupItem value={theme.value} id={theme.value} />
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 亮/暗模式 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {mode === 'dark' ? (
              <Moon className="h-5 w-5 text-primary" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
            <div>
              <CardTitle>{t('frontend.appearance.title')}</CardTitle>
              <CardDescription>
                {t('frontend.appearance.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as 'light' | 'dark')}>
            <div className="grid gap-4 md:grid-cols-2">
              <label
                htmlFor="light"
                className={`
                  relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 
                  transition-all hover:border-primary/50 hover:shadow-md
                  ${mode === 'light' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}
                `}
              >
                <Sun className="h-8 w-8 text-yellow-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t('frontend.appearance.light.title')}</span>
                    {mode === 'light' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('frontend.appearance.light.desc')}
                  </p>
                </div>
                <RadioGroupItem value="light" id="light" />
              </label>

              <label
                htmlFor="dark"
                className={`
                  relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 
                  transition-all hover:border-primary/50 hover:shadow-md
                  ${mode === 'dark' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}
                `}
              >
                <Moon className="h-8 w-8 text-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t('frontend.appearance.dark.title')}</span>
                    {mode === 'dark' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('frontend.appearance.dark.desc')}
                  </p>
                </div>
                <RadioGroupItem value="dark" id="dark" />
              </label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 语言设置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t('frontend.language.title')}</CardTitle>
              <CardDescription>
                {t('frontend.language.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LanguageSelector onChange={changeLanguage} />
        </CardContent>
      </Card>

      <Separator />

      {/* 当前设置预览 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('frontend.preview.title')}</CardTitle>
          <CardDescription>{t('frontend.preview.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentSettings />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 语言选择器组件
 */
function LanguageSelector({ onChange }: { onChange: (locale: LocaleKey) => void }) {
  const { t, i18n } = useTranslation('settings')

  return (
    <RadioGroup value={i18n.language} onValueChange={(value) => onChange(value as LocaleKey)}>
            <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(SUPPORTED_LOCALES).map(([key, _label]) => (
                <label
                  key={key}
                  htmlFor={`lang-${key}`}
                  className={`
                    relative flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 
                    transition-all hover:border-primary/50 hover:shadow-md
                    ${i18n.language === key ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}
                  `}
                >
                  <span className="text-2xl">{key === 'zh-CN' ? '🇨🇳' : '🇺🇸'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                <span className="font-semibold">{t(`frontend.language.${key}.name`)}</span>
                      {i18n.language === key && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                {t(`frontend.language.${key}.desc`)}
                    </p>
                  </div>
                  <RadioGroupItem value={key} id={`lang-${key}`} />
                </label>
              ))}
            </div>
          </RadioGroup>
  )
}

/**
 * 当前设置预览组件
 */
function CurrentSettings() {
  const { t, i18n } = useTranslation('settings')
  const { mode, color } = useTheme()

  const currentTheme = COLOR_THEMES.find(theme => theme.value === color)
  
  return (
          <div className="grid gap-4 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-muted-foreground">{t('frontend.preview.themeColor')}</span>
              <span className="font-medium">
          {currentTheme?.icon}{' '}
          {t(`frontend.theme.${color}.name`)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-muted-foreground">{t('frontend.preview.appearanceMode')}</span>
              <span className="font-medium">
          {mode === 'dark' ? '🌙 ' + t('frontend.appearance.dark.title') : '☀️ ' + t('frontend.appearance.light.title')}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
        <span className="text-muted-foreground">{t('frontend.preview.interfaceLanguage')}</span>
              <span className="font-medium">
          {i18n.language === 'zh-CN' ? '🇨🇳 ' + t('frontend.language.zh-CN.name') : '🇺🇸 ' + t('frontend.language.en-US.name')}
              </span>
            </div>
    </div>
  )
}
