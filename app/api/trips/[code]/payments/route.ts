import { NextRequest, NextResponse } from 'next/server'
import { 
  getTripByCode, 
  calculateSettlementPayments, 
  getSettlementPayments, 
  updatePaymentStatus,
  getUserByUsername
} from '@/lib/neon-db-new'

// GET /api/trips/[code]/payments - Get all settlement payments for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const tripCode = parseInt(code)
    
    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code. Must be 3 digits (100-999)' 
      }, { status: 400 })
    }

    // Get trip to verify it exists
    const trip = await getTripByCode(tripCode)
    if (!trip) {
      return NextResponse.json({ 
        error: 'Trip not found' 
      }, { status: 404 })
    }

    // Calculate settlement payments first (creates/updates based on current balances)
    await calculateSettlementPayments(tripCode)

    // Get all settlement payments
    const payments = await getSettlementPayments(trip.id)

    return NextResponse.json({ payments })

  } catch (error) {
    console.error('Error fetching settlement payments:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch settlement payments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/trips/[code]/payments - Update payment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const tripCode = parseInt(code)
    
    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code. Must be 3 digits (100-999)' 
      }, { status: 400 })
    }

    const body = await request.json()
    const { paymentId, isPaid, username } = body

    if (!paymentId || typeof isPaid !== 'boolean' || !username) {
      return NextResponse.json({ 
        error: 'Missing required fields: paymentId, isPaid, username' 
      }, { status: 400 })
    }

    // Get user who is marking the payment
    const user = await getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Update payment status
    const success = await updatePaymentStatus(paymentId, isPaid, user.id)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to update payment status' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `Payment marked as ${isPaid ? 'paid' : 'unpaid'}` 
    })

  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json({ 
      error: 'Failed to update payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 