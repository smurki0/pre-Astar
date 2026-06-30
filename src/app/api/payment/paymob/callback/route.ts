import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { 
  getClientIP, 
  checkRateLimit, 
  logSecurityEvent,
  validateEmail
} from '@/lib/security'

// Paymob HMAC verification
function verifyHmac(data: Record<string, string>, hmacSecret: string): boolean {
  if (!hmacSecret) {
    // SECURITY: fail closed. Without a configured secret we cannot verify the
    // callback authenticity, so we must reject it rather than trust it.
    console.error('Paymob HMAC secret not configured - rejecting callback')
    return false
  }

  // Fields that Paymob includes in HMAC calculation
  const hmacFields = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order',
    'owner',
    'pending',
    'source_data_pan',
    'source_data_sub_type',
    'source_data_type',
    'success',
  ]

  // Build the concatenated string
  const values = hmacFields.map(field => {
    const value = data[field]
    if (value === undefined || value === null) {
      return ''
    }
    return String(value)
  })

  const concatenatedString = values.join('')

  // Calculate HMAC
  const calculatedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(concatenatedString)
    .digest('hex')

  return calculatedHmac === data.hmac
}

// Get Paymob webhook config
async function getPaymobWebhookConfig() {
  try {
    const settings = await db.setting.findMany({
      where: {
        key: {
          in: [
            'payment_paymob_webhook_secret',
            'payment_paymob_allowed_ips',
          ]
        }
      }
    })

    const settingsMap = new Map(settings.map(s => [s.key, s.value]))
    
    const webhookSecret = settingsMap.get('payment_paymob_webhook_secret') || ''
    let allowedIps: string[] = []
    
    try {
      const allowedIpsStr = settingsMap.get('payment_paymob_allowed_ips') || '[]'
      allowedIps = JSON.parse(allowedIpsStr)
    } catch {
      allowedIps = []
    }

    return { webhookSecret, allowedIps }
  } catch (error) {
    console.error('Error getting Paymob webhook config:', error)
    return { webhookSecret: '', allowedIps: [] }
  }
}

// Process successful payment
async function processSuccessfulPayment(
  paymobOrderId: string,
  transactionId: string,
  amountCents: number
) {
  try {
    // Find order by Paymob order ID in notes
    const order = await db.order.findFirst({
      where: {
        notes: {
          contains: `Paymob Order ID: ${paymobOrderId}`,
        },
      },
    })

    if (!order) {
      console.error('Order not found for Paymob order ID:', paymobOrderId)
      return false
    }

    // Update order status
    await db.order.update({
      where: { id: order.id },
      data: {
        // Use the canonical lowercase status values used everywhere else in the app.
        // 'PAID' was invalid: it is not a valid order status and, because revenue is
        // summed where paymentStatus === 'paid', Paymob-paid orders never counted as
        // revenue and rendered with a raw, unstyled status badge.
        status: 'processing',
        paymentStatus: 'paid',
        paymentReference: transactionId,
        notes: `${order.notes}\nPayment completed. Transaction ID: ${transactionId} at ${new Date().toISOString()}`,
      },
    })

    // Update product quantities
    const orderItems = await db.orderItem.findMany({
      where: { orderId: order.id },
    })

    for (const item of orderItems) {
      if (item.variantId) {
        // Update variant quantity
        const variant = await db.productVariant.findUnique({
          where: { id: item.variantId },
        })
        if (variant) {
          await db.productVariant.update({
            where: { id: item.variantId },
            data: { quantity: { decrement: item.quantity } },
          })
        }
      }

      // Update product quantity (skip if the product was deleted later)
      if (item.productId) {
        await db.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        })
      }
    }

    return true
  } catch (error) {
    console.error('Error processing successful payment:', error)
    return false
  }
}

