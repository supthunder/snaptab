import { NextRequest } from 'next/server'
import { removeUserFromTrip } from '@/lib/neon-db-new'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const tripCode = parseInt(code)
    
    if (isNaN(tripCode)) {
      return Response.json({ error: 'Invalid trip code' }, { status: 400 })
    }

    const { userId } = await request.json()
    
    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Remove user from trip
    await removeUserFromTrip(tripCode, userId)
    
    return Response.json({ 
      success: true,
      message: 'Member removed from trip successfully'
    })

  } catch (error) {
    console.error('Error removing member from trip:', error)
    return Response.json({ 
      error: 'Failed to remove member from trip',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 