import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// POST /api/migrate-passkey - Create passkey_credentials table
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting passkey migration...')
    
    // Create the passkey_credentials table
    await sql`
      CREATE TABLE IF NOT EXISTS passkey_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credential_id TEXT UNIQUE NOT NULL,
        public_key TEXT NOT NULL,
        counter INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    
    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON passkey_credentials(user_id)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON passkey_credentials(credential_id)
    `
    
    console.log('✅ Passkey credentials table created successfully')
    
    return NextResponse.json({ 
      success: true,
      message: 'Passkey migration completed successfully',
      table_created: 'passkey_credentials',
      indexes_created: [
        'idx_passkey_credentials_user_id',
        'idx_passkey_credentials_credential_id'
      ]
    })

  } catch (error) {
    console.error('❌ Passkey migration failed:', error)
    return NextResponse.json({ 
      error: 'Failed to run passkey migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}