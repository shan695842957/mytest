/**
 * 移动端顶部导航栏
 */

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'
import { MENU_CONFIG, filterMenuByRole } from '@/config/menu'
import { useAuth } from '@/hooks/useAuth'
import { useMemo } from 'react'

export function MobileHeader() {
  const { t } = useTranslation('menu')
  const location = useLocation()
  const { hasAnyRole, user } = useAuth()
  const [open, setOpen] = useState(false)
  
  // 根据权限过滤菜单
  const filteredMenu = useMemo(
    () => filterMenuByRole(MENU_CONFIG, hasAnyRole),
    [hasAnyRole]
  )
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-14 items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
              {/* 头部 - Logo 和标题 */}
              <SidebarHeader>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton size="lg" asChild onClick={() => setOpen(false)}>
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
                                                        onClick={() => setOpen(false)}
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
                                          <SidebarMenuSubButton asChild isActive={isSubActive} onClick={() => setOpen(false)}>
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
                            <SidebarMenuButton asChild isActive={isActive} onClick={() => setOpen(false)}>
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
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex-1 text-center font-semibold">
          LCCU-V
        </div>
        
        <div className="w-9" /> {/* 占位，保持标题居中 */}
      </div>
    </header>
  )
}

