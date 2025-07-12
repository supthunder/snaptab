import { NextRequest, NextResponse } from 'next/server'
import { getTripByCode, getTripMembers, getTripExpenses } from '@/lib/neon-db-new'

// GET /api/trips/[code] - Get trip info by code
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

    const trip = await getTripByCode(tripCode)
    
    if (!trip) {
      return NextResponse.json({ 
        error: 'Trip not found' 
      }, { status: 404 })
    }

    // Get members and expenses
    const [members, expenses] = await Promise.all([
      getTripMembers(tripCode),
      getTripExpenses(tripCode)
    ])

    return NextResponse.json({ 
      trip,
      members,
      expenses,
      memberCount: members.length
    })

  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 