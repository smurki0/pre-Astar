import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'
import { db } from './db'

// Email template types
interface EmailTemplate {
  subject: string
  html: string
  text: string
}

// Email provider type
type EmailProvider = 'smtp' | 'sendgrid'

// Get email settings from database
async function getEmailSettings() {
  const settings = await db.setting.findMany({
    where: {
      key: {
        in: [
          'smtp_host',
          'smtp_port',
          'smtp_user',
          'smtp_password',
          'smtp_from_email',
          'smtp_from_name',
          'site_name_ar',
          'site_name_en',
          'email_provider',
          'sendgrid_api_key',
          'sendgrid_from_email',
          'sendgrid_from_name',
        ]
      }
    }
  })

  const settingsMap: Record<string, string> = {}
  settings.forEach(s => {
    settingsMap[s.key] = s.value
  })

  return {
    // SMTP settings
    host: settingsMap.smtp_host || '',
    port: parseInt(settingsMap.smtp_port || '587'),
    user: settingsMap.smtp_user || '',
    password: settingsMap.smtp_password || '',
    // Common settings
    fromEmail: settingsMap.smtp_from_email || settingsMap.sendgrid_from_email || '',
    fromName: settingsMap.smtp_from_name || settingsMap.sendgrid_from_name || settingsMap.site_name_ar || 'Astar',
    siteName: settingsMap.site_name_ar || 'استآر',
    // Provider
    provider: (settingsMap.email_provider || 'smtp') as EmailProvider,
    // SendGrid settings
    sendgridApiKey: settingsMap.sendgrid_api_key || '',
    sendgridFromEmail: settingsMap.sendgrid_from_email || '',
    sendgridFromName: settingsMap.sendgrid_from_name || settingsMap.site_name_ar || 'Astar',
  }
}

// Create SMTP transporter
function createSmtpTransporter(settings: Awaited<ReturnType<typeof getEmailSettings>>) {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  })
}

// Initialize SendGrid
function initSendGrid(apiKey: string) {
  sgMail.setApiKey(apiKey)
  return sgMail
}

// Send email via SMTP
async function sendViaSmtp(
  to: string,
  template: EmailTemplate,
  settings: Awaited<ReturnType<typeof getEmailSettings>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createSmtpTransporter(settings)
    
    await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return { success: true }
  } catch (error) {
    console.error('SMTP Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'SMTP sending failed' 
    }
  }
}

