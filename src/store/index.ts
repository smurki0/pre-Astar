import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface Product {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  comparePrice: number | null;
  sku: string;
  quantity: number;
  categoryId: string;
  images: { id: string; url: string; alt: string | null }[];
  variants: { id: string; name: string; color: string | null; colorHex: string | null; size: string | null; price: number | null; quantity: number }[];
  category?: { id: string; nameEn: string; nameAr: string };
  featured: boolean;
  active: boolean;
}

export interface CartItem {
  productId: string;
  product: Product;
  variantId: string | null;
  quantity: number;
}

export interface WishlistItem {
  productId: string;
  product: Product;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    variantName: string | null;
    price: number;
    quantity: number;
  }[];
}

// Cart Store
interface CartStore {
  items: CartItem[];
  addItem: (product: Product, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, variantId, quantity) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.productId === product.id && item.variantId === variantId
          );
          
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id && item.variantId === variantId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          
          return {
            items: [...state.items, { productId: product.id, product, variantId, quantity }],
          };
        });
      },
      
      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          ),
        }));
      },
      
      updateQuantity: (productId, variantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const variant = item.product.variants.find((v) => v.id === item.variantId);
          const price = variant?.price ?? item.product.price;
          return total + price * item.quantity;
        }, 0);
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'estar-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Wishlist Store
interface WishlistStore {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        set((state) => {
          if (state.items.some((item) => item.productId === product.id)) {
            return state;
          }
          return { items: [...state.items, { productId: product.id, product }] };
        });
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },
      
      isInWishlist: (productId) => {
        return get().items.some((item) => item.productId === productId);
      },
    }),
    {
      name: 'estar-wishlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// User Store
interface UserStore {
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useUserStore = create<UserStore>()(
  (set, get) => ({
    user: null,
    token: null,
    
    setUser: (user, token) => set({ user, token }),
    
    logout: () => set({ user: null, token: null }),
    
    isAuthenticated: () => get().user !== null,
    
    isAdmin: () => get().user?.role === 'admin',
  })
);

// 🚨 DEPRECATED: useUserStore - Use useSession() from NextAuth everywhere
// This store exists for legacy cart/UI sync only - will be removed in v2
if (typeof window !== 'undefined') {
  console.warn('useUserStore is DEPRECATED - migrate to useSession() from @/hooks/useSession');
}

// UI Store
interface UIStore {
  isMenuOpen: boolean;
  isCartOpen: boolean;
  isSearchOpen: boolean;
  language: 'en' | 'ar';
  setMenuOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  toggleLanguage: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      isMenuOpen: false,
      isCartOpen: false,
      isSearchOpen: false,
      language: 'ar', // Default to Arabic
      
      setMenuOpen: (open) => set({ isMenuOpen: open }),
      setCartOpen: (open) => set({ isCartOpen: open }),
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set({ language: get().language === 'en' ? 'ar' : 'en' }),
    }),
    {
      name: 'estar-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ language: state.language }),
    }
  )
);

// Compare Store
interface CompareStore {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
  getMaxItems: () => number;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        set((state) => {
          // Maximum 4 products for comparison
          if (state.items.length >= 4) {
            return state;
          }
          if (state.items.some((item) => item.productId === product.id)) {
            return state;
          }
          return { items: [...state.items, { productId: product.id, product }] };
        });
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },
      
      isInCompare: (productId) => {
        return get().items.some((item) => item.productId === productId);
      },
      
      clearCompare: () => set({ items: [] }),
      
      getMaxItems: () => 4,
    }),
    {
      name: 'estar-compare',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
