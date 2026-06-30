import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { normalizeImages, normalizeVariants } from '@/lib/product-payload';

// GET /api/admin/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    const product = await db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        category: true,
        variants: true,
      },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
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
      featured, 
      active, 
      images,
      variants 
    } = body;
    
    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (nameEn !== undefined) updateData.nameEn = nameEn;
    if (nameAr !== undefined) updateData.nameAr = nameAr;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr;
    if (price !== undefined) updateData.price = parseFloat(price) || 0;
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity) || 0;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (active !== undefined) updateData.active = Boolean(active);
    
    // Handle SKU update - check for duplicates
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await db.product.findUnique({ where: { sku } });
      if (skuExists) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
      updateData.sku = sku;
    }
    
    // Handle slug update
    if (slug && slug !== existingProduct.slug) {
      const slugExists = await db.product.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        );
      }
      updateData.slug = slug;
    }
    
    // Validate & normalise images up-front (enforces the 10-image API limit)
    const imagesResult = images !== undefined ? normalizeImages(images) : null;
    if (imagesResult && 'error' in imagesResult) {
      return NextResponse.json({ error: imagesResult.error }, { status: 400 });
    }
    const imageRows = imagesResult && 'rows' in imagesResult ? imagesResult.rows : [];
    const variantRows = variants !== undefined ? normalizeVariants(variants) : [];

    // Replace existing images when an images array was supplied
    if (images !== undefined) {
      await db.productImage.deleteMany({ where: { productId: id } });
    }

    // Replace existing variants when a variants array was supplied
    if (variants !== undefined) {
      await db.productVariant.deleteMany({ where: { productId: id } });
    }
    
    // Update product
    const product = await db.product.update({
      where: { id },
      data: {
        ...updateData,
        ...(imageRows.length > 0 ? { images: { create: imageRows } } : {}),
        ...(variantRows.length > 0 ? { variants: { create: variantRows } } : {}),
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
        category: true,
      },
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    
    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Delete related records first (cascade should handle this, but let's be explicit)
    await db.productImage.deleteMany({ where: { productId: id } });
    await db.productVariant.deleteMany({ where: { productId: id } });
    await db.cartItem.deleteMany({ where: { productId: id } });
    await db.wishlistItem.deleteMany({ where: { productId: id } });
    
    // Delete product
    await db.product.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/[id] - Partial update (for toggles)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {};
    
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);
    if (body.active !== undefined) updateData.active = Boolean(body.active);
    
    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error patching product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
