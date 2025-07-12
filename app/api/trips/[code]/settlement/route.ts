import { NextRequest, NextResponse } from 'next/server'
import { getTripSettlement } from '@/lib/neon-db-new'

// GET /api/trips/[code]/settlement - Get settlement info for a trip
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

    const settlement = await getTripSettlement(tripCode)
    
    if (!settlement) {
      return NextResponse.json({ 
        error: 'Trip not found or unable to calculate settlement' 
      }, { status: 404 })
    }

    return NextResponse.json(settlement)

  } catch (error) {
    console.error('Error calculating settlement:', error)
    return NextResponse.json({ 
      error: 'Failed to calculate settlement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 