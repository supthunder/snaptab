import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from 'next/og'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const { tripCode, placeName, backgroundImageUrl } = await request.json()
    
    if (!tripCode) {
      return NextResponse.json({ error: 'Trip code is required' }, { status: 400 })
    }

                // Generate trip card image
            const imageResponse = new ImageResponse(
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
                    backgroundImage: backgroundImageUrl && backgroundImageUrl.startsWith('http')
                      ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundImageUrl})`
                      : 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)',
                    filter: backgroundImageUrl && backgroundImageUrl.startsWith('http') ? 'blur(1px)' : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textAlign: 'center',
                  }}
                >
                  {/* Header Text */}
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: '500',
                      marginBottom: 16,
                      color: 'rgba(255, 255, 255, 0.9)',
                      display: 'flex',
                    }}
                  >
                    ✈️ Join my trip!
                  </div>

                  {/* Place Name */}
                  {placeName ? (
                    <div
                      style={{
                        fontSize: 42,
                        fontWeight: '600',
                        marginBottom: 8,
                        color: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                      }}
                    >
                      📍 {placeName}
                    </div>
                  ) : null}

                  {/* Trip Code */}
                  <div
                    style={{
                      fontSize: 96,
                      fontWeight: 'bold',
                      letterSpacing: '0.1em',
                      marginBottom: 16,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                      display: 'flex',
                    }}
                  >
                    {tripCode}
                  </div>

                  {/* Bottom Text */}
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: '500',
                      color: 'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                    }}
                  >
                    💰 Split expenses together
                  </div>
                </div>
      ),
      {
        width: 600,
        height: 400,
      }
    )

    // Convert to buffer and save to blob
    const imageBuffer = await imageResponse.arrayBuffer()
    const timestamp = Date.now()
    const filename = `trip-cards/${tripCode}-${timestamp}.png`
    
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/png',
    })

    return NextResponse.json({
      imageUrl: blob.url,
      tripCode,
      placeName,
      filename
    })

  } catch (error) {
    console.error('Error generating trip card image:', error)
    return NextResponse.json({ 
      error: 'Failed to generate trip card image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 