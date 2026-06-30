import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Fawry API URLs
const FAWRY_SANDBOX_URL = 'https://atfawry.fawrystaging.com';
const FAWRY_PRODUCTION_URL = 'https://www.atfawry.com';

// Get Fawry settings from database
async function getFawrySettings() {
  const settings = await db.setting.findMany({
    where: {
      key: {
        in: ['payment_fawry_enabled', 'payment_fawry_merchant_code', 'payment_fawry_security_key'],
      },
    },
  });
  
  const settingsMap: Record<string, string> = {};
  settings.forEach(s => {
    settingsMap[s.key] = s.value;
  });
  
  return {
    enabled: settingsMap.payment_fawry_enabled === 'true',
    merchantCode: settingsMap.payment_fawry_merchant_code || '',
    securityKey: settingsMap.payment_fawry_security_key || '',
  };
}

// Generate Fawry signature
function generateFawrySignature(merchantCode: string, merchantRefNumber: string, paymentMethod: string, amount: string, securityKey: string): string {
  const signatureString = merchantCode + merchantRefNumber + paymentMethod + amount + securityKey;
  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

// POST /api/payment/fawry - Initialize Fawry payment
export async function POST(request: NextRequest) {
  try {
    const fawrySettings = await getFawrySettings();
    
    if (!fawrySettings.enabled) {
      return NextResponse.json(
        { error: 'Fawry payment is not enabled' },
        { status: 400 }
      );
    }
    
    if (!fawrySettings.merchantCode || !fawrySettings.securityKey) {
      return NextResponse.json(
        { error: 'Fawry payment is not configured properly' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { orderId, amount, customerEmail, customerMobile, description, returnUrl } = body;
    
    // Generate merchant reference number
    const merchantRefNumber = orderId || `EST-${Date.now().toString(36).toUpperCase()}`;
    
    // Payment amount as string with 2 decimal places
    const amountStr = parseFloat(amount).toFixed(2);
    
    // Use 'PAYATFAWRY' for cash payment at Fawry, or 'CARD' for card payment
    const paymentMethod = 'CARD';
    
    // Generate signature
    const signature = generateFawrySignature(
      fawrySettings.merchantCode,
      merchantRefNumber,
      paymentMethod,
      amountStr,
      fawrySettings.securityKey
    );
    
    // Determine if sandbox or production
    const isProduction = process.env.FAWRY_ENVIRONMENT === 'production';
    const baseUrl = isProduction ? FAWRY_PRODUCTION_URL : FAWRY_SANDBOX_URL;
    
    // Build Fawry charge request
    const chargeRequest = {
      merchantCode: fawrySettings.merchantCode,
      merchantRefNumber,
      customerEmail,
      customerMobile,
      amount: parseFloat(amountStr),
      currencyCode: 'EGP',
      language: 'ar-eg',
      chargeItems: [
        {
          itemId: merchantRefNumber,
          description: description || 'Estar Order',
          price: parseFloat(amountStr),
          quantity: 1,
        },
      ],
      signature,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/?view=order-success`,
    };
    
    // For card payment, we need to redirect to Fawry's checkout page
    // Build the checkout URL with parameters
    const checkoutParams = new URLSearchParams({
      merchantCode: fawrySettings.merchantCode,
      merchantRefNumber,
      customerEmail,
      customerMobile,
      amount: amountStr,
      currencyCode: 'EGP',
      language: 'ar-eg',
      chargeItems: JSON.stringify(chargeRequest.chargeItems),
      signature,
      returnUrl: chargeRequest.returnUrl,
    });
    
    const checkoutUrl = `${baseUrl}/ECommerceWeb/Fawry/payments/charge?${checkoutParams.toString()}`;
    
    return NextResponse.json({
      success: true,
      checkoutUrl,
      merchantRefNumber,
      paymentMethod: 'fawry',
    });
    
  } catch (error) {
    console.error('Error initializing Fawry payment:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Fawry payment' },
      { status: 500 }
    );
  }
}

// GET /api/payment/fawry - Handle Fawry callback/webhook
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Fawry callback parameters
    const merchantRefNumber = searchParams.get('merchantRefNumber');
    const fawryRefNumber = searchParams.get('fawryRefNumber');
    const paymentMethod = searchParams.get('paymentMethod');
    const paymentAmount = searchParams.get('paymentAmount');
    const orderStatus = searchParams.get('orderStatus');
    const signature = searchParams.get('signature');
    
    if (!merchantRefNumber || !orderStatus) {
      return NextResponse.redirect(
        new URL('/?view=checkout&error=invalid_callback', request.url)
      );
    }
    
    // Find the order by order number
    const order = await db.order.findFirst({
      where: { orderNumber: merchantRefNumber },
    });
    
    if (!order) {
      return NextResponse.redirect(
        new URL('/?view=checkout&error=order_not_found', request.url)
      );
    }
    
    if (orderStatus === 'PAID' || orderStatus === 'SUCCESS') {
      // Update order payment status
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          status: 'processing',
          trackingNumber: fawryRefNumber || undefined,
        },
      });
      
      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/?view=order-success&id=${order.id}`, request.url)
      );
    } else {
      // Payment failed
      await db.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'failed' },
      });
      
      return NextResponse.redirect(
        new URL(`/?view=checkout&error=payment_failed`, request.url)
      );
    }
    
  } catch (error) {
    console.error('Error handling Fawry callback:', error);
    return NextResponse.redirect(
      new URL('/?view=checkout&error=callback_error', request.url)
    );
  }
}
