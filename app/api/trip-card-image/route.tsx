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
                    position: 'relative',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textAlign: 'center',
                  }}
                >
                  {/* Background Image with proper stretching */}
                  {backgroundImageUrl && backgroundImageUrl.startsWith('http') ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${backgroundImageUrl})`,
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
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)',
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
                        fontSize: 28,
                        fontWeight: '700',
                        marginBottom: 16,
                        color: 'white',
                        textShadow: '0 0 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)',
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
                          fontWeight: '800',
                          marginBottom: 12,
                          color: 'white',
                          textShadow: '0 0 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)',
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
                        fontWeight: '900',
                        letterSpacing: '0.1em',
                        marginBottom: 20,
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
                        fontSize: 24,
                        fontWeight: '700',
                        color: 'white',
                        textShadow: '0 0 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        display: 'flex',
                      }}
                    >
                      💰 Split expenses together
                    </div>
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