'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/estar/Header'
import { Footer } from '@/components/estar/Footer'
import { HeroSection } from '@/components/estar/HeroSection'
import { FeaturedProducts } from '@/components/estar/FeaturedProducts'
import { CategoriesSection } from '@/components/estar/CategoriesSection'
import { TestimonialsSection } from '@/components/estar/TestimonialsSection'
import { NewsletterSection } from '@/components/estar/NewsletterSection'
import { ProductGrid } from '@/components/estar/ProductGrid'
import { type FilterState } from '@/components/estar/ProductFilters'
import { PromoBanners } from '@/components/estar/PromoBanners'
// Admin dashboard is heavy (recharts, tables, dnd, editors) and only used by
// admins. Load it lazily so normal shoppers never download this JS.
// ssr:false keeps these out of the server bundle too. Behavior unchanged.
import dynamic from 'next/dynamic'
const AdminLayout = dynamic(() => import('@/components/estar/AdminLayout').then(m => m.AdminLayout), { ssr: false })
const AdminStats = dynamic(() => import('@/components/estar/AdminStats').then(m => m.AdminStats), { ssr: false })
const AdminProducts = dynamic(() => import('@/components/estar/AdminProducts').then(m => m.AdminProducts), { ssr: false })
const AdminOrders = dynamic(() => import('@/components/estar/AdminOrders').then(m => m.AdminOrders), { ssr: false })
const AdminUsers = dynamic(() => import('@/components/estar/AdminUsers').then(m => m.AdminUsers), { ssr: false })
const AdminDiscounts = dynamic(() => import('@/components/estar/AdminDiscounts').then(m => m.AdminDiscounts), { ssr: false })
const AdminSettings = dynamic(() => import('@/components/estar/AdminSettings').then(m => m.AdminSettings), { ssr: false })
const AdminBanners = dynamic(() => import('@/components/estar/AdminBanners').then(m => m.AdminBanners), { ssr: false })
const AdminCategories = dynamic(() => import('@/components/estar/AdminCategories').then(m => m.AdminCategories), { ssr: false })
const AdminContactMessages = dynamic(() => import('@/components/estar/AdminContactMessages').then(m => m.AdminContactMessages), { ssr: false })
const AdminNewsletter = dynamic(() => import('@/components/estar/AdminNewsletter').then(m => m.AdminNewsletter), { ssr: false })
const AdminReviews = dynamic(() => import('@/components/estar/AdminReviews').then(m => m.AdminReviews), { ssr: false })

// Secondary views (framer-motion heavy, not first paint). Lazy-loaded so the
// home page ships less JS; each loads instantly on first navigation to it.
const ProductDetails = dynamic(() => import('@/components/estar/ProductDetails').then(m => m.ProductDetails), { ssr: false })
const ProductFilters = dynamic(() => import('@/components/estar/ProductFilters').then(m => m.ProductFilters), { ssr: false })
const CheckoutForm = dynamic(() => import('@/components/estar/CheckoutForm').then(m => m.CheckoutForm), { ssr: false })
const AuthModal = dynamic(() => import('@/components/estar/AuthModal').then(m => m.AuthModal), { ssr: false })
const UserProfile = dynamic(() => import('@/components/estar/UserProfile').then(m => m.UserProfile), { ssr: false })
const AboutPage = dynamic(() => import('@/components/estar/AboutPage').then(m => m.AboutPage), { ssr: false })
const ContactPage = dynamic(() => import('@/components/estar/ContactPage').then(m => m.ContactPage), { ssr: false })
import { CartDrawer } from '@/components/estar/CartDrawer'
import { ThemeProvider } from '@/components/estar/ThemeProvider'
import { I18nProvider as LanguageProvider } from '@/lib/i18n'
import { SiteSettingsProvider, useSiteSettings } from '@/hooks/useSiteSettings'
import { useCartStore, useWishlistStore } from '@/store'
import { useSession } from '@/hooks/useSession'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  ArrowLeft,
  Package,
  Search,
  Grid3X3,
  LayoutGrid,
  ChevronRight,
  Home as HomeIcon,
  User,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type ViewType = 
  | 'home' 
  | 'shop' 
  | 'product' 
  | 'cart' 
  | 'checkout' 
  | 'wishlist' 
  | 'about' 
  | 'contact' 
  | 'login' 
  | 'profile' 
  | 'orders' 
  | 'admin'

