import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;
    
    // Sanitize all user inputs
    const sanitizedName = sanitizeInput(name || '');
    const sanitizedEmail = sanitizeInput(email || '');
    const sanitizedPhone = sanitizeInput(phone || '');
    const sanitizedSubject = sanitizeInput(subject || '');
    const sanitizedMessage = sanitizeInput(message || '');
    
    if (!sanitizedName || !sanitizedEmail || !sanitizedMessage) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }
    
    const contactMessage = await db.contactMessage.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone || null,
        subject: sanitizedSubject || null,
        message: sanitizedMessage,
      },
    });
    
    // Create notification for new contact message
    await db.notification.create({
      data: {
        type: 'new_contact',
        title: 'رسالة تواصل جديدة',
        message: `${sanitizedName} أرسل رسالة: ${sanitizedSubject || sanitizedMessage.substring(0, 50)}...`,
        data: JSON.stringify({ contactId: contactMessage.id, name: sanitizedName, email: sanitizedEmail }),
        link: `/?view=admin&section=contact`,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us. We will get back to you soon.',
      id: contactMessage.id,
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
