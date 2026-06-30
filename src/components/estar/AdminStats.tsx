'use client'

import * as React from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { csrfFetch } from '@/lib/csrf-fetch'

interface StatsData {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    user: { name: string | null; email: string } | null
    total: number
    status: string
    createdAt: string
  }>
  ordersByStatus: Array<{
    status: string
    _count: number
  }>
  revenueByMonth: Array<{
    month: string
    revenue: number
  }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  processing: 'قيد التنفيذ',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}

const chartColors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444']

export function AdminStats() {
  const [chartPeriod, setChartPeriod] = React.useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = React.useState(true)
  const { toast } = useToast()
  
  // Real stats from API
  const [stats, setStats] = React.useState<StatsData>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    ordersByStatus: [],
    revenueByMonth: [],
  })
  
  // Fetch real stats
  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await csrfFetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalProducts: data.totalProducts || 0,
          totalOrders: data.totalOrders || 0,
          totalUsers: data.totalUsers || 0,
          totalRevenue: data.totalRevenue || 0,
          recentOrders: data.recentOrders || [],
          ordersByStatus: data.ordersByStatus || [],
          revenueByMonth: data.revenueByMonth || [],
        })
      }
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }, [])
  
  React.useEffect(() => {
    fetchStats()
  }, [fetchStats])
  
  // Export report as CSV
  const handleExportReport = () => {
    const csvContent = [
      ['تقرير لوحة التحكم - Astar'],
      [''],
      ['الإحصائيات'],
      ['إجمالي الإيرادات', stats.totalRevenue.toLocaleString() + ' ج.م'],
      ['إجمالي الطلبات', stats.totalOrders.toString()],
      ['إجمالي العملاء', stats.totalUsers.toString()],
      ['إجمالي المنتجات', stats.totalProducts.toString()],
      [''],
      ['أحدث الطلبات'],
      ['رقم الطلب', 'العميل', 'المبلغ', 'الحالة', 'التاريخ'],
      ...stats.recentOrders.map(o => [
        o.orderNumber,
        o.user?.name || o.user?.email || 'غير معروف',
        o.total.toString() + ' ج.م',
        statusLabels[o.status] || o.status,
        new Date(o.createdAt).toLocaleDateString('ar-SA'),
      ]),
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estar-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: 'تم التصدير',
      description: 'تم تصدير التقرير بنجاح',
    })
  }
  
  // Navigate function
  const navigateTo = (view: string, section?: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', view)
    if (section) {
      url.searchParams.set('section', section)
    }
    window.location.href = url.toString()
  }

  // Prepare orders by status for pie chart
  const ordersByStatusData = stats.ordersByStatus.map((item, index) => ({
    name: statusLabels[item.status] || item.status,
    value: item._count,
    color: chartColors[index % chartColors.length],
  }))

  // Prepare revenue chart data
  const revenueChartData = stats.revenueByMonth.map(item => ({
    month: item.month,
    revenue: item.revenue,
  }))

  // Stats cards data
  const statsCards = [
    {
      title: 'إجمالي الإيرادات',
      value: stats.totalRevenue.toLocaleString(),
      suffix: 'ج.م',
      icon: DollarSign,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders.toLocaleString(),
      suffix: '',
      icon: ShoppingCart,
      color: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'العملاء',
      value: stats.totalUsers.toLocaleString(),
      suffix: '',
      icon: Users,
      color: 'text-violet-600',
      iconBg: 'bg-violet-100',
    },
    {
      title: 'المنتجات',
      value: stats.totalProducts.toLocaleString(),
      suffix: '',
      icon: Package,
      color: 'text-primary',
      iconBg: 'bg-primary/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">مرحباً بك! إليك نظرة عامة على متجرك</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            تصدير التقرير
          </Button>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={fetchStats}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              'تحديث البيانات'
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border border-border shadow-sm hover:shadow-md transition-shadow bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                    {stat.suffix && <span className="text-sm text-muted-foreground">{stat.suffix}</span>}
                  </div>
                </div>
                <div className={cn('p-3 rounded-xl', stat.iconBg)}>
                  <stat.icon className={cn('h-6 w-6', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border border-border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">الإيرادات</CardTitle>
              <CardDescription>الإيرادات الشهرية</CardDescription>
            </div>
            <div className="flex gap-1">
              {(['week', 'month', 'year'] as const).map((period) => (
                <Button
                  key={period}
                  variant={chartPeriod === period ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'text-xs',
                    chartPeriod === period && 'bg-primary hover:bg-primary/90 text-white'
                  )}
                  onClick={() => setChartPeriod(period)}
                >
                  {period === 'week' ? 'أسبوع' : period === 'month' ? 'شهر' : 'سنة'}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'الإيرادات']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f43f5e"
                      strokeWidth={3}
                      dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#f43f5e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 text-muted" />
                    <p>لا توجد بيانات إيرادات بعد</p>
                    <p className="text-sm">ستظهر البيانات عند استلام طلبات مدفوعة</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">الطلبات حسب الحالة</CardTitle>
            <CardDescription>توزيع الطلبات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {ordersByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ordersByStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {ordersByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value} طلب`, '']}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-muted" />
                    <p>لا توجد طلبات بعد</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">أحدث الطلبات</CardTitle>
              <CardDescription>آخر 5 طلبات</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary/80"
              onClick={() => navigateTo('admin', 'orders')}
            >
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-muted-foreground">رقم الطلب</TableHead>
                    <TableHead className="text-muted-foreground">العميل</TableHead>
                    <TableHead className="text-muted-foreground">المبلغ</TableHead>
                    <TableHead className="text-muted-foreground">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-accent">
                      <TableCell className="font-medium text-primary">#{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{order.user?.name || 'غير مسجل'}</p>
                          <p className="text-xs text-muted-foreground">{order.user?.email || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{order.total.toLocaleString()} ج.م</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-700'}>
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-muted" />
                <p>لا توجد طلبات بعد</p>
                <p className="text-sm">ستظهر الطلبات هنا عند استلامها</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="border border-border shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">ملخص سريع</CardTitle>
            <CardDescription>إحصائيات عامة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">متوسط قيمة الطلب</p>
                    <p className="text-sm text-muted-foreground">بناءً على الطلبات المدفوعة</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">
                  {stats.totalOrders > 0 
                    ? Math.round(stats.totalRevenue / stats.totalOrders).toLocaleString() 
                    : 0} ج.م
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">الطلبات المعلقة</p>
                    <p className="text-sm text-muted-foreground">بانتظار المعالجة</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">
                  {stats.ordersByStatus.find(o => o.status === 'pending')?._count || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100">
                    <Package className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">الطلبات قيد التنفيذ</p>
                    <p className="text-sm text-muted-foreground">يتم تجهيزها</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">
                  {stats.ordersByStatus.find(o => o.status === 'processing')?._count || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">إجمالي العملاء</p>
                    <p className="text-sm text-muted-foreground">مسجلين في المتجر</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground">{stats.totalUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminStats
