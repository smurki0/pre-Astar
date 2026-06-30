import { NextRequest, NextResponse } from 'next/server'
import { 
  sendTestEmail, 
  testEmailConnection, 
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendPaymentConfirmationEmail,
} from '@/lib/email'

// POST /api/email - Send email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, to, orderData } = body

    switch (action) {
      case 'test':
        if (!to) {
          return NextResponse.json(
            { error: 'Email address is required' },
            { status: 400 }
          )
        }
        const testResult = await sendTestEmail(to)
        return NextResponse.json(testResult)

      case 'test-connection':
        const connectionResult = await testEmailConnection()
        return NextResponse.json(connectionResult)

      case 'order-confirmation':
        if (!orderData || !to) {
          return NextResponse.json(
            { error: 'Order data and email are required' },
            { status: 400 }
          )
        }
        const orderResult = await sendOrderConfirmationEmail(
          orderData.orderNumber,
          to,
          orderData.customerName,
          orderData.items,
          orderData.total,
          orderData.shipping
        )
        return NextResponse.json(orderResult)

      case 'order-shipped':
        if (!orderData || !to) {
          return NextResponse.json(
            { error: 'Order data and email are required' },
            { status: 400 }
          )
        }
        const shippedResult = await sendOrderShippedEmail(
          orderData.orderNumber,
          to,
          orderData.customerName,
          orderData.trackingNumber
        )
        return NextResponse.json(shippedResult)

      case 'order-delivered':
        if (!orderData || !to) {
          return NextResponse.json(
            { error: 'Order data and email are required' },
            { status: 400 }
          )
        }
        const deliveredResult = await sendOrderDeliveredEmail(
          orderData.orderNumber,
          to,
          orderData.customerName
        )
        return NextResponse.json(deliveredResult)

      case 'payment-confirmation':
        if (!orderData || !to) {
          return NextResponse.json(
            { error: 'Order data and email are required' },
            { status: 400 }
          )
        }
        const paymentResult = await sendPaymentConfirmationEmail(
          orderData.orderNumber,
          to,
          orderData.customerName,
          orderData.amount,
          orderData.paymentMethod
        )
        return NextResponse.json(paymentResult)

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/email - Test connection
export async function GET() {
  try {
    const result = await testEmailConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error testing email connection:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
