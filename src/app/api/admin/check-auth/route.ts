import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, getUserFromRequest } from '@/lib/auth'

// GET /api/admin/check-auth - Server-side admin auth check
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json({ 
        isAdmin: false, 
        user: null,
        token: null,
        message: 'غير مصرح - لا جلسة'
      })
    }
    
    const isAdminUser = user.role === 'admin'
    
    return NextResponse.json({ 
      isAdmin: isAdminUser,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: isAdminUser ? 'أدمن مصرح' : 'حساب عادي'
    })
    
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json({ 
      isAdmin: false,
      message: 'خطأ في التحقق'
    }, { status: 500 })
  }
}

