import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, generateToken, setAuthCookie, AuthUser } from '@/lib/auth';
import { cookies } from 'next/headers';

// POST /api/admin/login - Admin-only login for maintenance bypass
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }
    
    // Find admin user
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        isBlocked: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'حساب غير موجود' },
        { status: 401 }
      );
    }
    
    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'الحساب محظور' },
        { status: 403 }
      );
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }
    
    // **ADMIN ONLY CHECK**
    if (user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: '🚫 حساب عادي غير مسموح بالدخول أثناء الصيانة',
          message: 'تسجيل الدخول متاح للأدمن فقط أثناء الصيانة'
        },
        { status: 403 }
      );
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      } as AuthUser,
      message: 'تم تسجيل الدخول بنجاح كأدمن',
    });
    
    setAuthCookie(response, token);
    
    return response;
    
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'خطأ في تسجيل الدخول' },
      { status: 500 }
    );
  }
}

