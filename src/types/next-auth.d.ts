import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

// Extend the default session and user types
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
      phone?: string | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    phone?: string | null
  }
}

// Extend the JWT type
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string
    role?: string
    phone?: string | null
  }
}

// Extend the NextAuth options type
declare module 'next-auth' {
  interface Profile {
    id?: string
    email?: string
    name?: string
    image?: string
  }
}
