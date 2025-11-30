/**
 * 用户列表页面 - 完整CRUD功能
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw } from 'lucide-react'
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
import { AuthGuard } from '@/components/auth'
import { UserFormDialog } from '@/components/users/UserFormDialog'
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog'
import { ChangePasswordDialog } from '@/components/users/ChangePasswordDialog'
import { useUserTableColumns } from '@/components/users/UserTableColumns'
import { useUserList } from '@/hooks/useUserQueries'
import { useAuth } from '@/hooks/useAuth'
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
    <div className="space-y-6">
      {/* 操作按钮 */}
      <div className="flex justify-end">
        <AuthGuard roles={[UserRoleEnum.DEVELOPER, UserRoleEnum.OPERATOR]}>
          <Button onClick={() => {
            setSelectedUser(null)
            setFormDialogOpen(true)
          }}>
            <Plus className="mr-2 size-4" />
            {tAuth('user.create')}
          </Button>
        </AuthGuard>
      </div>
      
      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('list.filter.title')}</CardTitle>
          <CardDescription>{t('list.filter.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            {/* 搜索 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('list.filter.searchPlaceholder')}
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            
            {/* 角色筛选 */}
            <Select onValueChange={handleRoleFilter} defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('list.filter.role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('list.filter.allRoles')}</SelectItem>
                <SelectItem value={UserRoleEnum.DEVELOPER}>{tAuth('role.developer')}</SelectItem>
                <SelectItem value={UserRoleEnum.OPERATOR}>{tAuth('role.operator')}</SelectItem>
                <SelectItem value={UserRoleEnum.USER}>{tAuth('role.user')}</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 状态筛选 */}
            <Select onValueChange={handleStatusFilter} defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t('list.filter.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('list.filter.allStatus')}</SelectItem>
                <SelectItem value="active">{tAuth('user.active')}</SelectItem>
                <SelectItem value="inactive">{tAuth('user.inactive')}</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 刷新 */}
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 用户表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
          
          {/* 分页信息（使用 pagination 对象） */}
          {data?.pagination && data.pagination.total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                共 {data.pagination.total} 条记录，
                第 {data.pagination.page}/{data.pagination.total_pages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page === 1}
                  onClick={() => setParams(prev => ({
                    ...prev,
                    skip: Math.max(0, (prev.skip || 0) - (prev.limit || 10)),
                  }))}
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
