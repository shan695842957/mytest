/**
 * 菜单配置
 */

import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  User,
  Network,
  Palette,
  Server,
  Cable,
  Router,
  Layers,
  Activity,
  LineChart,
  Settings2,
  Clock,
  Info,
  Cog,
  Shield,
  Wrench,
  Search,
  Route,
  PackageSearch,
  Usb,
  ArrowRightLeft,
  Globe2,
  HardDrive,
  Link2,
  Table,
  ListChecks,
  Database,
  Cpu,
  Radio,
  Building2,
  GitBranch,
  AlertCircle,
  Zap,
  Battery,
} from 'lucide-react'
import type { MenuItem } from '@/types'
import { UserRole } from '@/types'

/**
 * 菜单配置（根据角色动态过滤）
 */
export const MENU_CONFIG: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'dashboard',
    icon: <LayoutDashboard className="size-4" />,
    path: '/dashboard',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
  },
  {
    key: 'users',
    label: 'users',
    icon: <Users className="size-4" />,
    path: '/users',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
  },
  {
    key: 'audit',
    label: 'audit',
    icon: <FileText className="size-4" />,
    path: '/audit',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER], // 所有角色都能查看
  },
  {
    key: 'settings',
    label: 'settings',
    icon: <Settings className="size-4" />,
    path: '/settings',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER], // 所有角色可见，由子菜单控制权限
    children: [
      {
        key: 'gateway-settings',
        label: 'gateway_settings',
        icon: <Network className="size-4" />,
        path: '/settings/gateway',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        children: [
          {
            key: 'gateway-monitor',
            label: 'gateway_monitor',
            icon: <Activity className="size-4" />,
            path: '/settings/gateway/monitor',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
          {
            key: 'gateway-history',
            label: 'gateway_history',
            icon: <LineChart className="size-4" />,
            path: '/settings/gateway/history',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
          },
          {
            key: 'gateway-network',
            label: 'gateway_network',
            icon: <Network className="size-4" />,
            path: '/settings/gateway/network',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
          {
            key: 'gateway-time',
            label: 'gateway_time',
            icon: <Clock className="size-4" />,
            path: '/settings/gateway/time',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
          {
            key: 'gateway-info',
            label: 'gateway_info',
            icon: <Info className="size-4" />,
            path: '/settings/gateway/info',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
          {
            key: 'gateway-ssh',
            label: 'gateway_ssh',
            icon: <Shield className="size-4" />,
            path: '/settings/gateway/ssh',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
        ],
      },
      {
        key: 'software-settings',
        label: 'software_settings',
        icon: <Cog className="size-4" />,
        path: '/settings/software',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        children: [
          {
            key: 'software-service',
            label: 'software_service',
            icon: <Server className="size-4" />,
            path: '/settings/software/service',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
          {
            key: 'software-api',
            label: 'software_api',
            icon: <Shield className="size-4" />,
            path: '/settings/software/api',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
          {
            key: 'software-database',
            label: 'software_database',
            icon: <Server className="size-4" />,
            path: '/settings/software/database',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
          {
            key: 'software-config-center',
            label: 'software_config_center',
            icon: <Settings2 className="size-4" />,
            path: '/settings/software/config-center',
            roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
          },
        ],
      },
      {
        key: 'frontend-settings',
        label: 'frontend_settings',
        icon: <Palette className="size-4" />,
        path: '/settings/frontend',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
      },
    ],
  },
  {
    key: 'tools',
    label: 'tools',
    icon: <Wrench className="size-4" />,
    path: '/tools',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
    children: [
      {
        key: 'tools-ping',
        label: 'ping',
        icon: <Network className="size-4" />,
        path: '/tools/ping',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
      },
      {
        key: 'tools-port-scan',
        label: 'port_scan',
        icon: <Search className="size-4" />,
        path: '/tools/port-scan',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'tools-arp',
        label: 'arp_table',
        icon: <Network className="size-4" />,
        path: '/tools/arp',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'tools-traceroute',
        label: 'traceroute',
        icon: <Route className="size-4" />,
        path: '/tools/traceroute',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'tools-network-capture',
        label: 'network_capture',
        icon: <PackageSearch className="size-4" />,
        path: '/tools/network-capture',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'tools-serial',
        label: 'serial_port',
        icon: <Usb className="size-4" />,
        path: '/tools/serial',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'tools-port-forwarding',
        label: 'port_forwarding',
        icon: <ArrowRightLeft className="size-4" />,
        path: '/tools/port-forwarding',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'tools-rathole',
        label: 'rathole',
        icon: <Globe2 className="size-4" />,
        path: '/tools/rathole',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
    ],
  },
  {
    key: 'config',
    label: 'config',
    icon: <Database className="size-4" />,
    path: '/config',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    children: [
      {
        key: 'config-device-templates',
        label: 'device_templates',
        icon: <Cpu className="size-4" />,
        path: '/config/device-templates',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'config-comm-templates',
        label: 'comm_templates',
        icon: <Radio className="size-4" />,
        path: '/config/comm-templates',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'config-comm-instances',
        label: 'comm_instances',
        icon: <Cable className="size-4" />,
        path: '/config/comm-instances',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'config-protocol-types',
        label: 'protocol_types',
        icon: <Settings2 className="size-4" />,
        path: '/config/protocol-types',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'config-peripherals',
        label: 'peripherals',
        icon: <Cpu className="size-4" />,
        path: '/config/peripherals',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
      {
        key: 'config-assets',
        label: 'assets',
        icon: <Building2 className="size-4" />,
        path: '/config/assets',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
      },
    ],
  },
  {
    key: 'soe',
    label: 'soe',
    icon: <AlertCircle className="size-4" />,
    path: '/soe',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
  },
  {
    key: 'light-panel',
    label: 'light_panel',
    icon: <Activity className="size-4" />,
    path: '/light-panel',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
  },
  {
    key: 'test-panel',
    label: 'test_panel',
    icon: <Activity className="size-4" />,
    path: '/test',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
    children: [
      {
        key: 'test-light-panel',
        label: 'test_light_panel',
        icon: <Activity className="size-4" />,
        path: '/test/light-panel',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
      },
      {
        key: 'test-history',
        label: 'test_history',
        icon: <LineChart className="size-4" />,
        path: '/test/history',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
      },
      {
        key: 'test-pcs',
        label: 'test_pcs',
        icon: <Zap className="size-4" />,
        path: '/test/pcs',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
      },
      {
        key: 'test-bms-level2',
        label: 'test_bms_level2',
        icon: <Battery className="size-4" />,
        path: '/test/bms-level2',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
      },
      {
        key: 'test-bms-level3',
        label: 'test_bms_level3',
        icon: <Battery className="size-4" />,
        path: '/test/bms-level3',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
      },
      {
        key: 'test-bms-new',
        label: 'test_bms_new',
        icon: <Battery className="size-4" />,
        path: '/test/bms-new',
        roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
      },
    ],
  },
  {
    key: 'profile',
    label: 'profile',
    icon: <User className="size-4" />,
    path: '/profile',
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
  },
]

/**
 * 根据角色过滤菜单
 */
export function filterMenuByRole(
  menu: MenuItem[],
  hasAnyRole: (roles: UserRole[]) => boolean
): MenuItem[] {
  return menu
    .filter(item => !item.roles || hasAnyRole(item.roles))
    .map(item => ({
      ...item,
      children: item.children
        ? filterMenuByRole(item.children, hasAnyRole)
        : undefined,
    }))
    .filter(item => !item.children || item.children.length > 0)
}
