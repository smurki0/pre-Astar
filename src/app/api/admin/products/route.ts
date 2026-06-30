import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { normalizeImages, normalizeVariants } from '@/lib/product-payload';

// GET /api/admin/products - List all products for admin
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { nameEn: { contains: search } },
        { nameAr: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          images: { orderBy: { position: 'asc' } },
          category: { select: { id: true, nameEn: true, nameAr: true } },
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);
    
    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create product
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { 
      nameEn, 
      nameAr, 
      slug, 
      descriptionEn, 
      descriptionAr, 
      price, 
      comparePrice, 
      sku, 
      quantity, 
      categoryId, 
      images, 
      variants, 
      featured, 
      active 
    } = body;
    
    // Validation
    if (!nameEn || !nameAr || !sku || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: nameEn, nameAr, sku, categoryId' },
        { status: 400 }
      );
    }

    // Validate & normalise images (enforces the 10-image limit at the API layer)
    const imagesResult = normalizeImages(images);
    if ('error' in imagesResult) {
      return NextResponse.json({ error: imagesResult.error }, { status: 400 });
    }
    const imageRows = imagesResult.rows;
    const variantRows = normalizeVariants(variants);
    
    // Generate slug if not provided
    const productSlug = slug || nameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Check if SKU already exists
    const existingProduct = await db.product.findUnique({
      where: { sku }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      );
    }
    
    // Check if slug already exists
    const existingSlug = await db.product.findUnique({
      where: { slug: productSlug }
    });
    
    if (existingSlug) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }
    
    const product = await db.product.create({
      data: {
        nameEn,
        nameAr,
        slug: productSlug,
        descriptionEn: descriptionEn || '',
        descriptionAr: descriptionAr || '',
        price: parseFloat(price) || 0,
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        sku,
        quantity: parseInt(quantity) || 0,
        categoryId,
        featured: featured || false,
        active: active !== false,
        images: { create: imageRows },
        variants: { create: variantRows },
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        category: true,
      },
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
