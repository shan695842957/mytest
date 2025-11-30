/**
 * 主题测试页面
 * 用于验证所有主题颜色是否正常工作
 */

import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Moon, Sun } from 'lucide-react'

export default function ThemeTestPage() {
  const { mode, color, toggleMode, setColor } = useTheme()
  
  const colorBlocks = [
    { name: 'background', label: '背景色' },
    { name: 'foreground', label: '前景色' },
    { name: 'card', label: '卡片背景' },
    { name: 'card-foreground', label: '卡片文字' },
    { name: 'primary', label: '主色调' },
    { name: 'primary-foreground', label: '主色调文字' },
    { name: 'secondary', label: '次要色' },
    { name: 'secondary-foreground', label: '次要色文字' },
    { name: 'muted', label: '柔和色' },
    { name: 'muted-foreground', label: '柔和色文字' },
    { name: 'accent', label: '强调色' },
    { name: 'accent-foreground', label: '强调色文字' },
    { name: 'destructive', label: '危险色' },
    { name: 'destructive-foreground', label: '危险色文字' },
    { name: 'border', label: '边框' },
    { name: 'input', label: '输入框边框' },
    { name: 'ring', label: '聚焦环' },
  ]
  
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 标题和控制区 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">主题测试页面</h1>
              <p className="text-muted-foreground mt-2">
                当前主题: <Badge>{color}</Badge> | 当前模式: <Badge>{mode}</Badge>
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={toggleMode}>
                {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* 主题切换按钮 - 5个经典配色 */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={color === 'neutral' ? 'default' : 'outline'}
              onClick={() => setColor('neutral')}
            >
              ⚫ 中性经典（默认）⭐
            </Button>
            <Button
              variant={color === 'blue' ? 'default' : 'outline'}
              onClick={() => setColor('blue')}
            >
              💙 蓝色专业
            </Button>
            <Button
              variant={color === 'green' ? 'default' : 'outline'}
              onClick={() => setColor('green')}
            >
              💚 绿色自然
            </Button>
            <Button
              variant={color === 'purple' ? 'default' : 'outline'}
              onClick={() => setColor('purple')}
            >
              💜 紫色优雅
            </Button>
            <Button
              variant={color === 'yellow' ? 'default' : 'outline'}
              onClick={() => setColor('yellow')}
            >
              💛 黄色温暖
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* CSS 变量颜色块展示 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">CSS 变量颜色展示</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colorBlocks.map(({ name, label }) => (
              <Card key={name}>
                <CardContent className="p-4">
                  <div
                    className="w-full h-20 rounded-lg mb-3 border-2"
                    style={{ backgroundColor: `var(--${name})` }}
                  />
                  <p className="font-mono text-xs text-muted-foreground mb-1">--{name}</p>
                  <p className="text-sm font-medium">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* 组件示例 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">组件示例</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 按钮示例 */}
            <Card>
              <CardHeader>
                <CardTitle>按钮组件</CardTitle>
                <CardDescription>所有按钮变体</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* 输入框示例 */}
            <Card>
              <CardHeader>
                <CardTitle>表单组件</CardTitle>
                <CardDescription>输入框和标签</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="普通输入框" />
                <Input placeholder="禁用状态" disabled />
                <Input placeholder="带图标的输入框" className="pl-10" />
              </CardContent>
            </Card>
            
            {/* 卡片示例 */}
            <Card>
              <CardHeader>
                <CardTitle>卡片组件</CardTitle>
                <CardDescription>这是一个标准卡片</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  卡片内容区域，使用 --card 背景色和 --card-foreground 文字色
                </p>
              </CardContent>
            </Card>
            
            {/* 徽章示例 */}
            <Card>
              <CardHeader>
                <CardTitle>徽章组件</CardTitle>
                <CardDescription>各种徽章变体</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <Separator />
        
        {/* 文字颜色示例 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">文字颜色</h2>
          <Card>
            <CardContent className="p-6 space-y-3">
              <p className="text-foreground">正文颜色 (text-foreground)</p>
              <p className="text-muted-foreground">次要文字 (text-muted-foreground)</p>
              <p className="text-primary">主色调文字 (text-primary)</p>
              <p className="text-destructive">危险色文字 (text-destructive)</p>
            </CardContent>
          </Card>
        </div>
        
        <Separator />
        
        {/* 背景颜色示例 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">背景颜色</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background border p-6 rounded-lg">
              <p className="font-medium mb-2">背景色</p>
              <p className="text-sm text-muted-foreground">bg-background</p>
            </div>
            <div className="bg-card border p-6 rounded-lg">
              <p className="font-medium mb-2">卡片背景</p>
              <p className="text-sm text-muted-foreground">bg-card</p>
            </div>
            <div className="bg-muted border p-6 rounded-lg">
              <p className="font-medium mb-2">柔和背景</p>
              <p className="text-sm text-muted-foreground">bg-muted</p>
            </div>
            <div className="bg-accent border p-6 rounded-lg">
              <p className="font-medium mb-2">强调背景</p>
              <p className="text-sm text-muted-foreground">bg-accent</p>
            </div>
          </div>
        </div>
        
        {/* 说明 */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-2">🎨 主题说明</h3>
            <div className="text-sm opacity-90 space-y-2">
              <p>
                <strong>科技蓝（默认）⭐</strong> - 活泼的蓝色科技风格，高对比度，按钮清晰可见
              </p>
              <p>
                <strong>蓝灰色（Slate）</strong> - 带蓝色调的灰色，冷静专业
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

