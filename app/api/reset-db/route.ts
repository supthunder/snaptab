import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { initializeNewDatabase } from '@/lib/neon-db-new'

export async function POST() {
  try {
    console.log('🗑️  Dropping all existing tables...')
    
    // Drop all tables in correct order (reverse of dependencies)
    await sql`DROP TABLE IF EXISTS item_assignments CASCADE`
    await sql`DROP TABLE IF EXISTS expense_items CASCADE`
    await sql`DROP TABLE IF EXISTS expenses CASCADE`
    await sql`DROP TABLE IF EXISTS trip_members CASCADE`
    await sql`DROP TABLE IF EXISTS trips CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`
    
    console.log('✅ All tables dropped successfully')
    
    // Recreate with new schema
    console.log('🔧 Recreating database with new schema...')
    const result = await initializeNewDatabase()
    
    if (result.success) {
      console.log('✅ Database reset and recreated successfully!')
      return NextResponse.json({
        success: true,
        message: 'Database reset and recreated with new schema'
      })
    } else {
      console.error('❌ Failed to recreate database:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to recreate database',
        details: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 