'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { csrfFetch } from '@/lib/csrf-fetch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertCircle,
  Home,
  Briefcase,
  MapPinned,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useUserStore } from '@/store';
import { useSession } from '@/hooks/useSession';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Zod schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  postalCode: z.string().min(5, 'Valid postal code is required'),
  isDefault: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type AddressFormData = z.infer<typeof addressSchema>;

interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

interface UserProfileProps {
  onPasswordChange?: (data: PasswordFormData) => Promise<void>;
  onProfileUpdate?: (data: ProfileFormData) => Promise<void>;
  onAddressAdd?: (data: AddressFormData) => Promise<void>;
  onAddressDelete?: (addressId: string) => Promise<void>;
}

export function UserProfile({
  onPasswordChange,
  onProfileUpdate,
  onAddressAdd,
  onAddressDelete,
}: UserProfileProps) {
  const { language, isRTL, dir } = useLanguage();
  // Source of truth is the NextAuth session (the app authenticates via NextAuth).
  // The legacy zustand store is kept in sync only for backward compatibility.
  const { user, updateSession } = useSession();
  const { setUser } = useUserStore();
  const { toast } = useToast();
  
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = React.useState(false);
  const [isSavingAddress, setIsSavingAddress] = React.useState(false);
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = React.useState(true);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState(false);
  
  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Address form
  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      isDefault: false,
    },
  });
  
  // Load the current user's real addresses from the server
  const fetchAddresses = React.useCallback(async () => {
    setAddressesLoading(true);
    try {
      const res = await csrfFetch('/api/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
      }
    } catch {
      // leave addresses empty on failure
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Keep the profile form in sync with the loaded user
  React.useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleProfileSave = async (data: ProfileFormData) => {
    setIsSavingProfile(true);

    try {
      if (onProfileUpdate) {
        await onProfileUpdate(data);
      }

      // Persist to the database so the change is reflected in the admin account.
      const res = await csrfFetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, phone: data.phone }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update profile');
      }

      const { user: updated } = await res.json();

      // Refresh the NextAuth session so the new data shows everywhere immediately.
      await updateSession({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      });

      // Keep the legacy store in sync too (if it holds a user).
      if (user) {
        setUser(
          {
            id: user.id,
            email: updated.email,
            name: updated.name ?? null,
            phone: updated.phone ?? null,
            avatar: updated.avatar ?? null,
            role: user.role,
          },
          null
        );
      }

      // Reflect the saved values in the form fields.
      profileForm.reset({
        name: updated.name || '',
        email: updated.email || '',
        phone: updated.phone || '',
      });

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description:
          language === 'ar'
            ? 'تم تحديث بياناتك الشخصية بنجاح'
            : 'Your profile was updated successfully',
      });

      setIsEditingProfile(false);
    } catch (error) {
      // Keep edit mode open and tell the user what went wrong.
      toast({
        title: language === 'ar' ? 'تعذّر الحفظ' : 'Save failed',
        description:
          error instanceof Error
            ? error.message
            : language === 'ar'
              ? 'حدث خطأ أثناء حفظ البيانات'
              : 'Something went wrong while saving',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    setPasswordSuccess(false);
    setPasswordError(null);

    try {
      if (onPasswordChange) {
        await onPasswordChange(data);
      }

      const res = await csrfFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to change password');
      }

      setPasswordSuccess(true);
      passwordForm.reset();

      setTimeout(() => {
        setIsPasswordDialogOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'فشل تغيير كلمة المرور');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAddressSave = async (data: AddressFormData) => {
    setIsSavingAddress(true);

    try {
      if (onAddressAdd) {
        await onAddressAdd(data);
      }

      const res = await csrfFetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add address');
      }

      await fetchAddresses();
      addressForm.reset();
      setIsAddressDialogOpen(false);
    } catch (error) {
      // keep dialog open on failure
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      if (onAddressDelete) {
        await onAddressDelete(addressId);
      }
      const res = await csrfFetch(`/api/addresses/${addressId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      // ignore
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    try {
      const res = await csrfFetch(`/api/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setDefaultOnly: true }),
      });
      if (res.ok) {
        await fetchAddresses();
      }
    } catch (error) {
      // ignore
    }
  };
  
  const getAddressIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('home')) return Home;
    if (lowerLabel.includes('work') || lowerLabel.includes('office')) return Briefcase;
    return MapPinned;
  };
  
  // Get user initials for avatar
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';
  
  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {language === 'ar' ? 'الملف الشخصي' : 'My Profile'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar'
              ? 'إدارة معلومات حسابك وعناوينك'
              : 'Manage your account information and addresses'}
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'معلومات الحساب' : 'Account Information'}
                </CardTitle>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                    className="rounded-full"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isEditingProfile ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                          <Avatar className="h-20 w-20 border-2 border-primary">
                            <AvatarImage src={user?.image || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {language === 'ar' ? 'صورة الملف' : 'Profile Picture'}
                            </p>
                            <Button variant="link" className="p-0 h-auto text-primary">
                              {language === 'ar' ? 'تغيير الصورة' : 'Change photo'}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {language === 'ar' ? 'الاسم' : 'Name'}
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      placeholder={language === 'ar' ? 'الاسم' : 'Name'}
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
                            control={profileForm.control}
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
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {language === 'ar' ? 'رقم الجوال' : 'Phone'}
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
                        
                        <div className="flex gap-2 pt-2">
                          <Button type="submit" disabled={isSavingProfile} className="rounded-full">
                            {isSavingProfile ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {language === 'ar' ? 'حفظ' : 'Save'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditingProfile(false);
                              profileForm.reset();
                            }}
                            className="rounded-full"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-4"
                  >
                    <Avatar className="h-20 w-20 border-2 border-primary">
                      <AvatarImage src={user?.image || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-semibold text-lg">
                          {user?.name || (language === 'ar' ? 'مستخدم' : 'User')}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {user?.email || 'user@example.com'}
                        </p>
                      </div>
                      {user?.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPasswordDialogOpen(true)}
                        className="rounded-full"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          
          {/* Address Book */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'دليل العناوين' : 'Address Book'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddressDialogOpen(true)}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Button>
              </div>
              <CardDescription>
                {language === 'ar'
                  ? 'إدارة عناوين التوصيل الخاصة بك'
                  : 'Manage your delivery addresses'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addressesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {language === 'ar'
                      ? 'لم تقم بإضافة أي عناوين بعد'
                      : "You haven't added any addresses yet"}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setIsAddressDialogOpen(true)}
                    className="mt-2"
                  >
                    {language === 'ar' ? 'أضف عنوانك الأول' : 'Add your first address'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {addresses.map((address, index) => {
                      const AddressIcon = getAddressIcon(address.label);
                      
                      return (
                        <motion.div
                          key={address.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all',
                            address.isDefault
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                <AddressIcon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">
                                    {address.label}
                                  </span>
                                  {address.isDefault && (
                                    <Badge variant="secondary" className="text-xs">
                                      {language === 'ar' ? 'افتراضي' : 'Default'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {address.firstName} {address.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {address.address}, {address.city} {address.postalCode}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.phone}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!address.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDefaultAddress(address.id)}
                                  className="text-primary"
                                >
                                  {language === 'ar' ? 'تعيين كافتراضي' : 'Set Default'}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteAddress(address.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'أدخلي كلمة المرور الحالية والجديدة'
                : 'Enter your current and new password'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          className="pl-10 pr-10 rounded-lg"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
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
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          className="pl-10 pr-10 rounded-lg"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
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
                control={passwordForm.control}
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
              
              {/* Success Message */}
              <AnimatePresence>
                {passwordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>
                      {language === 'ar'
                        ? 'تم تغيير كلمة المرور بنجاح'
                        : 'Password changed successfully'}
                    </span>
                  </motion.div>
                )}
                {passwordError && !passwordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
                  >
                    {passwordError}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isChangingPassword} className="rounded-full flex-1">
                  {isChangingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {language === 'ar' ? 'تغيير' : 'Change'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPasswordDialogOpen(false);
                    passwordForm.reset();
                  }}
                  className="rounded-full"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'إضافة عنوان جديد' : 'Add New Address'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? 'أضيفي عنوان توصيل جديد'
                : 'Add a new delivery address'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(handleAddressSave)} className="space-y-4">
              <FormField
                control={addressForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === 'ar' ? 'اسم العنوان' : 'Address Label'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={language === 'ar' ? 'مثال: المنزل، العمل' : 'e.g. Home, Work'}
                        className="rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === 'ar' ? 'الاسم الأول' : 'First Name'}
                      </FormLabel>
                      <FormControl>
                        <Input className="rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === 'ar' ? 'الاسم الأخير' : 'Last Name'}
                      </FormLabel>
                      <FormControl>
                        <Input className="rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addressForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === 'ar' ? 'رقم الجوال' : 'Phone'}
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addressForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === 'ar' ? 'العنوان' : 'Street Address'}
                    </FormLabel>
                    <FormControl>
                      <Input className="rounded-lg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === 'ar' ? 'المدينة' : 'City'}
                      </FormLabel>
                      <FormControl>
                        <Input className="rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {language === 'ar' ? 'الرمز البريدي' : 'Postal Code'}
                      </FormLabel>
                      <FormControl>
                        <Input className="rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSavingAddress} className="rounded-full flex-1">
                  {isSavingAddress ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {language === 'ar' ? 'إضافة' : 'Add Address'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddressDialogOpen(false);
                    addressForm.reset();
                  }}
                  className="rounded-full"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
