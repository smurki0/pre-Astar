import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  getClientIP, 
  checkRateLimit, 
  sanitizeInput, 
  detectSQLInjection,
  detectXSS,
  logSecurityEvent,
  validateEmail,
  SECURITY_CONFIG 
} from '@/lib/security'

// Paymob API URLs
const PAYMOB_API_URL = 'https://accept.paymob.com/api'

interface PaymobConfig {
  apiKey: string
  integrationId: string
  hmacSecret: string
  iframeId: string
  merchantProfileId: string
  webhookSecret: string
  allowedIps: string[]
  deliveryNeeded: boolean
}

// Get Paymob configuration from settings
async function getPaymobConfig(): Promise<PaymobConfig | null> {
  try {
    const settings = await db.setting.findMany({
      where: {
        key: {
          in: [
            'payment_paymob_api_key',
            'payment_paymob_integration_id',
            'payment_paymob_hmac_secret',
            'payment_paymob_iframe_id',
            'payment_paymob_merchant_profile_id',
            'payment_paymob_webhook_secret',
            'payment_paymob_allowed_ips',
            'payment_paymob_delivery_needed',
          ]
        }
      }
    })

    const settingsMap = new Map(settings.map(s => [s.key, s.value]))

    const apiKey = settingsMap.get('payment_paymob_api_key')
    const integrationId = settingsMap.get('payment_paymob_integration_id')
    const hmacSecret = settingsMap.get('payment_paymob_hmac_secret') || ''
    const iframeId = settingsMap.get('payment_paymob_iframe_id') || ''
    const merchantProfileId = settingsMap.get('payment_paymob_merchant_profile_id') || ''
    const webhookSecret = settingsMap.get('payment_paymob_webhook_secret') || ''
    let allowedIps: string[] = []
    
    try {
      const allowedIpsStr = settingsMap.get('payment_paymob_allowed_ips') || '[]'
      allowedIps = JSON.parse(allowedIpsStr)
    } catch {
      allowedIps = []
    }

    const deliveryNeeded = settingsMap.get('payment_paymob_delivery_needed') === 'true'

    if (!apiKey || !integrationId) {
      return null
    }

    return {
      apiKey,
      integrationId,
      hmacSecret,
      iframeId,
      merchantProfileId,
      webhookSecret,
      allowedIps,
      deliveryNeeded
    }
  } catch (error) {
    console.error('Error getting Paymob config:', error)
    logSecurityEvent('paymob_config_error', { error: (error as Error).message })
    return null
  }
}

// Step 1: Authentication Request
async function getAuthToken(apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(`${PAYMOB_API_URL}/auth/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
      }),
    })

    const data = await response.json()

    if (data.token) {
      return data.token
    }

    console.error('Paymob auth error:', data)
    return null
  } catch (error) {
    console.error('Paymob auth request failed:', error)
    return null
  }
}

// Step 2: Order Registration
async function registerOrder(
  authToken: string,
  amountCents: number,
  merchantOrderId: string,
  items: Array<{ name: string; amount_cents: number; quantity: number }>,
  deliveryNeeded: boolean
): Promise<number | null> {
  try {
    const response = await fetch(`${PAYMOB_API_URL}/ecommerce/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: deliveryNeeded,
        amount_cents: amountCents,
        merchant_order_id: merchantOrderId,
        items: items,
      }),
    })

    const data = await response.json()

    if (data.id) {
      return data.id
    }

    console.error('Paymob order registration error:', data)
    return null
  } catch (error) {
    console.error('Paymob order registration failed:', error)
    return null
  }
}

// Step 3: Payment Key Request
async function getPaymentKey(
  authToken: string,
  integrationId: string,
  orderId: number,
  amountCents: number,
  billingData: {
    first_name: string
    last_name: string
    email: string
    phone_number: string
    country: string
    city: string
    street: string
    building: string
    apartment: string
    floor: string
    postal_code: string
  }
): Promise<string | null> {
  try {
    const response = await fetch(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: orderId,
        billing_data: billingData,
        currency: 'EGP',
        integration_id: parseInt(integrationId),
        lock_order_when_paid: true,
      }),
    })

    const data = await response.json()

    if (data.token) {
      return data.token
    }

    console.error('Paymob payment key error:', data)
    return null
  } catch (error) {
    console.error('Paymob payment key request failed:', error)
    return null
  }
}

