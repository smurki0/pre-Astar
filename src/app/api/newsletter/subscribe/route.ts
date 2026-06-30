import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/newsletter/subscribe - Public newsletter subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required', errorAr: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address', errorAr: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }
    
    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });
    
    if (existing) {
      // If already exists but inactive, reactivate
      if (!existing.active) {
        await db.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { active: true },
        });
        return NextResponse.json({ 
          success: true, 
          message: 'Welcome back! You have been resubscribed.',
          messageAr: 'مرحباً بعودتك! تم إعادة اشتراكك.'
        });
      }
      
      return NextResponse.json(
        { error: 'This email is already subscribed', errorAr: 'هذا البريد مسجل بالفعل' },
        { status: 400 }
      );
    }
    
    // Create new subscriber
    const subscriber = await db.newsletterSubscriber.create({
      data: { 
        email: normalizedEmail,
        active: true,
      },
    });
    
    // Create notification for new subscriber
    await db.notification.create({
      data: {
        type: 'new_subscriber',
        title: 'مشترك جديد في النشرة البريدية',
        message: `${normalizedEmail} اشترك في النشرة البريدية`,
        data: JSON.stringify({ subscriberId: subscriber.id, email: normalizedEmail }),
        link: `/?view=admin&section=newsletter`,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Thank you for subscribing! Check your email for your discount code.',
      messageAr: 'شكراً لاشتراكك! تحقق من بريدك الإلكتروني للحصول على كود الخصم.',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        createdAt: subscriber.createdAt,
      }
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe', errorAr: 'فشل في الاشتراك' },
      { status: 500 }
    );
  }
}
