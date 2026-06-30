import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/products - List products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const size = searchParams.get('size');
    const color = searchParams.get('color');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const featured = searchParams.get('featured');
    
    // Build where clause
    const where: Record<string, unknown> = {
      active: true,
    };
    
    // Handle category filter (can be ID or slug, or comma-separated multiple)
    if (category) {
      const categorySlugs = category.split(',').filter(Boolean);
      if (categorySlugs.length > 0) {
        // Find all matching categories
        const categoryRecords = await db.category.findMany({
          where: {
            OR: categorySlugs.flatMap(slug => [
              { id: slug },
              { slug: slug }
            ])
          },
          select: { id: true }
        });
        
        if (categoryRecords.length > 0) {
          where.categoryId = { in: categoryRecords.map(c => c.id) };
        } else {
          // If no categories found, try using them as IDs directly
          where.categoryId = { in: categorySlugs };
        }
      }
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
    }
    
    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameAr: { contains: search } },
        { descriptionEn: { contains: search } },
        { descriptionAr: { contains: search } },
      ];
    }
    
    if (featured === 'true') {
      where.featured = true;
    }
    
    // Build variants filter
    if (size || color) {
      const variantFilter: Record<string, unknown> = {};
      if (size) {
        const sizes = size.split(',').filter(Boolean);
        if (sizes.length === 1) {
          variantFilter.size = sizes[0];
        } else if (sizes.length > 1) {
          variantFilter.size = { in: sizes };
        }
      }
      if (color) {
        const colors = color.split(',').filter(Boolean);
        if (colors.length === 1) {
          variantFilter.color = colors[0];
        } else if (colors.length > 1) {
          variantFilter.color = { in: colors };
        }
      }
      where.variants = { some: variantFilter };
    }
    
    // Build order by
    let orderBy: Record<string, unknown> = { createdAt: 'desc' };
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'name-asc':
        orderBy = { nameEn: 'asc' };
        break;
      case 'name-desc':
        orderBy = { nameEn: 'desc' };
        break;
    }
    
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
          category: { select: { id: true, nameEn: true, nameAr: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
