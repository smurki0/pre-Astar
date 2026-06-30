import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/orders - List all orders for admin
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
      ];
    }
    
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { 
            select: { 
              id: true, 
              productName: true, 
              quantity: true, 
              price: true,
              total: true 
            } 
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);
    
    // Transform orders to include all necessary fields
    const transformedOrders = orders.map(order => ({
      ...order,
      paymentMethod: order.paymentMethod || 'cod',
    }));
    
    return NextResponse.json({
      orders: transformedOrders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