// Main POST handler - Initialize Payment
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  // Rate limiting
  const rateLimitResult = checkRateLimit(clientIP, 10, 60 * 1000) // 10/min per IP
  if (!rateLimitResult.allowed) {
    logSecurityEvent('paymob_rate_limited', { ip: clientIP })
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString() } }
    )
  }

  try {
    const body = await request.json()
    const { orderId, amount, billingData, items } = body

    // Basic input validation
    if (!orderId || !amount || !billingData || !items || !Array.isArray(items)) {
      logSecurityEvent('paymob_invalid_request', { ip: clientIP, hasOrderId: !!orderId, hasAmount: !!amount })
      return NextResponse.json(
        { error: 'Missing required fields: orderId, amount, billingData, items' },
        { status: 400 }
      )
    }

    if (amount <= 0 || amount > 1000000) { // Reasonable limits
      logSecurityEvent('paymob_invalid_amount', { ip: clientIP, amount })
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Sanitize and validate inputs
    const sanitizedBillingData = {
      firstName: sanitizeInput(billingData.firstName || ''),
      lastName: sanitizeInput(billingData.lastName || ''),
      email: sanitizeInput(billingData.email || ''),
      phone: sanitizeInput(billingData.phone || ''),
      city: sanitizeInput(billingData.city || ''),
      address: sanitizeInput(billingData.address || ''),
      postalCode: sanitizeInput(billingData.postalCode || ''),
    }

    if (detectSQLInjection(JSON.stringify(body)) || detectXSS(JSON.stringify(body))) {
      logSecurityEvent('paymob_malicious_input', { ip: clientIP })
      return NextResponse.json(
        { error: 'Invalid input detected' },
        { status: 400 }
      )
    }

    // Validate email
    const emailValidation = validateEmail(sanitizedBillingData.email)
    if (!emailValidation.valid) {
      logSecurityEvent('paymob_invalid_email', { ip: clientIP, email: sanitizedBillingData.email })
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    // Get Paymob configuration
    const config = await getPaymobConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'Paymob is not configured properly. Please check admin settings.' },
        { status: 400 }
      )
    }

    // Check IP whitelist
    if (config.allowedIps.length > 0 && !config.allowedIps.includes(clientIP)) {
      logSecurityEvent('paymob_ip_not_whitelisted', { ip: clientIP, allowed: config.allowedIps })
      return NextResponse.json(
        { error: 'IP not authorized' },
        { status: 403 }
      )
    }

    // Step 1: Get Authentication Token
    const authToken = await getAuthToken(config.apiKey)
    if (!authToken) {
      logSecurityEvent('paymob_auth_failed', { ip: clientIP })
      return NextResponse.json(
        { error: 'Failed to authenticate with Paymob' },
        { status: 503 }
      )
    }

    // Convert amount to cents
    const amountCents = Math.round(amount * 100)
    if (amountCents <= 0 || amountCents > 100000000) { // Max ~1M EGP
      logSecurityEvent('paymob_amount_out_of_range', { ip: clientIP, amountCents })
      return NextResponse.json(
        { error: 'Amount out of acceptable range' },
        { status: 400 }
      )
    }

    // Generate merchant order ID
    const merchantOrderId = `ORDER-${orderId}-${Date.now()}`

    // Validate and sanitize items
    const paymobItems = items
      .filter((item: any) => item.name && item.price > 0 && item.quantity > 0)
      .slice(0, 50) // Max 50 items
      .map((item: any) => ({
        name: sanitizeInput(item.name).substring(0, 100),
        amount_cents: Math.max(1, Math.round(item.price * 100)),
        quantity: Math.max(1, Math.min(100, item.quantity)),
      }))

    if (paymobItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items provided' },
        { status: 400 }
      )
    }

    // Step 2: Register Order
    const paymobOrderId = await registerOrder(
      authToken,
      amountCents,
      merchantOrderId,
      paymobItems,
      config.deliveryNeeded
    )

    if (!paymobOrderId) {
      logSecurityEvent('paymob_order_registration_failed', { ip: clientIP })
      return NextResponse.json(
        { error: 'Failed to register order with Paymob' },
        { status: 503 }
      )
    }

    // Step 3: Get Payment Key
    const paymentKey = await getPaymentKey(
      authToken,
      config.integrationId,
      paymobOrderId,
      amountCents,
      {
        first_name: sanitizedBillingData.firstName.substring(0, 50) || 'Customer',
        last_name: sanitizedBillingData.lastName.substring(0, 50) || 'Customer',
        email: sanitizedBillingData.email,
        phone_number: sanitizedBillingData.phone.replace(/\s/g, '').substring(0, 15) || '+201000000000',
        country: 'EG',
        city: sanitizedBillingData.city.substring(0, 50) || 'Cairo',
        street: sanitizedBillingData.address.substring(0, 100) || 'N/A',
        building: 'N/A',
        apartment: 'N/A',
        floor: 'N/A',
        postal_code: sanitizedBillingData.postalCode.substring(0, 10) || '00000',
      }
    )

    if (!paymentKey) {
      logSecurityEvent('paymob_payment_key_failed', { ip: clientIP })
      return NextResponse.json(
        { error: 'Failed to generate payment key' },
        { status: 503 }
      )
    }

    // Update order with Paymob order ID and IP
    await db.order.update({
      where: { id: orderId },
      data: {
        notes: `Paymob Order ID: ${paymobOrderId} | Client IP: ${clientIP}`,
        // Add IP for fraud detection
      },
    })

    // Log successful initiation
    logSecurityEvent('paymob_payment_initiated', { 
      ip: clientIP, 
      orderId, 
      amountCents,
      paymobOrderId 
    })

    // Return payment URL or iframe ID
    const paymentUrl = config.iframeId
      ? `https://accept.paymob.com/api/acceptance/iframes/${config.iframeId}?payment_token=${paymentKey}`
      : `https://accept.paymob.com/api/acceptance/payments/pay?payment_key=${paymentKey}`

    return NextResponse.json({
      success: true,
      paymentKey,
      paymentUrl,
      paymobOrderId,
      iframeId: config.iframeId,
    })
  } catch (error) {
    console.error('Paymob payment initialization error:', error)
    logSecurityEvent('paymob_initialization_error', { 
      ip: getClientIP(request),
      error: (error as Error).message 
    })
    return NextResponse.json(
      { error: 'Failed to initialize payment. Please try again.' },
      { status: 500 }
    )
  }
}
