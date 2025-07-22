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

    console.log('🔗 Share trip request:', { 
      tripCode, 
      placeName, 
      hasBackgroundImage: !!backgroundImageUrl,
      backgroundImageUrl: backgroundImageUrl ? backgroundImageUrl.substring(0, 50) + '...' : 'null',
      username 
    })

    if (!tripCode) {
      return NextResponse.json({ error: 'Trip code is required' }, { status: 400 })
    }

    // Check if a share link already exists for this trip code
    const existingShare = await sql`
      SELECT share_code, og_image_url, username, place_name, background_image_url
      FROM trip_shares 
      WHERE trip_code = ${tripCode}
      LIMIT 1
    `

    if (existingShare.rows.length > 0) {
      const existing = existingShare.rows[0]
      console.log('♻️ Reusing existing share link for trip:', tripCode)
      
      console.log('♻️ Existing share data:', { 
        shareCode: existing.share_code, 
        hasBackgroundImage: !!existing.background_image_url,
        backgroundImageUrl: existing.background_image_url ? existing.background_image_url.substring(0, 50) + '...' : 'null'
      })
      
      return NextResponse.json({
        shareCode: existing.share_code,
        shareUrl: `/${existing.share_code}`,
        ogImageUrl: existing.og_image_url,
        tripCode,
        placeName: existing.place_name,
        username: existing.username,
        backgroundImageUrl: existing.background_image_url,
        isExisting: true
      })
    }

    // Generate new share code only if none exists
    const suffix = generateRandomSuffix()
    const shareCode = `${tripCode}${suffix}`

    // Generate trip card image for better iMessage/social previews
    let ogImageUrl = null
    try {
      const tripCardResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/trip-card-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripCode,
          placeName,
          backgroundImageUrl: backgroundImageUrl && backgroundImageUrl.startsWith('http') ? backgroundImageUrl : null
        })
      })

      if (tripCardResponse.ok) {
        const tripCardData = await tripCardResponse.json()
        ogImageUrl = tripCardData.imageUrl
        console.log('✅ Trip card image generated:', ogImageUrl)
      } else {
        console.error('Trip card image generation failed:', await tripCardResponse.text())
      }
    } catch (error) {
      console.error('Error generating trip card image:', error)
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

      console.log('✅ New share link created:', { 
        shareCode, 
        hasBackgroundImage: !!backgroundImageUrl,
        hasOgImage: !!ogImageUrl 
      })

      return NextResponse.json({
        shareCode,
        shareUrl: `/${shareCode}`, // This will be snaptab.cash/928abcde
        ogImageUrl,
        tripCode,
        placeName,
        username,
        backgroundImageUrl
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