// GET handler - Process callback from Paymob (redirect from payment page)
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  // Rate limiting for GET callbacks
  const rateLimitResult = checkRateLimit(clientIP, 5, 60 * 1000) // 5/min per IP
  if (!rateLimitResult.allowed) {
    logSecurityEvent('paymob_callback_rate_limited', { ip: clientIP })
    return NextResponse.redirect(
      new URL('/?view=checkout&payment=failed&reason=rate_limit', request.url)
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams

    // Extract callback data
    const success = searchParams.get('success')
    const orderId = searchParams.get('order')
    const transactionId = searchParams.get('id')
    const amountCents = searchParams.get('amount_cents')
    const hmac = searchParams.get('hmac') || ''

    if (!success || !orderId || !transactionId) {
      logSecurityEvent('paymob_callback_missing_params', { ip: clientIP })
      return NextResponse.redirect(
        new URL('/?view=checkout&payment=failed&reason=missing_params', request.url)
      )
    }

    // Get webhook config
    const webhookConfig = await getPaymobWebhookConfig()
    
    // Check IP whitelist for GET callbacks too
    if (webhookConfig.allowedIps.length > 0 && !webhookConfig.allowedIps.includes(clientIP)) {
      logSecurityEvent('paymob_callback_ip_not_whitelisted', { ip: clientIP })
      return NextResponse.redirect(
        new URL('/?view=checkout&payment=failed&reason=unauthorized_ip', request.url)
      )
    }

    // Get HMAC secret from settings
    const hmacSetting = await db.setting.findUnique({
      where: { key: 'payment_paymob_hmac_secret' },
    })
    const hmacSecret = hmacSetting?.value || ''

    // Build data object for HMAC verification
    const data: Record<string, string> = {
      amount_cents: amountCents || '',
      created_at: searchParams.get('created_at') || '',
      currency: searchParams.get('currency') || '',
      error_occured: searchParams.get('error_occured') || '',
      has_parent_transaction: searchParams.get('has_parent_transaction') || '',
      id: transactionId || '',
      integration_id: searchParams.get('integration_id') || '',
      is_3d_secure: searchParams.get('is_3d_secure') || '',
      is_auth: searchParams.get('is_auth') || '',
      is_capture: searchParams.get('is_capture') || '',
      is_refunded: searchParams.get('is_refunded') || '',
      is_standalone_payment: searchParams.get('is_standalone_payment') || '',
      is_voided: searchParams.get('is_voided') || '',
      order: orderId || '',
      owner: searchParams.get('owner') || '',
      pending: searchParams.get('pending') || '',
      source_data_pan: searchParams.get('source_data.pan') || '',
      source_data_sub_type: searchParams.get('source_data.sub_type') || '',
      source_data_type: searchParams.get('source_data.type') || '',
      success: success || '',
      hmac: hmac,
    }

    // Verify HMAC
    if (!verifyHmac(data, hmacSecret)) {
      logSecurityEvent('paymob_callback_hmac_failed', { ip: clientIP })
      console.error('Paymob HMAC verification failed')
      // Redirect to failure page
      return NextResponse.redirect(
        new URL('/?view=checkout&payment=failed&reason=hmac', request.url)
      )
    }

    if (success === 'true' && orderId && transactionId) {
      // Process successful payment
      const processed = await processSuccessfulPayment(
        orderId,
        transactionId,
        parseInt(amountCents || '0')
      )

      if (processed) {
        logSecurityEvent('paymob_callback_success_processed', { ip: clientIP, orderId, transactionId })
        // Redirect to success page
        return NextResponse.redirect(
          new URL('/?view=checkout&payment=success', request.url)
        )
      } else {
        logSecurityEvent('paymob_callback_processing_failed', { ip: clientIP, orderId })
      }
    } else {
      logSecurityEvent('paymob_callback_payment_failed', { ip: clientIP, success, orderId })
    }

    // Payment failed or processing error
    return NextResponse.redirect(
      new URL('/?view=checkout&payment=failed', request.url)
    )
  } catch (error) {
    console.error('Paymob callback error:', error)
    logSecurityEvent('paymob_callback_error', { ip: getClientIP(request), error: (error as Error).message })
    return NextResponse.redirect(
      new URL('/?view=checkout&payment=failed&reason=error', request.url)
    )
  }
}

