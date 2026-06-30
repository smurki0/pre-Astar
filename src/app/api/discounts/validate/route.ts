import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/discounts/validate - Validate discount code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;
    
    const discountCode = await db.discountCode.findUnique({
      where: { code, active: true },
    });
    
    if (!discountCode) {
      return NextResponse.json(
        { valid: false, error: 'Invalid discount code' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    
    if (now < discountCode.startDate || now > discountCode.endDate) {
      return NextResponse.json(
        { valid: false, error: 'Discount code has expired' },
        { status: 400 }
      );
    }
    
    if (discountCode.usageLimit && discountCode.usageCount >= discountCode.usageLimit) {
      return NextResponse.json(
        { valid: false, error: 'Discount code usage limit reached' },
        { status: 400 }
      );
    }
    
    if (discountCode.minOrder && subtotal < discountCode.minOrder) {
      return NextResponse.json(
        { valid: false, error: `Minimum order amount is ${discountCode.minOrder}` },
        { status: 400 }
      );
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.type === 'percentage') {
      discountAmount = (subtotal * discountCode.value) / 100;
      if (discountCode.maxDiscount) {
        discountAmount = Math.min(discountAmount, discountCode.maxDiscount);
      }
    } else {
      discountAmount = discountCode.value;
    }
    
    return NextResponse.json({
      valid: true,
      discount: {
        id: discountCode.id,
        code: discountCode.code,
        type: discountCode.type,
        value: discountCode.value,
        discountAmount,
      },
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}
