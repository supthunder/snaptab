import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST() {
  try {
    console.log('🧹 Starting duplicate cleanup...')

    // Step 1: Identify duplicates
    const duplicatesResult = await sql`
      SELECT 
          t.trip_code,
          u.username,
          u.display_name,
          COUNT(*) as duplicate_count
      FROM trip_members tm
      JOIN trips t ON tm.trip_id = t.id
      JOIN users u ON tm.user_id = u.id
      WHERE tm.is_active = true
      GROUP BY t.trip_code, u.username, u.display_name, tm.trip_id, tm.user_id
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `

    const duplicatesFound = duplicatesResult.rows
    console.log(`Found ${duplicatesFound.length} duplicate member entries:`, duplicatesFound)

    if (duplicatesFound.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found! Database is clean.',
        duplicatesFound: 0,
        duplicatesRemoved: 0
      })
    }

    // Step 2: Remove duplicates (keep the earliest joined_at record)
    const deleteResult = await sql`
      DELETE FROM trip_members 
      WHERE id IN (
          SELECT tm.id
          FROM trip_members tm
          JOIN trips t ON tm.trip_id = t.id
          JOIN users u ON tm.user_id = u.id
          WHERE tm.is_active = true
          AND tm.id NOT IN (
              -- Keep only the first record for each trip+user combination
              SELECT DISTINCT ON (tm2.trip_id, tm2.user_id) tm2.id
              FROM trip_members tm2
              WHERE tm2.is_active = true
              ORDER BY tm2.trip_id, tm2.user_id, tm2.joined_at ASC
          )
      )
    `

    const duplicatesRemoved = deleteResult.rowCount || 0
    console.log(`Removed ${duplicatesRemoved} duplicate records`)

    // Step 3: Verify cleanup
    const verificationResult = await sql`
      SELECT 
          t.trip_code,
          u.username,
          COUNT(*) as member_count
      FROM trip_members tm
      JOIN trips t ON tm.trip_id = t.id
      JOIN users u ON tm.user_id = u.id
      WHERE tm.is_active = true
      GROUP BY t.trip_code, u.username, tm.trip_id, tm.user_id
      HAVING COUNT(*) > 1
    `

    const remainingDuplicates = verificationResult.rows.length
    console.log(`Verification: ${remainingDuplicates} duplicates remaining`)

    // Step 4: Get cleaned member list
    const cleanedMembersResult = await sql`
      SELECT 
          t.trip_code,
          t.name as trip_name,
          u.username,
          u.display_name,
          tm.joined_at
      FROM trip_members tm
      JOIN trips t ON tm.trip_id = t.id
      JOIN users u ON tm.user_id = u.id
      WHERE tm.is_active = true
      ORDER BY t.trip_code, tm.joined_at
    `

    return NextResponse.json({
      success: true,
      message: `✅ Cleanup completed! Removed ${duplicatesRemoved} duplicate members.`,
      duplicatesFound: duplicatesFound.length,
      duplicatesRemoved,
      remainingDuplicates,
      cleanedMembers: cleanedMembersResult.rows,
      duplicateDetails: duplicatesFound
    })

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clean up duplicates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 