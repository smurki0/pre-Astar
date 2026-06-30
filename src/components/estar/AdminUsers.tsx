'use client'
import { csrfFetch } from '@/lib/csrf-fetch'

import * as React from 'react'
import {
  Search,
  Filter,
  Users as UsersIcon,
  MoreHorizontal,
  UserX,
  CheckCircle,
  XCircle,
  Shield,
  Mail,
  Phone,
  Ban,
  Calendar,
  MessageSquare,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  avatar: string | null
  role: string
  isBlocked: boolean
  blockedReason: string | null
  blockedAt: string | null
  emailVerified: boolean
  createdAt: string
  _count?: {
    orders: number
    wishlistItems: number
  }
}

function UserRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  )
}

export function AdminUsers() {
  const { toast } = useToast()
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [deleteDialog, setDeleteDialog] = React.useState<User | null>(null)
  const [blockDialog, setBlockDialog] = React.useState<User | null>(null)
  const [blockReason, setBlockReason] = React.useState('')

  // Fetch users
  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await csrfFetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المستخدمين',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && !user.isBlocked) ||
        (statusFilter === 'blocked' && user.isBlocked)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Block user with reason
  const handleBlockUser = async () => {
    if (!blockDialog) return

    try {
      const response = await csrfFetch(`/api/admin/users/${blockDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isBlocked: true, 
          blockedReason: blockReason || 'مخالفة قواعد الموقع' 
        }),
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map(u => 
          u.id === blockDialog.id ? { 
            ...u, 
            isBlocked: true, 
            blockedReason: updatedUser.blockedReason,
            blockedAt: updatedUser.blockedAt
          } : u
        ))
        setBlockDialog(null)
        setBlockReason('')
        toast({
          title: 'تم الحظر',
          description: 'تم حظر المستخدم بنجاح',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to block user')
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حظر المستخدم',
        variant: 'destructive',
      })
    }
  }

  // Unblock user
  const handleUnblockUser = async (user: User) => {
    try {
      const response = await csrfFetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: false }),
      })
      
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === user.id ? { 
            ...u, 
            isBlocked: false, 
            blockedReason: null,
            blockedAt: null
          } : u
        ))
        toast({
          title: 'تم فك الحظر',
          description: 'تم فك حظر المستخدم بنجاح',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في فك حظر المستخدم',
        variant: 'destructive',
      })
    }
  }

  // Change role
  const handleChangeRole = async (user: User, role: string) => {
    try {
      const response = await csrfFetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, role: updatedUser.role } : u
        ))
        toast({
          title: 'تم التحديث',
          description: `تم تغيير صلاحية المستخدم إلى ${role === 'admin' ? 'مسؤول' : 'عميل'}`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change role')
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تغيير صلاحية المستخدم',
        variant: 'destructive',
      })
    }
  }

  // Delete user
  const handleDelete = async (user: User) => {
    try {
      const response = await csrfFetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== user.id))
        setDeleteDialog(null)
        toast({
          title: 'تم الحذف',
          description: 'تم حذف المستخدم بنجاح',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المستخدم',
        variant: 'destructive',
      })
    }
  }

  // Get stats
  const stats = React.useMemo(() => {
    const total = users.length
    const customers = users.filter(u => u.role === 'customer').length
    const admins = users.filter(u => u.role === 'admin').length
    const blocked = users.filter(u => u.isBlocked).length
    
    return { total, customers, admins, blocked }
  }, [users])

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {users.length} مستخدم مسجل
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.customers}</p>
                  <p className="text-xs text-muted-foreground">عملاء</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
                  <p className="text-xs text-muted-foreground">مسؤولين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.blocked}</p>
                  <p className="text-xs text-muted-foreground">محظورين</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="بحث عن مستخدم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="الصلاحية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الصلاحيات</SelectItem>
                  <SelectItem value="customer">عملاء</SelectItem>
                  <SelectItem value="admin">مسؤولين</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="blocked">محظور</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">المستخدم</TableHead>
                  <TableHead className="text-muted-foreground">الهاتف</TableHead>
                  <TableHead className="text-muted-foreground">الصلاحية</TableHead>
                  <TableHead className="text-muted-foreground">الحالة</TableHead>
                  <TableHead className="text-muted-foreground">الطلبات</TableHead>
                  <TableHead className="text-muted-foreground">تاريخ التسجيل</TableHead>
                  <TableHead className="text-muted-foreground text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <UserRowSkeleton key={i} />
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <UsersIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">لا يوجد مستخدمين</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.name || 'غير محدد'}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                            {user.isBlocked && user.blockedReason && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1 cursor-help">
                                    <MessageSquare className="h-3 w-3" />
                                    {user.blockedReason.substring(0, 20)}...
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <p className="text-sm">{user.blockedReason}</p>
                                  {user.blockedAt && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      تم الحظر: {formatDate(user.blockedAt)}
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          'font-normal',
                          user.role === 'admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'bg-muted text-muted-foreground'
                        )}>
                          {user.role === 'admin' ? (
                            <><Shield className="h-3 w-3 mr-1" /> مسؤول</>
                          ) : (
                            'عميل'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              className={cn(
                                'cursor-pointer font-normal',
                                user.isBlocked
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              )}
                            >
                              {user.isBlocked ? (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  محظور
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  نشط
                                </>
                              )}
                            </Badge>
                          </TooltipTrigger>
                          {user.isBlocked && user.blockedAt && (
                            <TooltipContent>
                              <p>تم الحظر: {formatDate(user.blockedAt)}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user._count?.orders || 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              {user.isBlocked ? (
                                <DropdownMenuItem onClick={() => handleUnblockUser(user)}>
                                  <CheckCircle className="h-4 w-4 ml-2" />
                                  فك الحظر
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setBlockDialog(user)}>
                                  <Ban className="h-4 w-4 ml-2" />
                                  حظر المستخدم
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>تغيير الصلاحية</DropdownMenuLabel>
                              
                              <DropdownMenuItem 
                                onClick={() => handleChangeRole(user, 'customer')}
                                disabled={user.role === 'customer'}
                              >
                                <UsersIcon className="h-4 w-4 ml-2" />
                                عميل
                                {user.role === 'customer' && (
                                  <CheckCircle className="h-4 w-4 mr-auto text-primary" />
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleChangeRole(user, 'admin')}
                                disabled={user.role === 'admin'}
                              >
                                <Shield className="h-4 w-4 ml-2" />
                                مسؤول
                                {user.role === 'admin' && (
                                  <CheckCircle className="h-4 w-4 mr-auto text-primary" />
                                )}
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => setDeleteDialog(user)}
                              >
                                <UserX className="h-4 w-4 ml-2" />
                                حذف المستخدم
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Block User Dialog */}
        <Dialog open={!!blockDialog} onOpenChange={() => {
          setBlockDialog(null)
          setBlockReason('')
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                حظر المستخدم
              </DialogTitle>
              <DialogDescription>
                أدخل سبب حظر المستخدم "{blockDialog?.name || blockDialog?.email}"
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="سبب الحظر (مثال: مخالفة قواعد الموقع، سلوك غير لائق...)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-2">
                سيتم منع المستخدم من تسجيل الدخول وإجراء الطلبات.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setBlockDialog(null)
                setBlockReason('')
              }}>
                إلغاء
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBlockUser}
              >
                <Ban className="h-4 w-4 ml-2" />
                حظر
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
<AlertDialogDescription>
                هل أنت متأكد من حذف المستخدم "{deleteDialog?.name || deleteDialog?.email}"؟
              </AlertDialogDescription>
              <div className="text-sm text-muted-foreground mt-4 space-y-1">
                <span className="text-red-500 font-medium block mb-2">سيتم حذف جميع بيانات المستخدم بما في ذلك:</span>
                <div className="flex items-start gap-2 pl-4">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full flex-shrink-0 mt-1.5">•</span>
                  <span>عناوين المستخدم</span>
                </div>
                <div className="flex items-start gap-2 pl-4">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full flex-shrink-0 mt-1.5">•</span>
                  <span>عناصر السلة والمفضلة</span>
                </div>
                <div className="flex items-start gap-2 pl-4">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full flex-shrink-0 mt-1.5">•</span>
                  <span>تقييمات المنتجات</span>
                </div>
                <p className="font-medium mt-4">هذا الإجراء لا يمكن التراجع عنه.</p>
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600"
                onClick={() => deleteDialog && handleDelete(deleteDialog)}
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}

export default AdminUsers
