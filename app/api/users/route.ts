import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByUsername } from '@/lib/neon-db-new'

// POST /api/users - Create or get user by username
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, displayName, avatarUrl } = body

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Check if user already exists
    let user = await getUserByUsername(username)
    
    if (user) {
      // User exists, return existing user
      return NextResponse.json({ user, isNew: false })
    }

    // Create new user
    user = await createUser(username, displayName, avatarUrl)
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    return NextResponse.json({ user, isNew: true }, { status: 201 })

  } catch (error) {
    console.error('Error in user creation:', error)
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 