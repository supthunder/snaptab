import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { getUserByUsername } from '@/lib/neon-db-new'

export async function GET(request: NextRequest) {
  try {
    // Check what users exist
    const usersResult = await sql`SELECT * FROM users ORDER BY created_at DESC LIMIT 10`
    console.log('Users in database:', usersResult.rows)

    // Check what trips exist
    const tripsResult = await sql`SELECT * FROM trips ORDER BY created_at DESC LIMIT 10`
    console.log('Trips in database:', tripsResult.rows)

    // Test getUserByUsername function
    const aliceTest = await getUserByUsername('alice')
    console.log('Alice lookup result:', aliceTest)

    return NextResponse.json({
      users: usersResult.rows,
      trips: tripsResult.rows,
      aliceTest: aliceTest,
      debug: {
        userCount: usersResult.rows.length,
        tripCount: tripsResult.rows.length
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 