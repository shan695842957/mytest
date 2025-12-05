"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "@/hooks/useTheme"
import { useEffect, useState } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { mode } = useTheme()
  const [theme, setTheme] = useState<ToasterProps["theme"]>("system")

  // 同步主题模式到 Sonner
  useEffect(() => {
    setTheme(mode === "dark" ? "dark" : "light")
  }, [mode])

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      // 移动端：通过 CSS 自动添加底部偏移，避免被底部导航栏遮挡
      // 桌面端：保持默认位置
      position="bottom-center"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
