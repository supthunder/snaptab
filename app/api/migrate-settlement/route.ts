import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// POST /api/migrate-settlement - Add settlement columns to expenses table
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting settlement migration...')
    
    // Add the new columns to the expenses table
    await sql`
      ALTER TABLE expenses 
      ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS settled_by_user_id UUID REFERENCES users(id)
    `
    
    console.log('✅ Settlement columns added successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Settlement migration completed successfully',
      columns_added: [
        'is_settled (BOOLEAN DEFAULT FALSE)',
        'settled_at (TIMESTAMP)',
        'settled_by_user_id (UUID REFERENCES users(id))'
      ]
    })

  } catch (error) {
    console.error('❌ Settlement migration failed:', error)
    return NextResponse.json({ 
      error: 'Failed to run settlement migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}