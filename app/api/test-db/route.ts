import { NextRequest, NextResponse } from 'next/server'
import { testConnection, initializeDatabase } from '@/lib/neon-db'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Neon database connection...')
    
    // Test connection
    const connectionResult = await testConnection()
    if (!connectionResult.success) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: connectionResult.error 
      }, { status: 500 })
    }

    // Initialize database (create tables if they don't exist)
    console.log('🔧 Initializing database...')
    const initResult = await initializeDatabase()
    if (!initResult.success) {
      return NextResponse.json({ 
        error: 'Database initialization failed', 
        details: initResult.error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: '✅ Database connection and initialization successful!',
      connectionTest: connectionResult.data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({ 
      error: 'Database test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 