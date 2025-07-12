import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    console.log('🔍 Checking database schema...')
    
    // Check if trips table exists and get its structure
    const tableCheck = await sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'trips'
      ORDER BY ordinal_position
    `
    
    console.log('Trips table structure:', tableCheck.rows)
    
    // Check all tables in public schema
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log('All tables:', allTables.rows)
    
    // If trips table exists, try to get some data
    let tripsData: any[] = []
    if (tableCheck.rows.length > 0) {
      try {
        const data = await sql`SELECT * FROM trips LIMIT 5`
        tripsData = data.rows
      } catch (error) {
        console.log('Error querying trips table:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        tripsTableStructure: tableCheck.rows,
        allTables: allTables.rows,
        tripsData: tripsData
      }
    })
    
  } catch (error) {
    console.error('❌ Schema check failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 