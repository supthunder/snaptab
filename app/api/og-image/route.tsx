import { NextRequest } from 'next/server'
import { ImageResponse } from '@vercel/og'
import { put } from '@vercel/blob'

export const runtime = 'edge'

// Generate OG image for trip cards
export async function POST(request: NextRequest) {
  try {
    const { tripCode, placeName, backgroundImageUrl, username } = await request.json()

    if (!tripCode) {
      return new Response('Trip code is required', { status: 400 })
    }

    // Generate the OG image using Vercel OG
    const ogImage = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: backgroundImageUrl 
              ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundImageUrl})`
              : 'linear-gradient(45deg, #1e40af, #7c3aed, #1e40af)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          {/* Location name at top */}
          {placeName && (
            <div
              style={{
                position: 'absolute',
                top: 80,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                color: 'white',
                fontSize: 36,
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              {placeName}
            </div>
          )}
          
          {/* Trip Code - Large and centered */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: placeName ? 40 : 0
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: 120,
                fontWeight: 900,
                letterSpacing: '0.1em',
                textAlign: 'center',
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                display: 'flex'
              }}
            >
              {tripCode}
            </div>
            
            {/* Underline */}
            <div
              style={{
                width: 120,
                height: 4,
                background: 'rgba(255, 255, 255, 0.6)',
                borderRadius: 2,
                marginTop: 20,
                marginBottom: 30,
                display: 'flex'
              }}
            />
          </div>

          {/* Call to action text */}
          <div
            style={{
              position: 'absolute',
              bottom: 100,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white'
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                marginBottom: 10,
                textAlign: 'center',
                display: 'flex'
              }}
            >
              {username ? `Join ${username}'s trip` : 'Share this code with your travel buddies'}
            </div>
            
            {/* SnapTab branding */}
            <div
              style={{
                fontSize: 24,
                fontWeight: 500,
                opacity: 0.8,
                textAlign: 'center',
                display: 'flex'
              }}
            >
              SnapTab - Split travel expenses
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )

    // Convert ImageResponse to buffer
    const imageBuffer = await ogImage.arrayBuffer()
    
    // Generate filename
    const filename = `og-images/${tripCode}-${Date.now()}.png`
    
    // Store in Vercel Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/png'
    })

    return Response.json({ 
      imageUrl: blob.url,
      tripCode,
      placeName,
      username
    })

  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate OG image', { status: 500 })
  }
} 