type AdminSection = 'dashboard' | 'products' | 'orders' | 'users' | 'discounts' | 'settings' | 'banners' | 'categories' | 'contact' | 'newsletter' | 'reviews'

// Main App Component
function AppContent() {
  // Theme-based background gradients were removed; keep original theming behavior
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get current view from URL params
  const view = (searchParams.get('view') as ViewType) || 'home'
  const productId = searchParams.get('id')
  const categoryParam = searchParams.get('category')
  const searchParam = searchParams.get('search')
  const adminSection = (searchParams.get('section') as AdminSection) || 'dashboard'
  
  // Stores
  const { items: cartItems, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  const { items: wishlistItems } = useWishlistStore()
  const session = useSession()
  const { isAuthenticated, isAdmin, isLoading: sessionLoading } = session
  
  // Mounted state for hydration
  const [mounted, setMounted] = React.useState(false)
  
  // UI State
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const [filters, setFilters] = React.useState<FilterState>({
    categories: categoryParam ? [categoryParam] : [],
    priceRange: [0, 10000],
    sizes: [],
    colors: [],
    sort: 'newest',
  })
  const [searchQuery, setSearchQuery] = React.useState(searchParam || '')
  const [gridView, setGridView] = React.useState<'grid' | 'list'>('grid')
  
  // Set mounted after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Scroll to top whenever the "view" changes. The whole app lives on a single
  // route ("/") and only swaps content via ?view= query params, so Next.js does
  // NOT auto-reset scroll. Without this, clicking a link near the bottom changes
  // the URL and content but leaves the viewport where it was, so it looks like
  // the page never navigated.
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    // Safeguard against the Radix "stuck body lock" bug: modal menus/dialogs
    // (DropdownMenu, Sheet, Dialog) set `pointer-events: none` on <body> while
    // open and clear it on close. Navigating via a <Link> inside an open menu
    // unmounts it mid-close, so the lock can get stuck and the whole page stops
    // responding to clicks (works only on the 2nd click). Clear it on every
    // navigation.
    if (typeof document !== 'undefined') {
      document.body.style.pointerEvents = ''
    }
  }, [view, productId, adminSection])
  
  // Update filters when category param changes
  React.useEffect(() => {
    if (categoryParam) {
      setFilters(prev => ({
        ...prev,
        categories: [categoryParam],
      }))
    }
  }, [categoryParam])
  
  // Update search query when search param changes
  React.useEffect(() => {
    if (searchParam) {
      setSearchQuery(searchParam)
    }
  }, [searchParam])
  
  // Navigation helper
  const navigateTo = (newView: ViewType, params?: Record<string, string>) => {
    const urlParams = new URLSearchParams()
    urlParams.set('view', newView)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        urlParams.set(key, value)
      })
    }
    router.push(`/?${urlParams.toString()}`)
  }

  // Render based on current view
  const renderContent = () => {
    if (view === 'admin') {
      return (
        <AdminLayout>
          {adminSection === 'dashboard' && <AdminStats />}
          {adminSection === 'products' && <AdminProducts />}
          {adminSection === 'orders' && <AdminOrders />}
          {adminSection === 'users' && <AdminUsers />}
          {adminSection === 'discounts' && <AdminDiscounts />}
          {adminSection === 'settings' && <AdminSettings />}
          {adminSection === 'banners' && <AdminBanners />}
          {adminSection === 'categories' && <AdminCategories />}
          {adminSection === 'contact' && <AdminContactMessages />}
          {adminSection === 'newsletter' && <AdminNewsletter />}
          {adminSection === 'reviews' && <AdminReviews />}
        </AdminLayout>
      )
    }

    // Regular routes with header and footer
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          {view === 'home' && <HomePage navigateTo={navigateTo} />}
          {view === 'shop' && (
            <ShopPage 
              navigateTo={navigateTo} 
              filters={filters} 
              setFilters={setFilters} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              gridView={gridView} 
              setGridView={setGridView} 
              categoryParam={categoryParam} 
            />
          )}
          {view === 'product' && productId && <ProductPage productId={productId} navigateTo={navigateTo} />}
          {view === 'cart' && <CartPage navigateTo={navigateTo} />}
          {view === 'checkout' && <CheckoutPage navigateTo={navigateTo} />}
          {view === 'wishlist' && <WishlistPage navigateTo={navigateTo} />}
          {view === 'about' && <AboutPage />}
          {view === 'contact' && <ContactPage />}
          {view === 'login' && <LoginPage navigateTo={navigateTo} />}
          {view === 'profile' && <ProfilePage navigateTo={navigateTo} />}
          {view === 'orders' && <OrdersPage navigateTo={navigateTo} />}
        </main>
        {/* Admin-managed promotional banners (position: footer) shown above the site footer */}
        <PromoBanners position="footer" title="Special Offers" titleAr="عروض خاصة" />
        <Footer />
      </div>
    )
  }

  // Main render
  return (
    <>
      {renderContent()}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}

