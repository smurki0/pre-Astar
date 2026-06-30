import { NextRequest, NextResponse } from 'next/server'
import { 
  getSecurityLog, 
  blockIP, 
  unblockIP, 
  isIPBlocked,
  SECURITY_CONFIG,
  cleanupRateLimits,
} from '@/lib/security'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/admin/security - Get security status and logs
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'logs':
        return NextResponse.json({
          logs: getSecurityLog().slice(-100), // Last 100 events
        })

      case 'stats':
        return NextResponse.json({
          config: {
            rateLimit: SECURITY_CONFIG.rateLimit,
            password: {
              minLength: SECURITY_CONFIG.password.minLength,
              requirements: {
                uppercase: SECURITY_CONFIG.password.requireUppercase,
                lowercase: SECURITY_CONFIG.password.requireLowercase,
                number: SECURITY_CONFIG.password.requireNumber,
                special: SECURITY_CONFIG.password.requireSpecial,
              },
            },
          },
          blockedIPs: Array.from(SECURITY_CONFIG.blockedIPs),
          totalBlocked: SECURITY_CONFIG.blockedIPs.size,
        })

      case 'check-ip':
        const ip = searchParams.get('ip')
        if (!ip) {
          return NextResponse.json({ error: 'IP address required' }, { status: 400 })
        }
        return NextResponse.json({
          ip,
          blocked: isIPBlocked(ip),
        })

      default:
        return NextResponse.json({
          message: 'Security API',
          actions: ['logs', 'stats', 'check-ip'],
        })
    }
  } catch (error) {
    console.error('Security API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/security - Perform security actions
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ip } = body

    switch (action) {
      case 'block-ip':
        if (!ip) {
          return NextResponse.json({ error: 'IP address required' }, { status: 400 })
        }
        blockIP(ip)
        return NextResponse.json({ 
          message: 'IP blocked successfully', 
          ip,
          blockedIPs: Array.from(SECURITY_CONFIG.blockedIPs),
        })

      case 'unblock-ip':
        if (!ip) {
          return NextResponse.json({ error: 'IP address required' }, { status: 400 })
        }
        unblockIP(ip)
        return NextResponse.json({ 
          message: 'IP unblocked successfully', 
          ip,
          blockedIPs: Array.from(SECURITY_CONFIG.blockedIPs),
        })

      case 'cleanup':
        cleanupRateLimits()
        return NextResponse.json({ message: 'Rate limit records cleaned up' })

      case 'clear-blocked':
        SECURITY_CONFIG.blockedIPs.clear()
        return NextResponse.json({ message: 'All blocked IPs cleared' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Security API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
