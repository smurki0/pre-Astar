import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/categories - List all categories
export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
        children: true,
      },
      orderBy: { nameEn: 'asc' },
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nameEn, nameAr, slug, descriptionEn, descriptionAr, image, parentId } = body;
    
    // Validation
    if (!nameEn || !nameAr) {
      return NextResponse.json(
        { error: 'Missing required fields: nameEn, nameAr' },
        { status: 400 }
      );
    }
    
    // Generate slug if not provided
    const categorySlug = slug || nameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Check if slug exists
    const existing = await db.category.findUnique({
      where: { slug: categorySlug },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }
    
    const category = await db.category.create({
      data: {
        nameEn,
        nameAr,
        slug: categorySlug,
        descriptionEn: descriptionEn || null,
        descriptionAr: descriptionAr || null,
        image: image || null,
        parentId: parentId || null,
      },
      include: {
        _count: { select: { products: true } },
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
