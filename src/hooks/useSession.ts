'use client'

import { useSession as useNextAuthSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

// Extended user type with custom fields
interface ExtendedUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: string
  phone?: string | null
}

interface UseSessionReturn {
  user: ExtendedUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateSession: (data: { name?: string; email?: string; phone?: string }) => Promise<void>
}

// Custom hook for authentication
export function useSession(): UseSessionReturn {
  const { data: session, status, update } = useNextAuthSession()
  const router = useRouter()

  const user = session?.user as ExtendedUser | undefined

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        return { success: false, error: result.error }
      }

      if (result?.ok) {
        router.refresh()
        return { success: true }
      }

      return { success: false, error: 'حدث خطأ غير متوقع' }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'حدث خطأ في الاتصال' }
    }
  }, [router])

  // Logout function
  const logout = useCallback(async () => {
    await signOut({ redirect: false })
    router.refresh()
    router.push('/')
  }, [router])

  // Update session data
  const updateSession = useCallback(async (data: { name?: string; email?: string; phone?: string }) => {
    await update(data)
  }, [update])

  return {
    user: user || null,
    isAuthenticated: status === 'authenticated',
    isAdmin: user?.role === 'admin',
    isLoading: status === 'loading',
    login,
    logout,
    updateSession,
  }
}

// Admin-only hook - returns null if not admin
export function useAdminSession() {
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useSession()

  if (!isLoading && (!isAuthenticated || !isAdmin)) {
    return null
  }

  return {
    user,
    isLoading,
    logout,
  }
}

export default useSession
