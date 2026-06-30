'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
  // Optional: refetch interval in seconds
  refetchInterval?: number
  // Optional: refetch on window focus
  refetchOnWindowFocus?: boolean
}

export function SessionProvider({ 
  children, 
  refetchInterval = 0,
  refetchOnWindowFocus = true 
}: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      refetchInterval={refetchInterval}
      refetchOnWindowFocus={refetchOnWindowFocus}
    >
      {children}
    </NextAuthSessionProvider>
  )
}

export default SessionProvider
