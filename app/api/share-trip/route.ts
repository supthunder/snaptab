import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// Generate random 5-character suffix
function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const { tripCode, placeName, backgroundImageUrl, username } = await request.json()

    if (!tripCode) {
      return NextResponse.json({ error: 'Trip code is required' }, { status: 400 })
    }

    // Generate random suffix for share code
    const suffix = generateRandomSuffix()
    const shareCode = `${tripCode}${suffix}`

    // Generate OG image using our OG API
    let ogImageUrl = null
    try {
      const ogResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/og-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripCode,
          placeName,
          backgroundImageUrl: backgroundImageUrl && backgroundImageUrl.startsWith('http') ? backgroundImageUrl : null,
          username
        })
      })

      if (ogResponse.ok) {
        const ogData = await ogResponse.json()
        ogImageUrl = ogData.imageUrl
      } else {
        console.error('OG image generation failed:', await ogResponse.text())
      }
    } catch (error) {
      console.error('Error generating OG image:', error)
    }

    // Store share data in database
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS trip_shares (
          id SERIAL PRIMARY KEY,
          share_code VARCHAR(8) UNIQUE NOT NULL,
          trip_code VARCHAR(3) NOT NULL,
          og_image_url TEXT,
          username VARCHAR(50),
          place_name VARCHAR(100),
          background_image_url TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `

      await sql`
        INSERT INTO trip_shares (share_code, trip_code, og_image_url, username, place_name, background_image_url)
        VALUES (${shareCode}, ${tripCode}, ${ogImageUrl}, ${username || null}, ${placeName || null}, ${backgroundImageUrl || null})
      `

      return NextResponse.json({
        shareCode,
        shareUrl: `/${shareCode}`, // This will be snaptab.cash/928abcde
        ogImageUrl,
        tripCode,
        placeName,
        username
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      
      // If there's a unique constraint violation, try again with a different suffix
      if (dbError instanceof Error && dbError.message.includes('unique')) {
        // Recursively try with a new suffix (max 3 attempts to prevent infinite loops)
        const retryResponse = await fetch(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify({ tripCode, placeName, backgroundImageUrl, username, _retry: true })
        })
        return retryResponse
      }
      
      throw dbError
    }

  } catch (error) {
    console.error('Error creating share URL:', error)
    return NextResponse.json({ 
      error: 'Failed to create share URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 