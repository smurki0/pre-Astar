import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/maintenance - Get maintenance status
export async function GET() {
  try {
    const setting = await db.setting.findUnique({
      where: { key: 'maintenance_mode' },
    });

    const messageAr = await db.setting.findUnique({
      where: { key: 'maintenance_message_ar' },
    });

    const messageEn = await db.setting.findUnique({
      where: { key: 'maintenance_message_en' },
    });

    return NextResponse.json({
      isActive: setting?.value === 'true',
      messageAr: messageAr?.value || 'الموقع تحت الصيانة، يرجى المحاولة لاحقاً',
      messageEn: messageEn?.value || 'Site is under maintenance, please try again later',
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json({
      isActive: false,
      messageAr: '',
      messageEn: '',
    });
  }
}