// Send email via SendGrid
async function sendViaSendGrid(
  to: string,
  template: EmailTemplate,
  settings: Awaited<ReturnType<typeof getEmailSettings>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const sg = initSendGrid(settings.sendgridApiKey)
    
    await sg.send({
      to,
      from: {
        email: settings.sendgridFromEmail,
        name: settings.sendgridFromName,
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    return { success: true }
  } catch (error) {
    console.error('SendGrid Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'SendGrid sending failed' 
    }
  }
}

// Generate order confirmation email
function orderConfirmationEmail(
  orderNumber: string,
  customerName: string,
  items: { name: string; quantity: number; price: number }[],
  total: number,
  shipping: number,
  siteName: string
): EmailTemplate {
  const itemsHtml = items
    .map(
      item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">${item.price.toLocaleString()} ج.م</td>
      </tr>
    `
    )
    .join('')

  return {
    subject: `تأكيد الطلب #${orderNumber} - ${siteName}`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #C4A4A4, #9B6B6B); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .order-info { background: #f8f5f3; border-radius: 8px; padding: 20px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f8f5f3; padding: 12px; text-align: right; }
          .total { font-size: 18px; font-weight: bold; color: #C4A4A4; margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee; }
          .footer { text-align: center; padding: 20px; color: #888; font-size: 14px; background: #f8f5f3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${siteName}</h1>
            <p style="margin: 10px 0 0 0;">شكراً لك على طلبك!</p>
          </div>
          <div class="content">
            <h2>مرحباً ${customerName}،</h2>
            <p>تم استلام طلبك بنجاح! إليك تفاصيل طلبك:</p>
            
            <div class="order-info">
              <p><strong>رقم الطلب:</strong> #${orderNumber}</p>
            </div>
            
            <h3>تفاصيل الطلب:</h3>
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th style="text-align: center;">الكمية</th>
                  <th style="text-align: left;">السعر</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total">
              <p>الشحن: ${shipping.toLocaleString()} ج.م</p>
              <p style="font-size: 22px;">الإجمالي: ${total.toLocaleString()} ج.م</p>
            </div>
            
            <p style="margin-top: 30px;">سنتواصل معك قريباً بشأن حالة طلبك.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${siteName}. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
مرحباً ${customerName}،

تم استلام طلبك بنجاح!
رقم الطلب: #${orderNumber}

تفاصيل الطلب:
${items.map(i => `- ${i.name} × ${i.quantity} = ${i.price.toLocaleString()} ج.م`).join('\n')}

الشحن: ${shipping.toLocaleString()} ج.م
الإجمالي: ${total.toLocaleString()} ج.م

سنتواصل معك قريباً بشأن حالة طلبك.

© ${new Date().getFullYear()} ${siteName}
    `,
  }
}

// Generate order shipped email
function orderShippedEmail(
  orderNumber: string,
  customerName: string,
  trackingNumber: string | null,
  siteName: string
): EmailTemplate {
  return {
    subject: `تم شحن طلبك #${orderNumber} - ${siteName}`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .tracking-box { background: #f0f0ff; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #888; background: #f8f5f3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🚚 تم شحن طلبك!</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${customerName}،</h2>
            <p>يسرنا إعلامك بأن طلبك <strong>#${orderNumber}</strong> قد تم شحنه!</p>
            
            ${trackingNumber ? `
            <div class="tracking-box">
              <p style="margin: 0; color: #666;">رقم التتبع</p>
              <p style="font-size: 24px; font-weight: bold; margin: 10px 0; color: #6366f1;">${trackingNumber}</p>
            </div>
            ` : ''}
            
            <p>سيصلك طلبك قريباً إن شاء الله.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${siteName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
مرحباً ${customerName}،

تم شحن طلبك #${orderNumber}!
${trackingNumber ? `رقم التتبع: ${trackingNumber}` : ''}

سيصلك طلبك قريباً.

© ${new Date().getFullYear()} ${siteName}
    `,
  }
}

// Generate order delivered email
function orderDeliveredEmail(
  orderNumber: string,
  customerName: string,
  siteName: string
): EmailTemplate {
  return {
    subject: `تم تسليم طلبك #${orderNumber} - ${siteName}`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; text-align: center; }
          .success-icon { font-size: 60px; margin-bottom: 20px; }
          .footer { text-align: center; padding: 20px; color: #888; background: #f8f5f3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ تم التسليم بنجاح!</h1>
          </div>
          <div class="content">
            <div class="success-icon">🎉</div>
            <h2>مرحباً ${customerName}،</h2>
            <p>تم تسليم طلبك <strong>#${orderNumber}</strong> بنجاح!</p>
            <p>نتمنى أن تكون سعيداً بمشترياتك من ${siteName}</p>
            <p style="margin-top: 30px;">شكراً لتسوقك معنا! 💕</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${siteName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
مرحباً ${customerName}،

تم تسليم طلبك #${orderNumber} بنجاح!

نتمنى أن تكون سعيداً بمشترياتك.

شكراً لتسوقك معنا!

© ${new Date().getFullYear()} ${siteName}
    `,
  }
}

// Generate payment confirmation email
function paymentConfirmationEmail(
  orderNumber: string,
  customerName: string,
  amount: number,
  paymentMethod: string,
  siteName: string
): EmailTemplate {
  const paymentMethods: Record<string, string> = {
    cod: 'الدفع عند الاستلام',
    fawry: 'فوري',
    paymob: 'باي موب',
    vodafonecash: 'فودافون كاش',
    card: 'بطاقة ائتمان',
  }

  return {
    subject: `تأكيد الدفع - الطلب #${orderNumber} - ${siteName}`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', 'Tajawal', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .payment-info { background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #888; background: #f8f5f3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ تم تأكيد الدفع</h1>
          </div>
          <div class="content">
            <h2>مرحباً ${customerName}،</h2>
            <p>تم تأكيد دفعك بنجاح!</p>
            
            <div class="payment-info">
              <p><strong>رقم الطلب:</strong> #${orderNumber}</p>
              <p><strong>المبلغ:</strong> ${amount.toLocaleString()} ج.م</p>
              <p><strong>طريقة الدفع:</strong> ${paymentMethods[paymentMethod] || paymentMethod}</p>
            </div>
            
            <p>جاري تجهيز طلبك وسيتم شحنه قريباً.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${siteName}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
مرحباً ${customerName}،

تم تأكيد دفعك بنجاح!

رقم الطلب: #${orderNumber}
المبلغ: ${amount.toLocaleString()} ج.م
طريقة الدفع: ${paymentMethods[paymentMethod] || paymentMethod}

جاري تجهيز طلبك وسيتم شحنه قريباً.

© ${new Date().getFullYear()} ${siteName}
    `,
  }
}

// Main send email function - routes to appropriate provider
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await getEmailSettings()
    
    // Check if provider is configured
    if (settings.provider === 'sendgrid') {
      if (!settings.sendgridApiKey || !settings.sendgridFromEmail) {
        return { success: false, error: 'SendGrid settings not configured' }
      }
      return sendViaSendGrid(to, template, settings)
    } else {
      // Default to SMTP
      if (!settings.host || !settings.user || !settings.fromEmail) {
        return { success: false, error: 'SMTP settings not configured' }
      }
      return sendViaSmtp(to, template, settings)
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  items: { name: string; quantity: number; price: number }[],
  total: number,
  shipping: number
) {
  const settings = await getEmailSettings()
  const template = orderConfirmationEmail(
    orderNumber,
    customerName,
    items,
    total,
    shipping,
    settings.siteName
  )
  
  return sendEmail(customerEmail, template)
}

// Send order shipped email
export async function sendOrderShippedEmail(
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  trackingNumber: string | null
) {
  const settings = await getEmailSettings()
  const template = orderShippedEmail(
    orderNumber,
    customerName,
    trackingNumber,
    settings.siteName
  )
  
  return sendEmail(customerEmail, template)
}

// Send order delivered email
export async function sendOrderDeliveredEmail(
  orderNumber: string,
  customerEmail: string,
  customerName: string
) {
  const settings = await getEmailSettings()
  const template = orderDeliveredEmail(
    orderNumber,
    customerName,
    settings.siteName
  )
  
  return sendEmail(customerEmail, template)
}

// Send payment confirmation email
export async function sendPaymentConfirmationEmail(
  orderNumber: string,
  customerEmail: string,
  customerName: string,
  amount: number,
  paymentMethod: string
) {
  const settings = await getEmailSettings()
  const template = paymentConfirmationEmail(
    orderNumber,
    customerName,
    amount,
    paymentMethod,
    settings.siteName
  )
  
  return sendEmail(customerEmail, template)
}

// Test email connection - tests both SMTP and SendGrid
export async function testEmailConnection(): Promise<{ 
  success: boolean
  error?: string
  provider?: string
  smtpWorking?: boolean
  sendgridWorking?: boolean
}> {
  try {
    const settings = await getEmailSettings()
    const results = {
      smtpWorking: false,
      sendgridWorking: false,
    }

    // Test SMTP if configured
    if (settings.host && settings.user) {
      try {
        const transporter = createSmtpTransporter(settings)
        await transporter.verify()
        results.smtpWorking = true
      } catch (error) {
        console.error('SMTP test failed:', error)
      }
    }

    // Test SendGrid if configured
    if (settings.sendgridApiKey) {
      try {
        // SendGrid doesn't have a verify method, so we just check if the API key is valid format
        if (settings.sendgridApiKey.startsWith('SG.')) {
          results.sendgridWorking = true
        }
      } catch (error) {
        console.error('SendGrid test failed:', error)
      }
    }

    // Determine success based on active provider
    if (settings.provider === 'sendgrid') {
      if (results.sendgridWorking) {
        return { success: true, provider: 'sendgrid', ...results }
      }
      return { success: false, error: 'SendGrid not configured properly', ...results }
    } else {
      if (results.smtpWorking) {
        return { success: true, provider: 'smtp', ...results }
      }
      return { success: false, error: 'SMTP not configured properly', ...results }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    }
  }
}

// Send test email
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  const settings = await getEmailSettings()
  
  return sendEmail(to, {
    subject: `اختبار البريد - ${settings.siteName}`,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; }
          .success { color: #10b981; font-size: 60px; text-align: center; }
          .provider { background: #f8f5f3; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅</div>
          <h1 style="text-align: center;">اختبار البريد ناجح!</h1>
          <div class="provider">
            <p style="text-align: center;"><strong>مزود الخدمة:</strong> ${settings.provider === 'sendgrid' ? 'SendGrid' : 'SMTP'}</p>
          </div>
          <p style="text-align: center;">هذا بريد تجريبي للتأكد من صحة إعدادات البريد الإلكتروني.</p>
          <p style="text-align: center; color: #888; font-size: 14px;">أُرسل في: ${new Date().toLocaleString('ar-EG')}</p>
        </div>
      </body>
      </html>
    `,
    text: `اختبار البريد ناجح!\n\nمزود الخدمة: ${settings.provider === 'sendgrid' ? 'SendGrid' : 'SMTP'}\n\nهذا بريد تجريبي للتأكد من صحة إعدادات البريد الإلكتروني.\n\nأُرسل في: ${new Date().toLocaleString('ar-EG')}`,
  })
}

// Get email provider status
export async function getEmailProviderStatus(): Promise<{
  activeProvider: string
  smtpConfigured: boolean
  sendgridConfigured: boolean
}> {
  const settings = await getEmailSettings()
  
  return {
    activeProvider: settings.provider,
    smtpConfigured: !!(settings.host && settings.user),
    sendgridConfigured: !!(settings.sendgridApiKey && settings.sendgridFromEmail),
  }
}
