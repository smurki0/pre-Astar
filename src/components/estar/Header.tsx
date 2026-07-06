'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Package,
  Settings,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCartStore, useWishlistStore, useUIStore } from '@/store'
import { useSession } from '@/hooks/useSession'
import { useLanguage } from '@/lib/i18n'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { cn } from '@/lib/utils'
import { CartDrawer } from './CartDrawer'

const navigationItems = [
  { key: 'nav.home', view: 'home' },
  { key: 'nav.shop', view: 'shop' },
  { key: 'nav.categories', view: 'shop' },
  { key: 'nav.about', view: 'about' },
  { key: 'nav.contact', view: 'contact' },
] as const

export function Header() {
  const { theme, setTheme } = useTheme()
  const { language, toggleLanguage, t, isRTL, dir } = useLanguage()
  const { settings } = useSiteSettings()
  const { items: cartItems, getItemCount } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()

  const { user, isAuthenticated, isAdmin, logout: authLogout } = useSession()
  

  const { isMenuOpen, setMenuOpen } = useUIStore()

  const [mounted, setMounted] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [cartOpen, setCartOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [cartItemCount, setCartItemCount] = React.useState(0)
  const [wishlistCount, setWishlistCount] = React.useState(0)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Update cart and wishlist counts when items change
  React.useEffect(() => {
    if (mounted) {
      setCartItemCount(getItemCount())
      setWishlistCount(wishlistItems.length)
    }
  }, [mounted, cartItems, wishlistItems, getItemCount])
  
  // Get settings values
  const siteNameEn = settings.site_name_en || 'Astar'
  const siteNameAr = settings.site_name_ar || 'استآر'
  const siteLogo = settings.site_logo
  const announcementText = language === 'ar' ? settings.announcement_text_ar : settings.announcement_text_en
  const announcementEnabled = settings.announcement_enabled === 'true'
  const freeShippingThreshold = parseFloat(settings.free_shipping_threshold) || 200
  const currencySymbol = settings.currency_symbol || 'ج.م'
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/?view=shop&search=${encodeURIComponent(searchQuery)}`
    }
  }
  
  const handleLogout = () => {
    authLogout()
  }
  
  const navItems = navigationItems.map((item) => ({
    ...item,
    label: t(item.key) as string,
  }))
  
  return (
    <>
      <header 
        className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        dir={dir}
      >
        {/* Top banner */}
        {announcementEnabled && announcementText && (
          <div className="bg-primary text-white text-center py-1.5 text-xs sm:text-sm">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {announcementText}
            </motion.span>
          </div>
        )}
        
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setMenuOpen} modal={false}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side={isRTL ? 'right' : 'left'} className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {siteLogo ? (
                      <img src={siteLogo} alt={siteNameEn} className="h-8 w-auto" />
                    ) : (
                      <>
                        <span className="font-serif text-2xl text-primary">{siteNameEn}</span>
                        <span className="text-lg text-gray-500">{siteNameAr}</span>
                      </>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={`/?view=${item.view}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>
                
                {/* Mobile User Section */}
                <div className="mt-8 pt-8 border-t border-border">
                  {!mounted ? (
                    <div className="flex items-center justify-center py-4">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ) : isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user?.name || user?.email || 'User'}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full justify-start gap-2" asChild>
                        <Link href="/?view=profile">
                          <Settings className="h-4 w-4" />
                          {t('nav.profile')}
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2" asChild>
                        <Link href="/?view=orders">
                          <Package className="h-4 w-4" />
                          {t('nav.orders')}
                        </Link>
                      </Button>
                      {isAdmin && (
                        <Button variant="outline" className="w-full justify-start gap-2 text-primary" asChild>
                          <Link href="/?view=admin&section=dashboard">
                            <Shield className="h-4 w-4" />
                            {t('nav.admin')}
                          </Link>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4" />
                        {t('nav.logout')}
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full" asChild>
                      <Link href="/?view=login">{t('nav.login')}</Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                {siteLogo ? (
                  <img src={siteLogo} alt={siteNameEn} className="h-8 md:h-10 w-auto" />
                ) : (
                  <>
                    <span className="font-serif text-2xl md:text-3xl text-primary font-semibold tracking-tight">
                      {siteNameEn}
                    </span>
                    <span className="hidden sm:inline text-lg md:text-xl text-gray-500">
                      {siteNameAr}
                    </span>
                  </>
                )}
              </motion.div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={`/?view=${item.view}`}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-accent/50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            
            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search - Desktop */}
              <AnimatePresence>
                {searchOpen && (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSearch}
                    className="hidden md:flex items-center overflow-hidden"
                  >
                    <Input
                      type="search"
                      placeholder={t('header.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[200px] lg:w-[280px] h-9 rounded-r-none border-r-0"
                      autoFocus
                    />
                    <Button type="submit" size="icon" variant="outline" className="h-9 rounded-l-none">
                      <Search className="h-4 w-4" />
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
              
              {/* Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                <span className="sr-only">Toggle search</span>
              </Button>
              
              {/* Mobile Search */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="top" className="h-auto">
                  <SheetHeader>
                    <SheetTitle>{t('search.title')}</SheetTitle>
                  </SheetHeader>
                  <form onSubmit={handleSearch} className="mt-4 flex gap-2">
                    <Input
                      type="search"
                      placeholder={t('header.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                </SheetContent>
              </Sheet>
              
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="text-xs font-semibold"
              >
                {language === 'en' ? 'AR' : 'EN'}
                <span className="sr-only">Toggle language</span>
              </Button>
              
              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              )}
              
              {/* Wishlist */}
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/?view=wishlist">
                  <Heart className="h-5 w-5" />
                  {mounted && wishlistCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                    >
                      {wishlistCount}
                    </Badge>
                  )}
                  <span className="sr-only">{t('nav.wishlist')}</span>
                </Link>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {mounted && cartItemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  >
                    {cartItemCount}
                  </Badge>
                )}
                <span className="sr-only">{t('nav.cart')}</span>
              </Button>
              
              {/* User Menu - Desktop */}
              <div className="hidden lg:block">
                {!mounted ? (
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">{t('nav.profile')}</span>
                  </Button>
                ) : isAuthenticated ? (
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                        <span className="sr-only">{t('nav.profile')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{user?.name || user?.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/?view=profile" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          {t('nav.profile')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/?view=orders" className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          {t('nav.orders')}
                        </Link>
                      </DropdownMenuItem>
                      {user?.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/?view=admin&section=dashboard" className="cursor-pointer text-primary">
                              <Shield className="mr-2 h-4 w-4" />
                              {t('nav.admin')}
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('nav.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="ghost" asChild>
                    <Link href="/?view=login">
                      <User className="h-5 w-5 mr-1" />
                      <span className="hidden sm:inline">{t('nav.login')}</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  )
}
