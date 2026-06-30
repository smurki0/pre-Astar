import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/auth/me - Get current user
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/me - Update the current user's profile (name, phone, email).
// Writes to the User table so the admin dashboard sees the same data.
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (name.length < 2) {
        return NextResponse.json({ error: 'الاسم يجب أن يكون حرفين على الأقل' }, { status: 400 });
      }
      data.name = name;
    }

    if (typeof body.phone === 'string') {
      const phone = body.phone.trim();
      if (phone.length < 10) {
        return NextResponse.json({ error: 'رقم هاتف صحيح مطلوب' }, { status: 400 });
      }
      data.phone = phone;
    }

    if (typeof body.email === 'string') {
      const email = body.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'بريد إلكتروني صحيح مطلوب' }, { status: 400 });
      }
      // Enforce email uniqueness across other users.
      const clash = await db.user.findFirst({ where: { email, id: { not: user.id } } });
      if (clash) {
        return NextResponse.json({ error: 'هذا البريد الإلكتروني مستخدم بالفعل' }, { status: 409 });
      }
      data.email = email;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'لا توجد بيانات للتحديث' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      select: { id: true, email: true, name: true, phone: true, avatar: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
