import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/categories - List all categories
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { nameEn: 'asc' },
    });
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create category
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { nameEn, nameAr, slug, descriptionEn, descriptionAr, image, parentId } = body;
    
    // Validation
    if (!nameEn || !nameAr || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: nameEn, nameAr, slug' },
        { status: 400 }
      );
    }
    
    // Check if slug exists
    const existing = await db.category.findUnique({
      where: { slug },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Category slug already exists' },
        { status: 400 }
      );
    }
    
    const category = await db.category.create({
      data: {
        nameEn,
        nameAr,
        slug,
        descriptionEn: descriptionEn || null,
        descriptionAr: descriptionAr || null,
        image: image || null,
        parentId: parentId || null,
      },
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
