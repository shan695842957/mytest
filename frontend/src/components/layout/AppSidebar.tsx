/**
 * 应用侧边栏
 * 使用 shadcn/ui Sidebar 组件，支持折叠和响应式
 */

import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { MENU_CONFIG, filterMenuByRole } from '@/config/menu'
import { useAuth } from '@/hooks/useAuth'

export function AppSidebar() {
  const { t } = useTranslation('menu')
  const location = useLocation()
  const { hasAnyRole, user } = useAuth()
  const { open, toggleSidebar } = useSidebar()
  
  // 根据权限过滤菜单
  const filteredMenu = useMemo(
    () => filterMenuByRole(MENU_CONFIG, hasAnyRole),
    [hasAnyRole]
  )
  
  return (
    <Sidebar collapsible="icon">
      {/* 折叠按钮 - 中间边缘位置，高对比度设计 */}
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-50">
        <Button
          variant="default"
          size="icon"
          className="sidebar-collapse-button h-8 w-8 rounded-full shadow-xl border-2 transition-all duration-300 hover:scale-110 hover:shadow-2xl"
          onClick={toggleSidebar}
        >
          {open ? (
            <PanelLeftClose className="size-4 stroke-[2.5]" />
          ) : (
            <PanelLeftOpen className="size-4 stroke-[2.5]" />
          )}
        </Button>
      </div>
      {/* 头部 - Logo 和标题 */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <img src={logoSvg} alt="LCCU-V Logo" className="size-8" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-foreground">
                    {t('common:app.name')}
                  </span>
                  <span className="text-xs text-muted-foreground">v0.3.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      {/* 内容 - 菜单 */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('mainMenu')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenu.map((item) => {
                const isActive = location.pathname === item.path
                
                // 有子菜单的项
                if (item.children && item.children.length > 0) {
                  return (
                    <Collapsible key={item.key} defaultOpen={isActive}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            {item.icon}
                            <span className="whitespace-nowrap">{t(item.label)}</span>
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((subItem) => {
                              const isSubActive = location.pathname === subItem.path || 
                                                  location.pathname.startsWith(subItem.path + '/')
                              
                              // 三级菜单
                              if (subItem.children && subItem.children.length > 0) {
                                return (
                                  <Collapsible key={subItem.key} defaultOpen={isSubActive}>
                                    <SidebarMenuSubItem>
                                      <CollapsibleTrigger asChild>
                                        <SidebarMenuSubButton>
                                          {subItem.icon}
                                          <span className="whitespace-nowrap">{t(subItem.label)}</span>
                                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]:rotate-90" />
                                        </SidebarMenuSubButton>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <SidebarMenuSub>
                                          {subItem.children.map((thirdItem) => (
                                            <SidebarMenuSubItem key={thirdItem.key}>
                                              <SidebarMenuSubButton 
                                                asChild 
                                                isActive={location.pathname === thirdItem.path}
                                              >
                                                <Link to={thirdItem.path || '#'}>
                                                  {thirdItem.icon}
                                                  <span className="whitespace-nowrap" title={t(thirdItem.label)}>
                                                    {t(thirdItem.label)}
                                                  </span>
                                                </Link>
                                              </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                          ))}
                                        </SidebarMenuSub>
                                      </CollapsibleContent>
                                    </SidebarMenuSubItem>
                                  </Collapsible>
                                )
                              }
                              
                              // 二级菜单
                              return (
                                <SidebarMenuSubItem key={subItem.key}>
                                  <SidebarMenuSubButton asChild isActive={isSubActive}>
                                    <Link to={subItem.path || '#'}>
                                      {subItem.icon}
                                      <span className="whitespace-nowrap">{t(subItem.label)}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              )
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }
                
                // 普通菜单项
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.path || '#'}>
                        {item.icon}
                        <span className="whitespace-nowrap">{t(item.label)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      {/* 底部 - 用户信息 */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div 
                className="flex aspect-square size-8 items-center justify-center rounded-lg shadow-md text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)',
                  color: 'white',
                }}
              >
                {user?.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">{user?.username}</span>
                <span className="text-xs text-muted-foreground">
                  {t(`auth:role.${user?.role}`)}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      {/* SidebarRail - 折叠时的展开触发区域 */}
      <SidebarRail />
    </Sidebar>
  )
}

