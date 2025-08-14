import { NextRequest, NextResponse } from 'next/server'
import { getUserVenmoUsername, updateUserVenmoUsername, deleteUserVenmoUsername } from '@/lib/neon-db-new'

// GET /api/users/venmo?username=<username> - Get user's Venmo username
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const venmoUsername = await getUserVenmoUsername(username)
    
    return NextResponse.json({ 
      username,
      venmoUsername: venmoUsername || null,
      hasVenmoUsername: !!venmoUsername
    })

  } catch (error) {
    console.error('Error fetching Venmo username:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch Venmo username',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/users/venmo - Set user's Venmo username
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, venmoUsername } = body

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (!venmoUsername || venmoUsername.trim() === '') {
      return NextResponse.json({ error: 'Venmo username is required' }, { status: 400 })
    }

    const success = await updateUserVenmoUsername(username, venmoUsername.trim())
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to set Venmo username' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Venmo username updated successfully',
      venmoUsername: venmoUsername.trim().toLowerCase()
    })

  } catch (error) {
    console.error('Error setting Venmo username:', error)
    return NextResponse.json({ 
      error: 'Failed to set Venmo username',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/users/venmo - Remove user's Venmo username
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const success = await deleteUserVenmoUsername(username)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove Venmo username' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Venmo username removed successfully'
    })

  } catch (error) {
    console.error('Error removing Venmo username:', error)
    return NextResponse.json({ 
      error: 'Failed to remove Venmo username',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 