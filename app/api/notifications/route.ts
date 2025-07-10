import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription data required' }, { status: 400 })
    }

    // Store subscription in database (would extend User model to include push subscriptions)
    // For now, just return success
    return NextResponse.json({ 
      message: 'Push notification subscription successful',
      subscription 
    })
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Send notification to trip members when new expense is added
export async function sendExpenseNotification(tripId: string, expenseDescription: string, amount: number, currency: string) {
  try {
    // Get all trip members
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!trip) {
      throw new Error('Trip not found')
    }

    // In a real implementation, you would:
    // 1. Get push subscriptions for each member
    // 2. Send push notifications using web-push library
    // 3. Handle failed notifications

    const notificationPayload = {
      title: 'New Expense Added',
      body: `${expenseDescription} - ${currency} ${amount.toFixed(2)}`,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'expense-added',
      data: {
        tripId,
        type: 'expense-added',
        url: '/expenses',
      },
    }

    console.log('Would send notification to', trip.members.length, 'members:', notificationPayload)

    return { success: true, recipients: trip.members.length }
  } catch (error) {
    console.error('Error sending expense notification:', error)
    throw error
  }
}