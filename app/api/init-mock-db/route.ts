import { NextRequest, NextResponse } from 'next/server'
import { initializeMockDatabase, getMockDatabaseStatus } from '@/lib/mock-db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Initializing mock database...')
    
    const result = await initializeMockDatabase()
    
    if (result.success) {
      const status = getMockDatabaseStatus()
      return NextResponse.json({ 
        success: true,
        message: '✅ Mock database initialized successfully!',
        status,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Mock database initialization failed',
        details: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Mock database initialization failed:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Mock database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = getMockDatabaseStatus()
    return NextResponse.json({ 
      success: true,
      message: '📊 Mock database status',
      status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error getting mock database status:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get mock database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}