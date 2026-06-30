import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/newsletter - List all subscribers
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const subscribers = await db.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/newsletter - Add subscriber manually
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Subscriber already exists' },
        { status: 400 }
      );
    }
    
    const subscriber = await db.newsletterSubscriber.create({
      data: { email },
    });
    
    return NextResponse.json(subscriber);
  } catch (error) {
    console.error('Error creating subscriber:', error);
    return NextResponse.json(
      { error: 'Failed to create subscriber', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
