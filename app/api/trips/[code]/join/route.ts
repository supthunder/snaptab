import { NextRequest, NextResponse } from 'next/server'
import { joinTrip, getTripByCode, getTripMembers } from '@/lib/neon-db-new'

// POST /api/trips/[code]/join - Join trip with code
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json()
    const { username } = body
    const tripCode = parseInt(params.code)
    
    if (!username) {
      return NextResponse.json({ 
        error: 'Username is required' 
      }, { status: 400 })
    }

    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code. Must be 3 digits (100-999)' 
      }, { status: 400 })
    }

    // Check if trip exists
    const trip = await getTripByCode(tripCode)
    if (!trip) {
      return NextResponse.json({ 
        error: 'Trip not found' 
      }, { status: 404 })
    }

    // Join the trip
    const success = await joinTrip(tripCode, username)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to join trip. User may not exist.' 
      }, { status: 400 })
    }

    // Get updated member list
    const members = await getTripMembers(tripCode)

    return NextResponse.json({ 
      message: 'Successfully joined trip',
      trip,
      members,
      memberCount: members.length
    })

  } catch (error) {
    console.error('Error joining trip:', error)
    return NextResponse.json({ 
      error: 'Failed to join trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 