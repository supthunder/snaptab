import { NextRequest, NextResponse } from 'next/server'
import { getTripByCode, getUserByUsername } from '@/lib/neon-db-new'
import { sql } from '@vercel/postgres'

// DELETE /api/trips/[code]/delete - Delete trip (only creator can delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const tripCode = parseInt(code)
    const { username } = await request.json()

    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code' 
      }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ 
        error: 'Username is required' 
      }, { status: 400 })
    }

    // Get trip and user
    const trip = await getTripByCode(tripCode)
    const user = await getUserByUsername(username)

    if (!trip) {
      return NextResponse.json({ 
        error: 'Trip not found' 
      }, { status: 404 })
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Check if user is the creator of this trip
    if (trip.created_by !== user.id) {
      return NextResponse.json({ 
        error: 'Only the trip creator can delete this trip' 
      }, { status: 403 })
    }

    // Check if trip has expenses
    const expensesResult = await sql`
      SELECT COUNT(*) as count FROM expenses WHERE trip_id = ${trip.id}
    `
    const expenseCount = parseInt(expensesResult.rows[0].count)

    if (expenseCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete trip that has expenses. Please settle all expenses first.' 
      }, { status: 400 })
    }

    // Delete the trip (CASCADE will handle trip_members)
    await sql`DELETE FROM trips WHERE id = ${trip.id}`

    return NextResponse.json({ 
      message: 'Trip deleted successfully',
      tripCode
    })

  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json({ 
      error: 'Failed to delete trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 