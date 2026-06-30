import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, comparePassword, hashPassword } from '@/lib/auth';

// POST /api/auth/change-password - change the current user's password
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'كلمة المرور الحالية والجديدة مطلوبتان' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }

    // Load the password hash (getUserFromRequest doesn't expose it).
    const record = await db.user.findUnique({ where: { id: user.id }, select: { password: true } });
    if (!record) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const valid = await comparePassword(currentPassword, record.password);
    if (!valid) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await db.user.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
