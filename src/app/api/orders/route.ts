import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/orders - Get user orders
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1 } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    // Require authentication for orders
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please login to continue', requireLogin: true },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { items, shippingAddress, billingAddress, discountCode, paymentMethod, shipping, tax, shippingZoneId } = body;
    
    // Basic payload validation
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    for (const item of items) {
      const qty = Number(item?.quantity);
      if (!item?.productId || !Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 });
      }
    }

    // Validate that all products exist (and load their authoritative prices/stock)
    const productIds = [...new Set(items.map((item: { productId: string }) => item.productId))];
    const existingProducts = await db.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { variants: true },
    });

    const productMap = new Map(existingProducts.map(p => [p.id, p]));
    const missingProductIds = productIds.filter((id: string) => !productMap.has(id));

    if (missingProductIds.length > 0) {
      return NextResponse.json(
        { error: 'Some products in your cart are no longer available. Please refresh and try again.', missingProducts: missingProductIds },
        { status: 400 }
      );
    }

    // SECURITY: never trust client-supplied prices. Recompute every line item and
    // the order totals from the database. The client only chooses product/variant
    // and quantity; the price comes from the server.
    const orderItems = items.map((item: { productId: string; variantId: string | null; quantity: number }) => {
      const product = productMap.get(item.productId)!;
      let unitPrice = product.price;
      let variantName: string | null = null;
      let variantColor: string | null = null;
      let variantColorHex: string | null = null;
      let variantSize: string | null = null;
      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Variant not found for product ${item.productId}`);
        }
        unitPrice = variant.price ?? product.price;
        variantName = variant.name;
        // Snapshot the chosen colour/size onto the order line so the admin
        // always sees what the customer ordered, even if the variant changes.
        variantColor = variant.color ?? null;
        variantColorHex = variant.colorHex ?? null;
        variantSize = variant.size ?? null;
      }
      const quantity = Number(item.quantity);
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: product.nameEn,
        variantName,
        variantColor,
        variantColorHex,
        variantSize,
        price: unitPrice,
        quantity,
        total: unitPrice * quantity,
      };
    });

    const computedSubtotal = orderItems.reduce((sum, i) => sum + i.total, 0);

    // Generate order number
    const orderNumber = `EST-${Date.now().toString(36).toUpperCase()}`;

    // Check discount code and recompute the discount amount server-side
    let discountCodeId: string | null = null;
    let computedDiscount = 0;
    if (discountCode) {
      const code = await db.discountCode.findUnique({
        where: { code: discountCode, active: true },
      });

      const now = new Date();
      const withinUsage = !code?.usageLimit || code.usageCount < code.usageLimit;
      const meetsMinOrder = !code?.minOrder || computedSubtotal >= code.minOrder;

      if (code && now >= code.startDate && now <= code.endDate && withinUsage && meetsMinOrder) {
        discountCodeId = code.id;
        if (code.type === 'percentage') {
          computedDiscount = (computedSubtotal * code.value) / 100;
          if (code.maxDiscount) {
            computedDiscount = Math.min(computedDiscount, code.maxDiscount);
          }
        } else {
          computedDiscount = code.value;
        }
        computedDiscount = Math.min(computedDiscount, computedSubtotal);

        // Increment usage
        await db.discountCode.update({
          where: { id: code.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    // SECURITY: never trust the client-supplied shipping amount. When a shipping
    // zone is selected, recompute the cost from the authoritative DB record and
    // honour both the per-zone and the global free-shipping thresholds.
    let safeShipping = Math.max(0, Number(shipping) || 0);
    let resolvedZoneId: string | null = null;
    let resolvedZoneName: string | null = null;

    if (shippingZoneId) {
      const zone = await db.shippingZone.findFirst({
        where: { id: String(shippingZoneId), active: true },
      });
      if (!zone) {
        return NextResponse.json(
          { error: 'منطقة الشحن المحددة غير متوفرة. يرجى تحديث الصفحة والمحاولة مرة أخرى.' },
          { status: 400 }
        );
      }

      // Global free-shipping threshold (from settings) takes precedence.
      const thresholdSetting = await db.setting.findUnique({
        where: { key: 'free_shipping_threshold' },
      });
      const globalThreshold = Number(thresholdSetting?.value);

      const qualifiesGlobalFree =
        Number.isFinite(globalThreshold) && globalThreshold > 0 && computedSubtotal >= globalThreshold;
      const qualifiesZoneFree = zone.freeShippingMin > 0 && computedSubtotal >= zone.freeShippingMin;

      safeShipping = qualifiesGlobalFree || qualifiesZoneFree ? 0 : Math.max(0, zone.cost);
      resolvedZoneId = zone.id;
      resolvedZoneName = zone.name;
    }

    const safeTax = Math.max(0, Number(tax) || 0);
    const computedTotal = Math.max(0, computedSubtotal + safeShipping + safeTax - computedDiscount);

    // Create order using server-computed monetary values only
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        shippingAddress: JSON.stringify(shippingAddress),
        billingAddress: billingAddress ? JSON.stringify(billingAddress) : null,
        discountCodeId,
        shippingZoneId: resolvedZoneId,
        shippingZoneName: resolvedZoneName,
        paymentMethod,
        subtotal: computedSubtotal,
        shipping: safeShipping,
        tax: safeTax,
        discount: computedDiscount,
        total: computedTotal,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });
    
    // Update product quantities and check for low stock
    for (const item of items) {
      // Decrement the specific variant (size/color) stock so the per-size
      // "remaining pieces" counter on the product card stays accurate.
      if (item.variantId) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { quantity: { decrement: Number(item.quantity) } },
        });
      }

      const updatedProduct = await db.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      
      // Create low stock notification if quantity is low (<= 5)
      if (updatedProduct.quantity <= 5 && updatedProduct.quantity > 0) {
        // Check if low stock notification already exists for this product
        const existingNotification = await db.notification.findFirst({
          where: {
            type: 'low_stock',
            data: { contains: item.productId },
            isRead: false,
          },
        });
        
        if (!existingNotification) {
          await db.notification.create({
            data: {
              type: 'low_stock',
              title: 'مخزون منخفض',
              message: `المنتج "${item.productName}" أوشك على النفاد (${updatedProduct.quantity} متبقي)`,
              data: JSON.stringify({ productId: item.productId, quantity: updatedProduct.quantity }),
              link: `/?view=admin&section=products`,
            },
          });
        }
      }
    }
    
    // Create notification for new order
    await db.notification.create({
      data: {
        type: 'new_order',
        title: 'طلب جديد',
        message: `تم استلام طلب جديد #${orderNumber} بقيمة ${computedTotal.toFixed(2)} ج.م`,
        data: JSON.stringify({ orderId: order.id, orderNumber, total: computedTotal }),
        link: `/?view=admin&section=orders`,
      },
    });
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Failed to create order';
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Some products in your cart are no longer available. Please refresh the page and try again.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
