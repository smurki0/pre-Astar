import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/backup - Download backup
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Get all data from the database
    const [
      users,
      categories,
      products,
      orders,
      discountCodes,
      banners,
      settings,
      contactMessages,
      newsletterSubscribers,
      menuItems,
    ] = await Promise.all([
      db.user.findMany({ include: { addresses: true } }),
      db.category.findMany(),
      db.product.findMany({ include: { images: true, variants: true } }),
      db.order.findMany({ include: { items: true } }),
      db.discountCode.findMany(),
      db.banner.findMany(),
      db.setting.findMany(),
      db.contactMessage.findMany(),
      db.newsletterSubscriber.findMany(),
      db.menuItem.findMany(),
    ]);

    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        categories,
        products,
        orders,
        discountCodes,
        banners,
        settings,
        contactMessages,
        newsletterSubscribers,
        menuItems,
      },
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// POST /api/admin/backup - Restore backup
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { data, version } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Invalid backup data' },
        { status: 400 }
      );
    }

    // Restore settings
    if (data.settings && Array.isArray(data.settings)) {
      for (const setting of data.settings) {
        await db.setting.upsert({
          where: { key: setting.key },
          create: { key: setting.key, value: setting.value, type: setting.type || 'text' },
          update: { value: setting.value },
        });
      }
    }

    // Restore categories (handle parent relationships carefully)
    if (data.categories && Array.isArray(data.categories)) {
      // First, create all categories without parent
      for (const category of data.categories) {
        await db.category.upsert({
          where: { id: category.id },
          create: {
            id: category.id,
            nameEn: category.nameEn,
            nameAr: category.nameAr,
            slug: category.slug,
            descriptionEn: category.descriptionEn,
            descriptionAr: category.descriptionAr,
            image: category.image,
          },
          update: {
            nameEn: category.nameEn,
            nameAr: category.nameAr,
            slug: category.slug,
            descriptionEn: category.descriptionEn,
            descriptionAr: category.descriptionAr,
            image: category.image,
          },
        });
      }
      // Then update parent relationships
      for (const category of data.categories) {
        if (category.parentId) {
          await db.category.update({
            where: { id: category.id },
            data: { parentId: category.parentId },
          });
        }
      }
    }

    // Restore banners
    if (data.banners && Array.isArray(data.banners)) {
      for (const banner of data.banners) {
        await db.banner.upsert({
          where: { id: banner.id },
          create: {
            id: banner.id,
            titleEn: banner.titleEn,
            titleAr: banner.titleAr,
            subtitleEn: banner.subtitleEn,
            subtitleAr: banner.subtitleAr,
            buttonTextEn: banner.buttonTextEn,
            buttonTextAr: banner.buttonTextAr,
            image: banner.image,
            link: banner.link,
            position: banner.position,
            active: banner.active,
            order: banner.order,
            startDate: banner.startDate ? new Date(banner.startDate) : null,
            endDate: banner.endDate ? new Date(banner.endDate) : null,
          },
          update: {
            titleEn: banner.titleEn,
            titleAr: banner.titleAr,
            subtitleEn: banner.subtitleEn,
            subtitleAr: banner.subtitleAr,
            buttonTextEn: banner.buttonTextEn,
            buttonTextAr: banner.buttonTextAr,
            image: banner.image,
            link: banner.link,
            position: banner.position,
            active: banner.active,
            order: banner.order,
            startDate: banner.startDate ? new Date(banner.startDate) : null,
            endDate: banner.endDate ? new Date(banner.endDate) : null,
          },
        });
      }
    }

    // Restore newsletter subscribers
    if (data.newsletterSubscribers && Array.isArray(data.newsletterSubscribers)) {
      for (const subscriber of data.newsletterSubscribers) {
        await db.newsletterSubscriber.upsert({
          where: { id: subscriber.id },
          create: {
            id: subscriber.id,
            email: subscriber.email,
            active: subscriber.active,
          },
          update: {
            email: subscriber.email,
            active: subscriber.active,
          },
        });
      }
    }

    // Restore menu items (handle parent relationships carefully)
    if (data.menuItems && Array.isArray(data.menuItems)) {
      // First, create all menu items without parent
      for (const menuItem of data.menuItems) {
        await db.menuItem.upsert({
          where: { id: menuItem.id },
          create: {
            id: menuItem.id,
            labelEn: menuItem.labelEn,
            labelAr: menuItem.labelAr,
            url: menuItem.url,
            order: menuItem.order,
            active: menuItem.active,
          },
          update: {
            labelEn: menuItem.labelEn,
            labelAr: menuItem.labelAr,
            url: menuItem.url,
            order: menuItem.order,
            active: menuItem.active,
          },
        });
      }
      // Then update parent relationships
      for (const menuItem of data.menuItems) {
        if (menuItem.parentId) {
          await db.menuItem.update({
            where: { id: menuItem.id },
            data: { parentId: menuItem.parentId },
          });
        }
      }
    }

    // Restore discount codes
    if (data.discountCodes && Array.isArray(data.discountCodes)) {
      for (const discount of data.discountCodes) {
        await db.discountCode.upsert({
          where: { id: discount.id },
          create: {
            id: discount.id,
            code: discount.code,
            type: discount.type,
            value: discount.value,
            minOrder: discount.minOrder,
            maxDiscount: discount.maxDiscount,
            usageLimit: discount.usageLimit,
            usageCount: discount.usageCount,
            startDate: new Date(discount.startDate),
            endDate: new Date(discount.endDate),
            active: discount.active,
          },
          update: {
            code: discount.code,
            type: discount.type,
            value: discount.value,
            minOrder: discount.minOrder,
            maxDiscount: discount.maxDiscount,
            usageLimit: discount.usageLimit,
            usageCount: discount.usageCount,
            startDate: new Date(discount.startDate),
            endDate: new Date(discount.endDate),
            active: discount.active,
          },
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Backup restored successfully',
      restored: {
        categories: data.categories?.length || 0,
        banners: data.banners?.length || 0,
        settings: data.settings?.length || 0,
        newsletterSubscribers: data.newsletterSubscribers?.length || 0,
        menuItems: data.menuItems?.length || 0,
        discountCodes: data.discountCodes?.length || 0,
      }
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}
