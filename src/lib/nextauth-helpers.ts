import { getServerSession } from 'next-auth'
import { authOptions } from './nextauth'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function getAdminSession(request?: NextRequest) {
  const session = await getServerSession(authOptions)
  return session
}

export async function requireAdminSession(request: NextRequest): Promise<any | NextResponse> {
  const session = await getAdminSession(request)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  return session.user
}
