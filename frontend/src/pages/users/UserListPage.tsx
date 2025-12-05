/**
 * 用户列表页面 - 完整CRUD功能
 * 移动端优化：使用 MaterialListItem 卡片列表
 * 桌面端：保持表格视图
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, MoreHorizontal, Edit, Trash2, Key, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MaterialListItem } from '@/components/common/MaterialListItem'
import { AuthGuard } from '@/components/auth'
import { UserFormDialog } from '@/components/users/UserFormDialog'
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog'
import { ChangePasswordDialog } from '@/components/users/ChangePasswordDialog'
import { useUserTableColumns } from '@/components/users/UserTableColumns'
import { useUserList } from '@/hooks/useUserQueries'
import { useAuth } from '@/hooks/useAuth'
import { PermissionChecker } from '@/utils/permission'
import { formatDateTime } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { User, UserRole, UserListParams } from '@/types'
import { UserRole as UserRoleEnum } from '@/types'

export default function UserListPage() {
  const { t: tAuth } = useTranslation('auth')
  const { t } = useTranslation('user')
  const { user: currentUser } = useAuth()
  
  // 查询参数
  const [params, setParams] = useState<UserListParams>({
    skip: 0,
    limit: 10,
  })
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // 获取用户列表
  const { data, isLoading, refetch } = useUserList(params)
  
  // 表格列配置
  const columns = useUserTableColumns({
    onEdit: (user) => {
      setSelectedUser(user)
      setFormDialogOpen(true)
    },
    onDelete: (user) => {
      setSelectedUser(user)
      setDeleteDialogOpen(true)
    },
    onChangePassword: (user) => {
      setSelectedUser(user)
      setPasswordDialogOpen(true)
    },
    currentUser,
  })
  
  // 搜索
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, skip: 0 }))
  }
  
  // 角色筛选
  const handleRoleFilter = (role: string) => {
    setParams(prev => ({
      ...prev,
      role: role === 'all' ? undefined : (role as UserRole),
      skip: 0,
    }))
  }
  
  // 状态筛选
  const handleStatusFilter = (status: string) => {
    setParams(prev => ({
      ...prev,
      is_active: status === 'all' ? undefined : status === 'active',
      skip: 0,
    }))
  }
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          {tAuth('user.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('list.filter.description')}
        </p>
      </div>
      
      {/* 用户列表表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{tAuth('user.title')}</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('list.filter.searchPlaceholder')}
                className="pl-10 w-[200px]"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select onValueChange={handleRoleFilter} defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('list.filter.role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('list.filter.allRoles')}</SelectItem>
                <SelectItem value={UserRoleEnum.DEVELOPER}>{tAuth('role.developer')}</SelectItem>
                <SelectItem value={UserRoleEnum.OPERATOR}>{tAuth('role.operator')}</SelectItem>
                <SelectItem value={UserRoleEnum.USER}>{tAuth('role.user')}</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={handleStatusFilter} defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('list.filter.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('list.filter.allStatus')}</SelectItem>
                <SelectItem value="active">{tAuth('user.active')}</SelectItem>
                <SelectItem value="inactive">{tAuth('user.inactive')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common:common.refresh')}
            </Button>
            <AuthGuard roles={[UserRoleEnum.DEVELOPER, UserRoleEnum.OPERATOR]}>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedUser(null)
                  setFormDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {tAuth('user.create')}
              </Button>
            </AuthGuard>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* 桌面端表格视图 */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // 加载骨架屏
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {columns.map((_, colIndex) => (
                        <TableCell key={colIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data && Array.isArray(data.data) && data.data.length > 0 ? (
                  // 用户数据（后端直接返回数组）
                  data.data.map((user) => (
                    <TableRow key={user.id}>
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex}>
                          {column.cell(user)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  // 空状态
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">{t('list.empty')}</p>
                        <AuthGuard roles={[UserRoleEnum.DEVELOPER, UserRoleEnum.OPERATOR]}>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedUser(null)
                            setFormDialogOpen(true)
                          }}>
                            <Plus className="mr-2 size-4" />
                            {tAuth('user.create')}
                          </Button>
                        </AuthGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 移动端卡片列表视图 */}
          <div className="md:hidden">
            {isLoading ? (
              // 加载骨架屏
              <div className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.data && Array.isArray(data.data) && data.data.length > 0 ? (
              // 用户数据卡片列表
              <div className="divide-y divide-border">
                {data.data.map((user) => {
                  if (!currentUser) return null

                  const canUpdate = PermissionChecker.canUpdateUser(currentUser, user)
                  const canDelete = PermissionChecker.canDeleteUser(currentUser, user)
                  const canChangePwd = PermissionChecker.canChangePassword(currentUser, user)
                  const hasActions = canUpdate || canDelete || canChangePwd

                  return (
                    <MaterialListItem
                      key={user.id}
                      icon={
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                            {user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      }
                      title={user.username}
                      description={
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {tAuth(`role.${user.role}`)}
                            </Badge>
                            <Badge variant={user.is_active ? 'default' : 'destructive'} className="text-xs">
                              {user.is_active ? tAuth('user.active') : tAuth('user.inactive')}
                            </Badge>
                            {user.is_builtin && (
                              <Badge variant="outline" className="text-xs">
                                {tAuth('user.is_builtin')}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(user.created_at)}
                          </span>
                        </div>
                      }
                      actions={
                        hasActions ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{tAuth('common:common.actions')}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {canUpdate && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user)
                                  setFormDialogOpen(true)
                                }}>
                                  <Edit className="mr-2 size-4" />
                                  {tAuth('common:common.edit')}
                                </DropdownMenuItem>
                              )}
                              
                              {canChangePwd && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user)
                                  setPasswordDialogOpen(true)
                                }}>
                                  <Key className="mr-2 size-4" />
                                  {tAuth('user.change_password')}
                                </DropdownMenuItem>
                              )}
                              
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setDeleteDialogOpen(true)
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    {tAuth('common:common.delete')}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : undefined
                      }
                      onClick={() => {
                        // 移动端点击列表项可以查看详情（可选）
                        // 这里暂时不处理，因为已经有操作菜单
                      }}
                    />
                  )
                })}
              </div>
            ) : (
              // 空状态
              <div className="flex flex-col items-center justify-center h-48 px-4">
                <UserIcon className="size-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{t('list.empty')}</p>
                <AuthGuard roles={[UserRoleEnum.DEVELOPER, UserRoleEnum.OPERATOR]}>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedUser(null)
                    setFormDialogOpen(true)
                  }}>
                    <Plus className="mr-2 size-4" />
                    {tAuth('user.create')}
                  </Button>
                </AuthGuard>
              </div>
            )}
          </div>
          
          {/* 分页信息（使用 pagination 对象） */}
          {data?.pagination && data.pagination.total > 0 && (
            <div className={cn(
              "flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t",
              "md:px-6"
            )}>
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                共 {data.pagination.total} 条记录，
                第 {data.pagination.page}/{data.pagination.total_pages} 页
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page === 1}
                  onClick={() => setParams(prev => ({
                    ...prev,
                    skip: Math.max(0, (prev.skip || 0) - (prev.limit || 10)),
                  }))}
                  className="flex-1 sm:flex-initial"
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page >= data.pagination.total_pages}
                  onClick={() => setParams(prev => ({
                    ...prev,
                    skip: (prev.skip || 0) + (prev.limit || 10),
                  }))}
                  className="flex-1 sm:flex-initial"
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 对话框 */}
      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={selectedUser}
      />
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
      />
      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        user={selectedUser}
      />
    </div>
  )
}
