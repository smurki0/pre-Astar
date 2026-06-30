import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/discounts - List all discount codes
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('active');
    
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.code = { contains: search };
    }
    
    if (activeOnly === 'true') {
      where.active = true;
    }
    
    const [discounts, total] = await Promise.all([
      db.discountCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.discountCode.count({ where }),
    ]);
    
    return NextResponse.json({
      discounts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/discounts - Create discount code
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { code, type, value, minOrder, maxDiscount, usageLimit, startDate, endDate, active } = body;
    
    // Validation
    if (!code || !type || value === undefined || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: code, type, value, startDate, endDate' },
        { status: 400 }
      );
    }
    
    // Check if code already exists
    const existing = await db.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }
    
    const discount = await db.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        active: active !== false,
      },
    });
    
    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json(
      { error: 'Failed to create discount', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
