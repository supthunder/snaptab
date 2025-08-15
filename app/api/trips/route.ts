import { NextRequest, NextResponse } from 'next/server'
import { createTrip, getTripsForUser } from '@/lib/neon-db-new'

// POST /api/trips - Create new trip
export async function POST(request: NextRequest) {
  let name, currency, username
  
  try {
    const body = await request.json()
    const parsed = body
    name = parsed.name
    currency = parsed.currency
    username = parsed.username

    if (!name || !username) {
      return NextResponse.json({ 
        error: 'Trip name and username are required' 
      }, { status: 400 })
    }

    const result = await createTrip(name, username, undefined, undefined, currency || 'USD')
    
    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to create trip. User may not exist.' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      trip: result.trip,
      tripCode: result.tripCode 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating trip in API:', error)
    return NextResponse.json({ 
      error: 'Failed to create trip',
      details: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        name,
        currency: currency || 'USD',
        username
      }
    }, { status: 500 })
  }
}

// GET /api/trips?username=... - Get user's trips
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ 
        error: 'Username is required' 
      }, { status: 400 })
    }

    const trips = await getTripsForUser(username)
    
    return NextResponse.json({ trips })

  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch trips',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 