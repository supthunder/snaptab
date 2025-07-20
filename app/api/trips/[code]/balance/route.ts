import { NextRequest, NextResponse } from 'next/server'
import { getUserBalanceFromDB } from '@/lib/neon-db-new'

// GET /api/trips/[code]/balance?username=... - Get user balance for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const tripCode = parseInt(code)
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    
    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code. Must be 3 digits (100-999)' 
      }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ 
        error: 'Username is required' 
      }, { status: 400 })
    }

    const balance = await getUserBalanceFromDB(tripCode, username)
    
    return NextResponse.json({ 
      balance,
      username,
      tripCode
    })

  } catch (error) {
    console.error('Error calculating balance:', error)
    return NextResponse.json({ 
      error: 'Failed to calculate balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 