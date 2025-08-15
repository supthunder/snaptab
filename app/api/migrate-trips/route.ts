import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// POST /api/migrate-trips - Add missing columns to trips table
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting trips table migration...')
    
    // Add missing columns to trips table
    await sql`
      ALTER TABLE trips 
      ADD COLUMN IF NOT EXISTS place_name VARCHAR(200),
      ADD COLUMN IF NOT EXISTS background_image_url TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
    `
    
    console.log('✅ Trips table migration completed successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Trips table migration completed successfully',
      columns_added: [
        'place_name (VARCHAR(200))',
        'background_image_url (TEXT)',
        'updated_at (TIMESTAMPTZ DEFAULT NOW())'
      ]
    })

  } catch (error) {
    console.error('❌ Trips table migration failed:', error)
    return NextResponse.json({ 
      error: 'Failed to run trips table migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}