import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    const category = await db.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true }
        }
      },
    });
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if category exists
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    const updateData: Record<string, unknown> = {};
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn;
    if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.parentId !== undefined) updateData.parentId = body.parentId || null;
    
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await db.category.findFirst({
        where: {
          slug: body.slug,
          NOT: { id }
        },
      });
      
      if (slugExists) {
        return NextResponse.json(
          { error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }
      updateData.slug = body.slug;
    }
    
    const category = await db.category.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    // Check if category has products
    const productsCount = await db.product.count({
      where: { categoryId: id }
    });
    
    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products. Move or delete products first.' },
        { status: 400 }
      );
    }
    
    // Update children to have no parent
    await db.category.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });
    
    await db.category.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