// Home Page Component
function HomePage({ navigateTo }: { navigateTo: (view: ViewType, params?: Record<string, string>) => void }) {
  const { settings } = useSiteSettings()
  
  const showTestimonials = settings.show_testimonials !== 'false'
  const showNewsletter = settings.show_newsletter !== 'false'
  const featuredProductsCount = parseInt(settings.featured_products_count) || 8
  
  return (
    <>
      <HeroSection />
      <FeaturedProducts 
        title="Featured Products" 
        titleAr="منتجات مميزة" 
        limit={featuredProductsCount} 
      />
      <CategoriesSection title="Shop by Category" titleAr="تسوقي حسب الفئة" limit={6} />
      {showTestimonials && (
        <TestimonialsSection title="What Our Customers Say" titleAr="ماذا يقول عملاؤنا" />
      )}
      {showNewsletter && (
        <NewsletterSection
          title="Subscribe to Our Newsletter"
          titleAr="اشتركي في نشرتنا البريدية"
          subtitle="Get exclusive offers, beauty tips, and 10% off your first order"
          subtitleAr="احصلي على عروض حصرية ونصائح جمالية وخصم 10% على طلبك الأول"
        />
      )}
    </>
  )
}

// Shop Page Component
function ShopPage({ 
  navigateTo, 
  filters, 
  setFilters, 
  searchQuery, 
  setSearchQuery,
  gridView,
  setGridView,
  categoryParam,
}: { 
  navigateTo: (view: ViewType, params?: Record<string, string>) => void
  filters: FilterState
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
  searchQuery: string
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>
  gridView: 'grid' | 'list'
  setGridView: React.Dispatch<React.SetStateAction<'grid' | 'list'>>
  categoryParam?: string | null
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">المتجر</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">تسوقي مجموعتنا</h1>
        <p className="text-muted-foreground">اكتشفي أحدث صيحات الموضة المحتشمة</p>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={gridView === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setGridView('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={gridView === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setGridView('list')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="lg:w-64 shrink-0 space-y-6">
          <ProductFilters 
            onFilterChange={setFilters}
            initialCategory={categoryParam || undefined}
          />
          {/* Admin-managed promotional banners (position: sidebar) */}
          <PromoBanners position="sidebar" />
        </div>

        {/* Products Grid */}
        <div className="flex-1 relative">
          <ProductGrid 
            filters={filters} 
            searchQuery={searchQuery}
            gridView={gridView}
            onProductClick={(id) => navigateTo('product', { id })}
          />
        </div>
      </div>
    </div>
  )
}

// Product Page Component
function ProductPage({ productId, navigateTo }: { productId: string; navigateTo: (view: ViewType, params?: Record<string, string>) => void }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetails productId={productId} />
    </div>
  )
}

// Cart Page Component
function CartPage({ navigateTo }: { navigateTo: (view: ViewType, params?: Record<string, string>) => void }) {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">سلة التسوق فارغة</h1>
          <p className="text-muted-foreground mb-6">لم تقومي بإضافة أي منتجات بعد</p>
          <Button onClick={() => navigateTo('shop')} size="lg">
            تسوقي الآن
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">سلة التسوق</span>
      </nav>

      <h1 className="text-3xl font-bold text-foreground mb-8">سلة التسوق</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={`${item.productId}-${item.variantId}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0">
                    {item.product.images?.[0]?.url ? (
                      <img 
                        src={item.product.images[0].url} 
                        alt={item.product.nameAr}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{item.product.nameAr}</h3>
                    <p className="text-sm text-muted-foreground">{item.product.nameEn}</p>
                    {item.variantId && (
                      <p className="text-sm text-muted-foreground mt-1">
                        المقاس: {item.product.variants.find(v => v.id === item.variantId)?.size || '-'}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <span className="font-medium text-primary">
                        {((item.product.variants.find(v => v.id === item.variantId)?.price || item.product.price) * item.quantity).toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.productId, item.variantId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button variant="outline" onClick={clearCart} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            إفراغ السلة
          </Button>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-muted-foreground">
                <span>المجموع الفرعي</span>
                <span>{getTotal().toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>الشحن</span>
                <span>سيحسب عند الدفع</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>الإجمالي</span>
                <span>{getTotal().toLocaleString()} ج.م</span>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => navigateTo('checkout')}
              >
                إتمام الشراء
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigateTo('shop')}
              >
                متابعة التسوق
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Checkout Page Component
function CheckoutPage({ navigateTo }: { navigateTo: (view: ViewType, params?: Record<string, string>) => void }) {
  const { items, getTotal, clearCart } = useCartStore()
  const [orderPlaced, setOrderPlaced] = React.useState(false)

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">لا توجد منتجات للدفع</h1>
          <Button onClick={() => navigateTo('shop')} className="mt-4">
            تسوقي الآن
          </Button>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تم تقديم طلبك بنجاح!</h1>
          <p className="text-muted-foreground mb-6">
            شكراً لك! سيتم التواصل معك قريباً لتأكيد الطلب
          </p>
          <Button onClick={() => navigateTo('orders')}>
            عرض طلباتي
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CheckoutForm 
        onSuccess={() => {
          clearCart()
          setOrderPlaced(true)
        }}
      />
    </div>
  )
}

// Wishlist Page Component
function WishlistPage({ navigateTo }: { navigateTo: (view: ViewType, params?: Record<string, string>) => void }) {
  const { items, removeItem } = useWishlistStore()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">قائمة المفضلة فارغة</h1>
          <p className="text-muted-foreground mb-6">لم تقومي بإضافة أي منتجات للمفضلة بعد</p>
          <Button onClick={() => navigateTo('shop')} size="lg">
            تسوقي الآن
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">المفضلة</span>
      </nav>

      <h1 className="text-3xl font-bold text-foreground mb-8">
        قائمة المفضلة
        <Badge variant="secondary" className="mr-3">{items.length}</Badge>
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((item) => (
          <Card key={item.productId} className="group relative overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-[3/4] bg-muted">
                {item.product.images?.[0]?.url ? (
                  <img 
                    src={item.product.images[0].url} 
                    alt={item.product.nameAr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-destructive hover:text-destructive"
                  onClick={() => removeItem(item.productId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-foreground text-sm mb-1 line-clamp-2">
                  {item.product.nameAr}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{item.product.nameEn}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">
                    {item.product.price.toLocaleString()} ج.م
                  </span>
                </div>
                <Button 
                  className="w-full mt-3" 
                  size="sm"
                  onClick={() => navigateTo('product', { id: item.productId })}
                >
                  عرض المنتج
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Login Page Component
function LoginPage({ navigateTo }: { navigateTo: (view: ViewType, params?: Record<string, string>) => void }) {
  const session = useSession()
  const isAuthenticated = session.isAuthenticated
  
  // Local state
  const [isLogin, setIsLogin] = React.useState(true)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  
  React.useEffect(() => {
    if (isAuthenticated) {
      navigateTo('home')
    }
  }, [isAuthenticated, navigateTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      if (isLogin) {
        // Login
        const result = await session.login(email, password)
        if (result.success) {
          const user = session.user
          if (user?.role === 'admin') {
            navigateTo('admin', { section: 'dashboard' })
          } else {
            navigateTo('home')
          }
        } else {
          setError(result.error || 'خطأ في تسجيل الدخول')
        }
      } else {
        // Register then auto-login
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name, email, password, phone }),
        })
        
        if (!registerResponse.ok) {
          const regData = await registerResponse.json()
          setError(regData.error || 'خطأ في إنشاء الحساب')
          return
        }
        
        // Auto-login
        const result = await session.login(email, password)
        if (result.success) {
          navigateTo('home')
        } else {
          setError(result.error || 'تم الإنشاء لكن خطأ في تسجيل الدخول')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الاسم الكامل</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أدخلي اسمك"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">رقم الهاتف</label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="أدخل رقم الهاتف"
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'جاري التحميل...' : isLogin ? 'دخول' : 'إنشاء حساب'}
            </Button>
          </form>
          <Separator className="my-6" />
          <div className="text-center">
            <span className="text-muted-foreground">
              {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            </span>{' '}
            <Button
              type="button"
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="h-auto p-0"
            >
              {isLogin ? 'إنشاء حساب' : 'تسجيل الدخول'}
            </Button>
          </div>
          
        </CardContent>
      </Card>
    </div>
  )
}

// Profile Page Component
function ProfilePage({ navigateTo }: { navigateTo: (view: ViewType, params?: Record<string, string>) => void }) {
  const { user, isAuthenticated, logout } = useSession()

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigateTo('login')
    }
  }, [isAuthenticated, navigateTo])

  if (!user) return null

  return <UserProfile />
}

// Orders Page Component
function OrdersPage({ navigateTo }: { navigateTo: (view: ViewType, params?: Record<string, string>) => void }) {
  const session = useSession()
  const { isAuthenticated } = session
  const [orders, setOrders] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigateTo('login')
    } else {
      fetchOrders()
    }
  }, [isAuthenticated, navigateTo])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    pending: { label: 'معلق', color: 'bg-amber-100 text-amber-700' },
    processing: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-700' },
    shipped: { label: 'تم الشحن', color: 'bg-violet-100 text-violet-700' },
    delivered: { label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={() => navigateTo('home')} className="hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4" />
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">طلباتي</span>
      </nav>

      <h1 className="text-3xl font-bold text-foreground mb-8">طلباتي</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">لا توجد طلبات</h2>
          <p className="text-muted-foreground mb-6">لم تقومي بأي طلبات بعد</p>
          <Button onClick={() => navigateTo('shop')}>
            تسوقي الآن
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-primary">#{order.orderNumber}</span>
                      <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-700'}>
                        {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.items?.map((i: any) => `${i.productName}${i.variantName ? ` (${i.variantName})` : ''} × ${i.quantity}`).join('، ')}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="font-semibold text-lg">{order.total?.toLocaleString()} ج.م</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Main Page Export
export default function Home() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  )
}
