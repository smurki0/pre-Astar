'use client'

import * as React from 'react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useUserStore } from '@/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Shield, User, Lock, LogIn, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { csrfFetch } from '@/lib/csrf-fetch'

export function MaintenanceChecker({ children }: { children: React.ReactNode }) {
  const { settings, loading: settingsLoading } = useSiteSettings()
  const { setUser, isAdmin, isAuthenticated } = useUserStore()
  const { toast } = useToast()
  
  const [adminLoginOpen, setAdminLoginOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loginLoading, setLoginLoading] = React.useState(false)
  const [loginError, setLoginError] = React.useState('')
  
  const isMaintenance = settings.maintenance_mode === 'true'
  const messageAr = settings.maintenance_message_ar || 'الموقع تحت الصيانة، يرجى المحاولة لاحقاً'
  const messageEn = settings.maintenance_message_en || 'Site is under maintenance, please try again later'

  // Check admin auth on mount (server-side)
  React.useEffect(() => {
    if (isMaintenance && !isAuthenticated()) {
      checkAdminAuth()
    }
  }, [isMaintenance, isAuthenticated()])

  const checkAdminAuth = async () => {
    try {
      const response = await csrfFetch('/api/admin/check-auth', { credentials: 'include' })
      const data = await response.json()
      
      if (data.isAdmin) {
        // Sync with store
        setUser(data.user, data.token)
      }
    } catch (error) {
      console.log('No valid admin session')
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const response = await csrfFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Admin success
        setUser(data.user, data.token)
        setAdminLoginOpen(false)
        setEmail('')
        setPassword('')
        toast({
          title: '🎉 مرحباً أدمن!',
          description: 'تم تجاوز الصيانة بنجاح',
        })
      } else {
        // Non-admin or error
        setLoginError(data.error || data.message || 'خطأ في تسجيل الدخول')
        toast({
          variant: 'destructive',
          title: '🚫 غير مسموح',
          description: data.message || 'تسجيل الدخول متاح للأدمن فقط',
        })
      }
    } catch (error) {
      setLoginError('خطأ في الاتصال')
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في الاتصال بالسيرفر',
      })
    } finally {
      setLoginLoading(false)
    }
  }

  // Show loader during initial load
  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Bypass for authenticated admins
  if (isAdmin()) {
    return <>{children}</>
  }

  // Show maintenance screen with admin login
  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full mx-auto text-center">
          {/* Maintenance Icon */}
          <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 p-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          
          <Badge className="bg-primary text-primary-foreground mb-4 px-4 py-1">
            الصيانة المقررة
          </Badge>
          
          {/* Main Card */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">
                مغلق للصيانة مؤقتاً
              </CardTitle>
              <CardDescription>
                {messageAr}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground italic">
                {messageEn}
              </p>
              
              {/* ADMIN LOGIN BUTTON */}
              <div className="pt-4">
                <Button 
                  onClick={() => setAdminLoginOpen(true)}
                  className="w-full group"
                  size="lg"
                >
                  <Shield className="h-4 w-4 mr-2 group-hover:rotate-12 transition-all" />
                  تسجيل دخول الأدمن
                </Button>
              </div>
              
              <div className="pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  شكراً لصبركم، سنعود قريباً بتحديثات جديدة!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ADMIN LOGIN MODAL/FORM */}
        {adminLoginOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setAdminLoginOpen(false)}>
            <Card className="w-full max-w-sm bg-card/95 backdrop-blur-sm border-border/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">🔐 دخول الأدمن</CardTitle>
                <CardDescription className="text-sm">
                  أدخل بيانات حساب الأدمن لتجاوز الصيانة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@astar.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                  
                  {loginError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {loginError}
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loginLoading}>
                    {loginLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        جاري التحقق...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        دخول الأدمن
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="pt-0 pb-4 px-6">
                <Button 
                  variant="link" 
                  className="w-full text-xs h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setAdminLoginOpen(false)
                    setEmail('')
                    setPassword('')
                    setLoginError('')
                  }}
                >
                  إغلاق
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    )
  }

  // Normal content
  return <>{children}</>
}