// POST handler - Webhook from Paymob (server-to-server)
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  // Strict rate limiting for webhooks (10/hour per IP)
  const rateLimitResult = checkRateLimit(clientIP, 10, 60 * 60 * 1000)
  if (!rateLimitResult.allowed) {
    logSecurityEvent('paymob_webhook_rate_limited', { ip: clientIP })
    return NextResponse.json({ status: 'error', message: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    const webhookConfig = await getPaymobWebhookConfig()

    // Check IP whitelist - CRITICAL for webhooks
    if (webhookConfig.allowedIps.length > 0 && !webhookConfig.allowedIps.includes(clientIP)) {
      logSecurityEvent('paymob_webhook_unauthorized_ip', { ip: clientIP, allowedIps: webhookConfig.allowedIps.length })
      return NextResponse.json({ status: 'error', message: 'Unauthorized IP address' }, { status: 403 })
    }

    // Verify webhook secret (Paymob webhook signature)
    const webhookSecret = webhookConfig.webhookSecret
    if (webhookSecret) {
      const authHeader = request.headers.get('X-Webhook-Signature') || ''
      if (!authHeader.startsWith('paymob-signature=')) {
        logSecurityEvent('paymob_webhook_missing_signature', { ip: clientIP })
        return NextResponse.json({ status: 'error', message: 'Missing webhook signature' }, { status: 400 })
      }
      
      const signature = authHeader.replace('paymob-signature=', '')
      const payload = await request.text()
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        logSecurityEvent('paymob_webhook_signature_mismatch', { ip: clientIP })
        return NextResponse.json({ status: 'error', message: 'Invalid webhook signature' }, { status: 400 })
      }
    }

    const body = await request.json()

    // Extract transaction data
    const { obj, type } = body

    if (type !== 'TRANSACTION' || !obj) {
      logSecurityEvent('paymob_webhook_invalid_type', { ip: clientIP, type })
      return NextResponse.json({ status: 'error', message: 'Invalid webhook payload' }, { status: 400 })
    }

    const transaction = obj
    const success = transaction.success
    const orderId = transaction.order?.id?.toString()
    const transactionId = transaction.id?.toString()
    const amountCents = transaction.amount_cents
    const hmac = transaction.hmac

    // Get HMAC secret
    const hmacSetting = await db.setting.findUnique({
      where: { key: 'payment_paymob_hmac_secret' },
    })
    const hmacSecret = hmacSetting?.value || ''

    // Build data for HMAC verification
    const data: Record<string, string> = {
      amount_cents: String(amountCents || ''),
      created_at: transaction.created_at || '',
      currency: transaction.currency || '',
      error_occured: String(transaction.error_occured || ''),
      has_parent_transaction: String(transaction.has_parent_transaction || ''),
      id: transactionId || '',
      integration_id: String(transaction.integration_id || ''),
      is_3d_secure: String(transaction.is_3d_secure || ''),
      is_auth: String(transaction.is_auth || ''),
      is_capture: String(transaction.is_capture || ''),
      is_refunded: String(transaction.is_refunded || ''),
      is_standalone_payment: String(transaction.is_standalone_payment || ''),
      is_voided: String(transaction.is_voided || ''),
      order: String(transaction.order?.id || ''),
      owner: String(transaction.owner || ''),
      pending: String(transaction.pending || ''),
      source_data_pan: transaction.source_data?.pan || '',
      source_data_sub_type: transaction.source_data?.sub_type || '',
      source_data_type: transaction.source_data?.type || '',
      success: String(success || ''),
      hmac: hmac || '',
    }

    // Verify HMAC
    if (!verifyHmac(data, hmacSecret)) {
      logSecurityEvent('paymob_webhook_hmac_failed', { ip: clientIP })
      console.error('Paymob webhook HMAC verification failed')
      return NextResponse.json({ status: 'error', message: 'HMAC verification failed' }, { status: 400 })
    }

    if (success && orderId && transactionId) {
      const processed = await processSuccessfulPayment(orderId, transactionId, parseInt(String(amountCents || '0')))
      if (processed) {
        logSecurityEvent('paymob_webhook_success_processed', { ip: clientIP, orderId, transactionId })
      } else {
        logSecurityEvent('paymob_webhook_processing_failed', { ip: clientIP, orderId })
      }
    } else {
      logSecurityEvent('paymob_webhook_payment_failed', { ip: clientIP, success, orderId })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Paymob webhook error:', error)
    logSecurityEvent('paymob_webhook_error', { ip: clientIP, error: (error as Error).message })
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 })
  }
}
