import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    // Basic validation
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    // Email format simple check
    const emailRegex = /\S+@\S+\.\S+/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    // Check for existing user
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'يوجد حساب بهذا البريد الإلكتروني بالفعل' }, { status: 409 })
    }

    // Hash password
    const hashed = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        password: hashed,
        role: 'customer',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json({ error: 'خطأ في إنشاء الحساب' }, { status: 500 })
  }
}
