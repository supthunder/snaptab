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
            backgroundColor: '#1e1b4b',
            position: 'relative',
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'center'
          }}
        >
          {/* Background Image with proper stretching */}
          {backgroundImageUrl ? (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${
                  backgroundImageUrl.startsWith('/') 
                    ? `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}${backgroundImageUrl}`
                    : backgroundImageUrl
                })`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(2px)',
                zIndex: 1,
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, #1e40af, #7c3aed, #1e40af)',
                zIndex: 1,
              }}
            />
          )}

          {/* Dark overlay for better text readability */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2,
            }}
          />

          {/* Content with better text styling */}
          <div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            {/* Header Text */}
            <div
              style={{
                fontSize: 36,
                fontWeight: '700',
                marginBottom: 20,
                color: 'white',
                textShadow: '0 0 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                display: 'flex',
              }}
            >
              ✈️ Join my trip!
            </div>

            {/* Place Name */}
            {placeName && (
              <div
                style={{
                  fontSize: 54,
                  fontWeight: '800',
                  marginBottom: 16,
                  color: 'white',
                  textShadow: '0 0 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                  display: 'flex',
                }}
              >
                📍 {placeName}
              </div>
            )}

            {/* Trip Code */}
            <div
              style={{
                fontSize: 120,
                fontWeight: '900',
                letterSpacing: '0.1em',
                marginBottom: 24,
                color: 'white',
                textShadow: '0 0 30px rgba(0,0,0,0.9), 4px 4px 8px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.7)',
                display: 'flex',
              }}
            >
              {tripCode}
            </div>

            {/* Bottom Text */}
            <div
              style={{
                fontSize: 30,
                fontWeight: '700',
                color: 'white',
                textShadow: '0 0 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                display: 'flex',
              }}
            >
              💰 Split expenses together
            </div>
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