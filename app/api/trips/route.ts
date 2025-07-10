import { NextRequest, NextResponse } from 'next/server'
import { createTrip, getUserTrips, setActiveTrip } from '@/lib/data-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const trips = await getUserTrips()
    return NextResponse.json(trips)
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, baseCurrency, startDate, endDate } = body

    if (!name || !baseCurrency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const trip = await createTrip({
      name,
      baseCurrency,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tripId } = body

    if (!tripId) {
      return NextResponse.json({ error: 'Missing trip ID' }, { status: 400 })
    }

    const trip = await setActiveTrip(tripId)
    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error setting active trip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}