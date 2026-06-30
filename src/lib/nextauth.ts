import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import bcrypt from 'bcryptjs'

// NextAuth Configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@astar.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان')
        }

        // Find user in database
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        }

        // Check if user is blocked
        if (user.isBlocked) {
          throw new Error('تم حظر حسابك. يرجى التواصل مع الدعم الفني')
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValidPassword) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
          phone: user.phone,
        }
      },
    }),
  ],
  
  callbacks: {
    // JWT callback - called whenever a token is created/updated
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.phone = user.phone
      }

      // Update session (e.g., when user updates their profile)
      if (trigger === 'update' && session) {
        token.name = session.name
        token.email = session.email
        token.phone = session.phone
      }

      // Refresh user data from database periodically
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            avatar: true,
            isBlocked: true,
          },
        })

        if (dbUser && !dbUser.isBlocked) {
          token.role = dbUser.role
          token.name = dbUser.name
          token.email = dbUser.email
          token.phone = dbUser.phone
          token.picture = dbUser.avatar
        } else if (dbUser?.isBlocked) {
          // User has been blocked, invalidate session
          return {} as typeof token
        }
      }

      return token
    },

    // Session callback - called whenever session is checked
    async session({ session, token }) {
      if (token && token.id) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          phone: token.phone as string | null,
        }
      }
      return session
    },

    // SignIn callback - called on sign in
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        return true
      }
      return false
    },
  },

  pages: {
    signIn: '/?view=login',
    error: '/?view=auth-error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'astar-nextauth-secret-key',

  debug: process.env.NODE_ENV === 'development',
}

// Export NextAuth handler types
export type AuthSession = {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: string
    phone?: string | null
  }
  expires: string
}

// Helper functions
export async function getServerSession() {
  const { getServerSession: getSession } = await import('next-auth')
  return getSession(authOptions)
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession()
  return session?.user?.role === 'admin'
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession()
  return !!session?.user
}

// Get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession()
  return session?.user?.id || null
}
