import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/stats - Get dashboard statistics (admin only)
export async function GET(request: NextRequest) {
  // Financial statistics must not be exposed publicly. Guard with the same
  // admin check used by every other /api/admin/* route.
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Get stats
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      db.product.count({ where: { active: true } }),
      db.order.count(),
      db.user.count({ where: { isBlocked: false } }),
      db.order.aggregate({
        where: { paymentStatus: 'paid' },
        _sum: { total: true },
      }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      db.order.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    // Get revenue by month using Prisma's raw query with correct table name
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const orders = await db.order.findMany({
      where: {
        paymentStatus: 'paid',
        createdAt: { gte: twelveMonthsAgo },
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    // Group by month manually
    const revenueByMonth: { month: string; revenue: number }[] = [];
    const monthMap = new Map<string, number>();

    for (const order of orders) {
      const month = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const current = monthMap.get(month) || 0;
      monthMap.set(month, current + order.total);
    }

    for (const [month, revenue] of monthMap.entries()) {
      revenueByMonth.push({ month, revenue });
    }

    revenueByMonth.sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue._sum.total || 0,
      recentOrders,
      ordersByStatus,
      revenueByMonth,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
