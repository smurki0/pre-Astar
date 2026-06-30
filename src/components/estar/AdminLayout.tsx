'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  ExternalLink,
  Store,
  Image,
  FolderTree,
  Mail,
  MailOpen,
  Check,
  Trash2,
  PackageOpen,
  MessageSquare,
  UserPlus,
  AlertTriangle,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { useSession } from '@/hooks/useSession'
import { ScrollArea } from '@/components/ui/scroll-area'
import { csrfFetch } from '@/lib/csrf-fetch'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: string | null
  isRead: boolean
  link: string | null
  createdAt: string
}

interface AdminLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    title: 'لوحة التحكم',
    titleEn: 'Dashboard',
    icon: LayoutDashboard,
    href: '/?view=admin&section=dashboard',
    section: 'dashboard',
    badge: null,
  },
  {
    title: 'سجل الأنشطة',
    titleEn: 'Audit Log',
    icon: AlertTriangle,
    href: '/?view=admin&section=audit',
    section: 'audit',
    badge: null,
  },
  {
    title: 'المنتجات',
    titleEn: 'Products',
    icon: Package,
    href: '/?view=admin&section=products',
    section: 'products',
    badge: null,
  },
  {
    title: 'الطلبات',
    titleEn: 'Orders',
    icon: ShoppingCart,
    href: '/?view=admin&section=orders',
    section: 'orders',
    badge: null,
  },
  {
    title: 'الفئات',
    titleEn: 'Categories',
    icon: FolderTree,
    href: '/?view=admin&section=categories',
    section: 'categories',
    badge: null,
  },
  {
    title: 'البنرات',
    titleEn: 'Banners',
    icon: Image,
    href: '/?view=admin&section=banners',
    section: 'banners',
    badge: null,
  },
  {
    title: 'التقييمات',
    titleEn: 'Reviews',
    icon: Star,
    href: '/?view=admin&section=reviews',
    section: 'reviews',
    badge: null,
  },
  {
    title: 'العملاء',
    titleEn: 'Customers',
    icon: Users,
    href: '/?view=admin&section=users',
    section: 'users',
    badge: null,
  },
  {
    title: 'خصومات',
    titleEn: 'Discounts',
    icon: Tag,
    href: '/?view=admin&section=discounts',
    section: 'discounts',
    badge: null,
  },
  {
    title: 'رسائل التواصل',
    titleEn: 'Contact Messages',
    icon: Mail,
    href: '/?view=admin&section=contact',
    section: 'contact',
    badge: null,
  },
  {
    title: 'النشرة البريدية',
    titleEn: 'Newsletter',
    icon: MailOpen,
    href: '/?view=admin&section=newsletter',
    section: 'newsletter',
    badge: null,
  },
  {
    title: 'الإعدادات',
    titleEn: 'Settings',
    icon: Settings,
    href: '/?view=admin&section=settings',
    section: 'settings',
    badge: null,
  },
]

function AdminSidebar() {
  const router = useRouter()
  const { user, logout } = useSession()
  const [currentSection, setCurrentSection] = React.useState('dashboard')

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setCurrentSection(searchParams.get('section') || 'dashboard')
    
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search)
      setCurrentSection(searchParams.get('section') || 'dashboard')
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/?view=home')
  }

  return (
    <Sidebar className="bg-card border-l border-border">
      <SidebarHeader className="border-b border-border p-4">
        <Link href="/?view=admin" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-foreground">Astar</span>
            <span className="text-xs text-muted-foreground">استآر</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs px-2 mb-2">
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentSection === item.section}
                    className={cn(
                      'w-full rounded-lg transition-all duration-200',
                      currentSection === item.section
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-3 px-3 py-2.5">
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Back to Store Link */}
        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="w-full rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Link href="/?view=home" className="flex items-center gap-3 px-3 py-2.5">
                    <Store className="h-5 w-5" />
                    <span className="flex-1">العودة للمتجر</span>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarFallback className="bg-primary/20 text-primary">
              {user?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || 'المسؤول'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@estar.com'}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function AdminHeader() {
  const router = useRouter()
  const { user, logout } = useSession()
  const [currentSection, setCurrentSection] = React.useState('dashboard')
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isOpen, setIsOpen] = React.useState(false)

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      const response = await csrfFetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setCurrentSection(searchParams.get('section') || 'dashboard')
    
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search)
      setCurrentSection(searchParams.get('section') || 'dashboard')
    }
    
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/?view=home')
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await csrfFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notificationId] }),
      })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      // Handle error silently
    }
  }

  const markAllAsRead = async () => {
    try {
      await csrfFetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      // Handle error silently
    }
  }

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await csrfFetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notificationId] }),
      })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      // Handle error silently
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`
    return date.toLocaleDateString('ar-EG')
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <PackageOpen className="h-4 w-4 text-blue-500" />
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'new_contact':
        return <MessageSquare className="h-4 w-4 text-green-500" />
      case 'new_subscriber':
        return <UserPlus className="h-4 w-4 text-purple-500" />
      case 'new_review':
        return <Star className="h-4 w-4 text-amber-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
    setIsOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      
      {/* Current Section Title */}
      <div className="hidden md:block">
        <h1 className="text-lg font-semibold text-foreground">
          {navItems.find(item => item.section === currentSection)?.title || 'لوحة التحكم'}
        </h1>
      </div>

      <div className="flex items-center gap-3 mr-auto">
        {/* Back to Store */}
        <Button variant="outline" size="sm" asChild className="hidden md:flex border-border hover:bg-accent">
          <Link href="/?view=home">
            <Store className="h-4 w-4 ml-2" />
            المتجر
          </Link>
        </Button>

        {/* Notifications */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <DropdownMenuLabel className="p-0">الإشعارات</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs text-primary"
                  onClick={markAllAsRead}
                >
                  <Check className="h-3 w-3 ml-1" />
                  قراءة الكل
                </Button>
              )}
            </div>
            <ScrollArea className="max-h-80">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  جاري التحميل...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  لا توجد إشعارات
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer hover:bg-accent border-b border-border last:border-b-0 transition-colors",
                      !notification.isRead && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium text-foreground",
                          !notification.isRead && "text-primary"
                        )}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteNotification(notification.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-primary text-xs"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/?view=admin&section=notifications')
                  }}
                >
                  عرض كل الإشعارات
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent">
              <Avatar className="h-8 w-8 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {user?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">{user?.name || 'المسؤول'}</span>
                <span className="text-xs text-muted-foreground">مدير المتجر</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>حسابي</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/?view=admin&section=settings">الإعدادات</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/?view=home">العودة للمتجر</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <main className="flex-1 bg-background p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminLayout
