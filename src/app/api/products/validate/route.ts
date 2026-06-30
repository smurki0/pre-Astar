import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/products/validate - Validate product IDs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ valid: true, invalidIds: [] });
    }
    
    // Find all existing products
    const existingProducts = await db.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
      select: { id: true },
    });
    
    const existingIds = new Set(existingProducts.map(p => p.id));
    const invalidIds = productIds.filter(id => !existingIds.has(id));
    
    return NextResponse.json({
      valid: invalidIds.length === 0,
      invalidIds,
      existingIds: Array.from(existingIds),
    });
  } catch (error) {
    console.error('Error validating products:', error);
    return NextResponse.json(
      { error: 'Failed to validate products' },
      { status: 500 }
    );
  }
}
