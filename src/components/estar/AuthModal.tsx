'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useSession } from '@/hooks/useSession';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { csrfFetch } from '@/lib/csrf-fetch'

// Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'signup';
  onLogin?: (data: LoginFormData) => Promise<void>;
  onSignup?: (data: SignupFormData) => Promise<void>;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = 'login',
  onLogin,
  onSignup,
}: AuthModalProps) {
  const { language, isRTL, dir } = useLanguage();
  const { login: sessionLogin, logout: sessionLogout } = useSession();
  
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resetPasswordSent, setResetPasswordSent] = React.useState(false);
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Reset forms when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      loginForm.reset();
      signupForm.reset();
      setError(null);
      setResetPasswordSent(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, loginForm, signupForm]);
  
  // Update active tab when defaultTab changes
  React.useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  
  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await sessionLogin(data.email, data.password);
      
      if (!result.success) {
        setError(result.error || (language === 'ar' ? 'خطأ في تسجيل الدخول' : 'Login failed'));
        return;
      }
      
      onOpenChange(false);
    } catch (err) {
      setError(language === 'ar' ? 'خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await csrfFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || (language === 'ar' ? 'خطأ في التسجيل' : 'Registration failed'));
        return;
      }
      
      // Auto-login after successful registration
      const loginResult = await sessionLogin(data.email, data.password);
      
      if (loginResult.success) {
        onOpenChange(false);
      } else {
        setError(loginResult.error || (language === 'ar' ? 'تسجيل ناجح لكن فشل تسجيل الدخول' : 'Registered but login failed'));
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(language === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Connection error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleForgotPassword = async () => {
    const email = loginForm.getValues('email');
    if (!email) {
      setError(language === 'ar' ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }
    
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setResetPasswordSent(true);
    setIsSubmitting(false);
  };
  
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsSubmitting(true);
    
    // TODO: Implement real social login with NextAuth providers
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setError(language === 'ar' ? 'الدخول الاجتماعي غير متاح حالياً' : 'Social login not available yet');
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden rounded-2xl"
        showCloseButton
      >
        <div dir={dir}>
          {/* Header with Logo */}
          <div className="bg-gradient-to-b from-primary/10 to-transparent p-6 pb-0">
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold text-foreground">
                {language === 'ar' ? 'مرحباً بك في استآر' : 'Welcome to Astar'}
              </DialogTitle>
              <DialogDescription>
                {language === 'ar'
                  ? 'سجلي الدخول أو أنشئي حساباً جديداً'
                  : 'Sign in or create a new account'}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 pt-4">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="w-full bg-secondary/50 rounded-full p-1 mb-6">
                <TabsTrigger
                  value="login"
                  className="rounded-full flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-full flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  {language === 'ar' ? 'حساب جديد' : 'Sign Up'}
                </TabsTrigger>
              </TabsList>
              
              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                className="pl-10 rounded-lg"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'ar' ? 'كلمة المرور' : 'Password'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-10 pr-10 rounded-lg"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Forgot Password */}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-sm text-primary"
                        onClick={handleForgotPassword}
                        disabled={isSubmitting}
                      >
                        {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </Button>
                    </div>
                    
                    {/* Reset Password Sent */}
                    <AnimatePresence>
                      {resetPasswordSent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4" />
                          <span>
                            {language === 'ar'
                              ? 'تم إرسال رابط إعادة تعيين كلمة المرور'
                              : 'Password reset link has been sent'}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <Button
                      type="submit"
                      className="w-full rounded-full h-11"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {language === 'ar' ? 'جاري الدخول...' : 'Signing in...'}
                        </>
                      ) : (
                        <>
                          {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                          <ArrowRight className={cn('h-4 w-4 ml-2', isRTL && 'rotate-180')} />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder={language === 'ar' ? 'الاسم' : 'Your name'}
                                className="pl-10 rounded-lg"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                className="pl-10 rounded-lg"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'ar' ? 'رقم الجوال' : 'Phone Number'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="tel"
                                placeholder="+966 5XX XXX XXXX"
                                className="pl-10 rounded-lg"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'ar' ? 'كلمة المرور' : 'Password'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-10 pr-10 rounded-lg"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="pl-10 pr-10 rounded-lg"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full rounded-full h-11"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {language === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating account...'}
                        </>
                      ) : (
                        <>
                          {language === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                          <ArrowRight className={cn('h-4 w-4 ml-2', isRTL && 'rotate-180')} />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            {/* Social Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {language === 'ar' ? 'أو' : 'Or continue with'}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="rounded-full h-11"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isSubmitting}
                  type="button"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                
                <Button
                  variant="outline"
                  className="rounded-full h-11"
                  onClick={() => handleSocialLogin('apple')}
                  disabled={isSubmitting}
                  type="button"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </div>
            
            {/* Terms */}
            <p className="mt-4 text-xs text-center text-muted-foreground">
              {language === 'ar' ? (
                <>
                  بتسجيل الدخول، أنتِ توافقين على{' '}
                  <a href="#" className="text-primary hover:underline">
                    شروط الخدمة
                  </a>{' '}
                  و{' '}
                  <a href="#" className="text-primary hover:underline">
                    سياسة الخصوصية
                  </a>
                </>
              ) : (
                <>
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
