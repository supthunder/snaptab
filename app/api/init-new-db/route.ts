import { NextRequest, NextResponse } from 'next/server'
import { initializeNewDatabase, testNewConnection } from '@/lib/neon-db-new'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing connection to new SnapTab database...')
    
    // Test connection
    const connectionResult = await testNewConnection()
    if (!connectionResult.success) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: connectionResult.error 
      }, { status: 500 })
    }

    // Initialize new database schema
    console.log('🔧 Initializing new database schema...')
    const initResult = await initializeNewDatabase()
    if (!initResult.success) {
      return NextResponse.json({ 
        error: 'Database initialization failed', 
        details: initResult.error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: '✅ New SnapTab database schema initialized successfully!',
      connectionTest: connectionResult.data,
      timestamp: new Date().toISOString(),
      next_steps: [
        "Database tables created: users, trips, trip_members, expenses, expense_items, item_assignments",
        "API endpoints available:",
        "  POST /api/users - Create user",
        "  POST /api/trips - Create trip", 
        "  POST /api/trips/[code]/join - Join trip",
        "  POST /api/trips/[code]/expenses - Add expense",
        "  GET /api/trips/[code] - Get trip info",
        "Ready for username-based auth and 3-digit trip codes!"
      ]
    })

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return NextResponse.json({ 
      error: 'Database initialization failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 