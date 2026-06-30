import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Fetch notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')

    const notifications = await db.notification.findMany({
      where: unreadOnly ? { isRead: false } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await db.notification.count({
      where: { isRead: false },
    })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, message, data, link } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        link,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, markAllAsRead } = body

    if (markAllAsRead) {
      await db.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No notification IDs provided' },
        { status: 400 }
      )
    }

    await db.notification.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true, message: 'Notifications marked as read' })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, deleteAll } = body

    if (deleteAll) {
      await db.notification.deleteMany({})
      return NextResponse.json({ success: true, message: 'All notifications deleted' })
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No notification IDs provided' },
        { status: 400 }
      )
    }

    await db.notification.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ success: true, message: 'Notifications deleted' })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    )
  }
}
