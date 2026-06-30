'use client'

import * as React from 'react'
import {
  Search,
  Filter,
  Package,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  CreditCard,
  MapPin,
  User,
  Receipt,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { csrfFetch } from '@/lib/csrf-fetch'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod?: string | null
  paymentReference?: string | null
  subtotal: number
  shipping: number
  discount: number
  total: number
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  } | null
  items: {
    id: string
    productName: string
    quantity: number
    price: number
    total: number
  }[]
  shippingAddress?: string
  trackingNumber?: string | null
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'معلق', color: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
  processing: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-700', icon: <Package className="h-3.5 w-3.5" /> },
  shipped: { label: 'تم الشحن', color: 'bg-violet-100 text-violet-700', icon: <Truck className="h-3.5 w-3.5" /> },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3.5 w-3.5" /> },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'معلق', color: 'bg-amber-100 text-amber-700' },
  paid: { label: 'مدفوع', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'فشل', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'مسترجع', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'ملغي', color: 'bg-muted text-muted-foreground' },
}

const paymentMethodConfig: Record<string, { label: string; icon: React.ReactNode; needsVerification: boolean }> = {
  cod: { label: 'الدفع عند الاستلام', icon: <Receipt className="h-4 w-4" />, needsVerification: false },
  fawry: { label: 'فوري', icon: <CreditCard className="h-4 w-4" />, needsVerification: true },
  paymob: { label: 'باي موب', icon: <CreditCard className="h-4 w-4" />, needsVerification: true },
  vodafonecash: { label: 'فودافون كاش', icon: <CreditCard className="h-4 w-4" />, needsVerification: true },
  vodafone_cash: { label: 'فودافون كاش', icon: <CreditCard className="h-4 w-4" />, needsVerification: true },
  card: { label: 'بطاقة ائتمان', icon: <CreditCard className="h-4 w-4" />, needsVerification: true },
  stripe: { label: 'بطاقة ائتمان', icon: <CreditCard className="h-4 w-4" />, needsVerification: true },
}

function OrderRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  )
}

