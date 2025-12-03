/**
 * 路由配置
 */

import type { RouteObject } from 'react-router-dom'
import { UserRole } from '@/types'

// 懒加载页面
import { lazy } from 'react'

// 布局
const MainLayout = lazy(() => import('@/components/layout/MainLayout'))

// 页面
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const UserListPage = lazy(() => import('@/pages/users/UserListPage'))
const AuditLogListPage = lazy(() => import('@/pages/audit/AuditLogListPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const GatewayMonitorPage = lazy(() => import('@/pages/settings/GatewayMonitorPage'))
const GatewayHistoryPage = lazy(() => import('@/pages/settings/GatewayHistoryPage'))
const SoftwareConfigPage = lazy(() => import('@/pages/settings/SoftwareConfigPage'))
const GatewayNetworkPage = lazy(() => import('@/pages/settings/GatewayNetworkPage'))
const GatewayTimePage = lazy(() => import('@/pages/settings/GatewayTimePage'))
const GatewayInfoPage = lazy(() => import('@/pages/settings/GatewayInfoPage'))
const GatewaySSHPage = lazy(() => import('@/pages/settings/GatewaySSHPage'))
const SoftwareServicePage = lazy(() => import('@/pages/settings/SoftwareServicePage'))
const SoftwareAPIPage = lazy(() => import('@/pages/settings/SoftwareAPIPage'))
const SoftwareDatabasePage = lazy(() => import('@/pages/settings/SoftwareDatabasePage'))
const FrontendSettingsPage = lazy(() => import('@/pages/settings/FrontendSettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage'))
const ForbiddenPage = lazy(() => import('@/pages/errors/ForbiddenPage'))

// 系统工具页面
const ToolsPingPage = lazy(() => import('@/pages/tools/ToolsPingPage'))
const PortScanPage = lazy(() => import('@/pages/tools/PortScanPage'))
const ARPTablePage = lazy(() => import('@/pages/tools/ARPTablePage'))
const TraceroutePage = lazy(() => import('@/pages/tools/TraceroutePage'))
const NetworkCapturePage = lazy(() => import('@/pages/tools/NetworkCapturePage'))
const SerialPortPage = lazy(() => import('@/pages/tools/SerialPortPage'))
const PortForwardingPage = lazy(() => import('@/pages/tools/PortForwardingPage'))
const RatholePage = lazy(() => import('@/pages/tools/rathole'))

// 配置系统页面
const DeviceTemplatesPage = lazy(() => import('@/pages/config/DeviceTemplatesPage'))
const DeviceTemplateDetailPage = lazy(() => import('@/pages/config/DeviceTemplateDetailPage'))
const CommTemplatesPage = lazy(() => import('@/pages/config/CommTemplatesPage'))
const CommTemplateDetailPage = lazy(() => import('@/pages/config/CommTemplateDetailPage'))
const CommInstancesPage = lazy(() => import('@/pages/config/CommInstancesPage'))
const ProtocolTypesPage = lazy(() => import('@/pages/config/ProtocolTypesPage'))
const PeripheralsPage = lazy(() => import('@/pages/config/PeripheralsPage'))
const AssetsPage = lazy(() => import('@/pages/config/AssetsPage'))
const MappingsPage = lazy(() => import('@/pages/config/MappingsPage'))

// SOE 查询页面
const SOEPage = lazy(() => import('@/pages/soe/SOEPage'))

// 光字牌页面
const LightPanelPage = lazy(() => import('@/pages/lightPanel/LightPanelPage'))

// 测试页面
const LightPanelTestPage = lazy(() => import('@/pages/test/LightPanelTestPage'))
const HistoryTestPage = lazy(() => import('@/pages/test/HistoryTestPage'))
const BMSLevel2Page = lazy(() => import('@/pages/test/BMSLevel2Page'))
const BMSLevel3Page = lazy(() => import('@/pages/test/BMSLevel3Page'))


// 路由守卫
import { ProtectedRoute } from '@/components/auth'

/**
 * 路由配置
 */
export const routes: RouteObject[] = [
  // 登录页
  {
    path: '/login',
    element: <LoginPage />,
  },
  
  // 受保护的路由
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'users',
            element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
            children: [
              {
                index: true,
                element: <UserListPage />,
              },
            ],
          },
          {
            path: 'audit',
            element: <AuditLogListPage />, // 所有登录用户都能访问（后端会限制权限）
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'settings',
            children: [
              {
                path: 'gateway',
                children: [
                  {
                    path: 'monitor',
                    element: <GatewayMonitorPage />,
                  },
                  {
                    path: 'history',
                    element: <GatewayHistoryPage />,
                  },
                  {
                    path: 'network',
                    element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                    children: [
                      {
                        index: true,
                        element: <GatewayNetworkPage />,
                      },
                    ],
                  },
                  {
                    path: 'time',
                    element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                    children: [
                      {
                        index: true,
                        element: <GatewayTimePage />,
                      },
                    ],
                  },
                  {
                    path: 'info',
                    element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                    children: [
                      {
                        index: true,
                        element: <GatewayInfoPage />,
                      },
                    ],
                  },
                  {
                    path: 'ssh',
                    element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                    children: [
                      {
                        index: true,
                        element: <GatewaySSHPage />,
                      },
                    ],
                  },
                ],
              },
              {
                path: 'software',
                children: [
                  {
                    path: 'service',
                    element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                    children: [
                      {
                        index: true,
                        element: <SoftwareServicePage />,
                      },
                    ],
                  },
                  {
                    path: 'api',
                    element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                    children: [
                      {
                        index: true,
                        element: <SoftwareAPIPage />,
                      },
                    ],
                  },
                  {
                    path: 'database',
                    element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                    children: [
                      {
                        index: true,
                        element: <SoftwareDatabasePage />,
                      },
                    ],
                  },
                  {
                    path: 'config-center',
                    element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                    children: [
                      {
                        index: true,
                        element: <SoftwareConfigPage />,
                      },
                    ],
                  },
                ],
              },
              {
                path: 'frontend',
                element: <FrontendSettingsPage />, // 所有用户都可以访问
              },
            ],
          },
          {
            path: 'tools',
            children: [
              {
                path: 'ping',
                element: <ToolsPingPage />, // 所有角色可访问
              },
              {
                path: 'port-scan',
                element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                children: [
                  {
                    index: true,
                    element: <PortScanPage />,
                  },
                ],
              },
              {
                path: 'arp',
                element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                children: [
                  {
                    index: true,
                    element: <ARPTablePage />,
                  },
                ],
              },
              {
                path: 'traceroute',
                element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                children: [
                  {
                    index: true,
                    element: <TraceroutePage />,
                  },
                ],
              },
              {
                path: 'network-capture',
                element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                children: [
                  {
                    index: true,
                    element: <NetworkCapturePage />,
                  },
                ],
              },
              {
                path: 'serial',
                element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                children: [
                  {
                    index: true,
                    element: <SerialPortPage />,
                  },
                ],
              },
              {
                path: 'port-forwarding',
                element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                children: [
                  {
                    index: true,
                    element: <PortForwardingPage />,
                  },
                ],
              },
              {
                path: 'rathole',
                element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
                children: [
                  {
                    index: true,
                    element: <RatholePage />,
                  },
                ],
              },
            ],
          },
          {
            path: 'config',
            element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
            children: [
              {
                path: 'device-templates',
                children: [
                  {
                    index: true,
                    element: <DeviceTemplatesPage />,
                  },
                  {
                    path: ':id',
                    element: <DeviceTemplateDetailPage />,
                  },
                ],
              },
              {
                path: 'comm-templates',
                children: [
                  {
                    index: true,
                    element: <CommTemplatesPage />,
                  },
                  {
                    path: ':id',
                    element: <CommTemplateDetailPage />,
                  },
                ],
              },
              {
                path: 'comm-instances',
                element: <CommInstancesPage />,
              },
              {
                path: 'protocol-types',
                element: <ProtocolTypesPage />,
              },
              {
                path: 'peripherals',
                element: <PeripheralsPage />,
              },
              {
                path: 'assets',
                element: <AssetsPage />,
              },
              {
                path: 'assets/:id/mappings',
                element: <MappingsPage />,
              },
            ],
          },
          {
            path: 'soe',
            element: <ProtectedRoute roles={[UserRole.DEVELOPER, UserRole.OPERATOR]} />,
            children: [
              {
                index: true,
                element: <SOEPage />,
              },
            ],
          },
          {
            path: 'light-panel',
            element: <LightPanelPage />,
          },
          {
            path: 'test',
            children: [
              {
                path: 'light-panel',
                element: <LightPanelTestPage />,
              },
              {
                path: 'history',
                element: <HistoryTestPage />,
              },
              {
                path: 'bms-level2',
                element: <BMSLevel2Page />,
              },
              {
                path: 'bms-level3',
                element: <BMSLevel3Page />,
              },
            ],
          },
        ],
      },
    ],
  },
  
  // 错误页面
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