export function AdminOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [updating, setUpdating] = React.useState(false)

  // Fetch orders
  const fetchOrders = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await csrfFetch('/api/admin/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الطلبات',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Filter orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      setUpdating(true)
      const response = await csrfFetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث حالة الطلب',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة الطلب',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  // Update payment status
  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      setUpdating(true)
      const response = await csrfFetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      })
      
      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus } : o))
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, paymentStatus })
        }
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث حالة الدفع',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث حالة الدفع',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  // Get stats
  const stats = React.useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending').length
    const processing = orders.filter(o => o.status === 'processing').length
    const shipped = orders.filter(o => o.status === 'shipped').length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)
    
    return { pending, processing, shipped, delivered, totalRevenue }
  }, [orders])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">إدارة الطلبات</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {orders.length} طلب في المتجر
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.processing}</p>
                <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.shipped}</p>
                <p className="text-xs text-muted-foreground">تم الشحن</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">تم التسليم</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">ج.م الإيرادات</p>
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
                placeholder="بحث برقم الطلب أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-muted border-border"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-muted border-border">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="processing">قيد التنفيذ</SelectItem>
                <SelectItem value="shipped">تم الشحن</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-muted-foreground">رقم الطلب</TableHead>
                <TableHead className="text-muted-foreground">العميل</TableHead>
                <TableHead className="text-muted-foreground">التاريخ</TableHead>
                <TableHead className="text-muted-foreground">حالة الطلب</TableHead>
                <TableHead className="text-muted-foreground">الدفع</TableHead>
                <TableHead className="text-muted-foreground">المجموع</TableHead>
                <TableHead className="text-muted-foreground text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <OrderRowSkeleton key={i} />
                ))
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">لا توجد طلبات</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted">
                    <TableCell className="font-medium text-primary">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{order.user?.name || 'غير محدد'}</p>
                        <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', statusConfig[order.status]?.color || 'bg-muted text-gray-700')}>
                        {statusConfig[order.status]?.icon}
                        <span className="mr-1">{statusConfig[order.status]?.label || order.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-normal', paymentStatusConfig[order.paymentStatus]?.color || 'bg-muted text-gray-700')}>
                        {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {order.total.toLocaleString()} ج.م
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedOrder(order)}
                          className="text-muted-foreground hover:text-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>تحديث الحالة</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => updateOrderStatus(order.id, key)}
                                disabled={updating || order.status === key}
                              >
                                {config.icon}
                                <span className="mr-2">{config.label}</span>
                              </DropdownMenuItem>
                            ))}
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

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-foreground text-base">تفاصيل الطلب #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <Badge className={cn('font-normal gap-1', statusConfig[selectedOrder.status]?.color || 'bg-muted text-gray-700')}>
                  {statusConfig[selectedOrder.status]?.icon}
                  <span>{statusConfig[selectedOrder.status]?.label || selectedOrder.status}</span>
                </Badge>
                <Badge className={cn('font-normal', paymentStatusConfig[selectedOrder.paymentStatus]?.color || 'bg-muted text-gray-700')}>
                  {paymentStatusConfig[selectedOrder.paymentStatus]?.label || selectedOrder.paymentStatus}
                </Badge>
              </div>

              {/* Customer & Payment - Table Style */}
              <div className="bg-muted/30 rounded-lg border border-border overflow-hidden flex-shrink-0">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-3 bg-muted/50 font-medium text-foreground w-28">العميل</td>
                      <td className="p-3 text-foreground break-words">{selectedOrder.user?.name || 'غير محدد'}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 bg-muted/50 font-medium text-foreground">البريد</td>
                      <td className="p-3 text-muted-foreground text-xs break-all">{selectedOrder.user?.email}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-muted/50 font-medium text-foreground">الدفع</td>
                      <td className="p-3 text-foreground">
                        <span>{paymentMethodConfig[selectedOrder.paymentMethod || 'cod']?.label || 'الدفع عند الاستلام'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Verification Section */}
              {selectedOrder.paymentMethod && selectedOrder.paymentMethod !== 'cod' && (
                <div className="bg-muted/30 rounded-lg p-3 border border-border flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">حالة الدفع</span>
                    </div>
                    <Badge className={cn('font-normal', paymentStatusConfig[selectedOrder.paymentStatus]?.color || 'bg-muted text-gray-700')}>
                      {paymentStatusConfig[selectedOrder.paymentStatus]?.label || selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                  
                  {/* Payment Reference */}
                  {selectedOrder.paymentReference && (
                    <div className="bg-background rounded-lg p-3 border border-border mb-3">
                      <p className="text-xs text-muted-foreground mb-1">رقم مرجع العملية</p>
                      <p className="text-sm font-mono text-foreground break-all" dir="ltr">{selectedOrder.paymentReference}</p>
                    </div>
                  )}
                  
                  {/* Verification Actions */}
                  {selectedOrder.paymentStatus !== 'paid' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => updatePaymentStatus(selectedOrder.id, 'paid')}
                        disabled={updating}
                      >
                        <CheckCircle className="h-4 w-4 ml-1" />
                        تأكيد الدفع
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-9"
                        onClick={() => updatePaymentStatus(selectedOrder.id, 'failed')}
                        disabled={updating}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        فشل
                      </Button>
                    </div>
                  )}
                  
                  {selectedOrder.paymentStatus === 'paid' && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>تم تأكيد الدفع</span>
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="bg-muted/30 rounded-lg p-3 border border-border flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">عنوان الشحن</span>
                  </div>
                  {(() => {
                    try {
                      const addr = typeof selectedOrder.shippingAddress === 'string' 
                        ? JSON.parse(selectedOrder.shippingAddress) 
                        : selectedOrder.shippingAddress;
                      return (
                        <div className="bg-background rounded-lg p-3 border border-border space-y-2 text-sm">
                          {/* الاسم الكامل */}
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[70px]">الاسم:</span>
                            <span className="text-foreground font-medium">{addr.firstName} {addr.lastName}</span>
                          </div>
                          {/* الهاتف */}
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[70px]">الهاتف:</span>
                            <span className="text-foreground" dir="ltr">{addr.phone}</span>
                          </div>
                          {/* البريد الإلكتروني */}
                          {addr.email && (
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[70px]">البريد:</span>
                              <span className="text-foreground text-xs break-all" dir="ltr">{addr.email}</span>
                            </div>
                          )}
                          {/* العنوان التفصيلي */}
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[70px]">العنوان:</span>
                            <span className="text-foreground">{addr.address}</span>
                          </div>
                          {/* المدينة */}
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[70px]">المدينة:</span>
                            <span className="text-foreground">{addr.city}</span>
                          </div>
                          {/* الرمز البريدي */}
                          {addr.postalCode && (
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[70px]">الرمز:</span>
                              <span className="text-foreground" dir="ltr">{addr.postalCode}</span>
                            </div>
                          )}
                        </div>
                      );
                    } catch {
                      return (
                        <p className="text-sm text-foreground bg-background rounded-lg p-3 border border-border">
                          {selectedOrder.shippingAddress}
                        </p>
                      );
                    }
                  })()}
                </div>
              )}

              {/* Order Items */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">المنتجات</span>
                </div>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start gap-2 py-2 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground break-words">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">الكمية: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium text-primary whitespace-nowrap">{(item.price * item.quantity).toLocaleString()} ج.م</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">الفاتورة</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span className="text-foreground whitespace-nowrap">{selectedOrder.subtotal.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">الشحن</span>
                    <span className={selectedOrder.shipping === 0 ? 'text-emerald-600' : 'text-foreground whitespace-nowrap'}>
                      {selectedOrder.shipping === 0 ? 'مجاني' : `${selectedOrder.shipping.toLocaleString()} ج.م`}
                    </span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between gap-2 text-emerald-600">
                      <span>الخصم</span>
                      <span className="whitespace-nowrap">-{selectedOrder.discount.toLocaleString()} ج.م</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between gap-2 font-bold text-base">
                    <span className="text-foreground">الإجمالي</span>
                    <span className="text-primary whitespace-nowrap">{selectedOrder.total.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Tracking Number */}
              {selectedOrder.trackingNumber && (
                <div className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border border-border flex-shrink-0">
                  <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">رقم التتبع</p>
                    <p className="text-sm font-mono text-foreground break-all">{selectedOrder.trackingNumber}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Actions - Fixed at bottom */}
          {selectedOrder && (
            <div className="flex-shrink-0 pt-3 border-t border-border mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Order status selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">حالة الطلب</label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(status) => {
                    updateOrderStatus(selectedOrder.id, status)
                    setSelectedOrder({ ...selectedOrder, status })
                  }}
                >
                  <SelectTrigger className="w-full border-border bg-background">
                    <SelectValue placeholder="تحديث حالة الطلب" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment status selector — independent of order status, works for every
                  order including Cash on Delivery. */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">حالة الدفع</label>
                <Select
                  value={selectedOrder.paymentStatus}
                  onValueChange={(paymentStatus) => {
                    updatePaymentStatus(selectedOrder.id, paymentStatus)
                  }}
                >
                  <SelectTrigger className="w-full border-border bg-background">
                    <SelectValue placeholder="تحديث حالة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2.5 w-2.5 rounded-full', config.color.split(' ')[0])} />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminOrders
