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
                      ? `linear-gradient(rgba(30, 27, 75, 0.6), rgba(30, 27, 75, 0.6)), url(${backgroundImageUrl})`
                      : 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textAlign: 'center',
                  }}
                >
                  {placeName ? (
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: '600',
                        marginBottom: 32,
                        color: 'rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                      }}
                    >
                      {placeName}
                    </div>
                  ) : null}

                  <div
                    style={{
                      fontSize: 120,
                      fontWeight: 'bold',
                      letterSpacing: '0.1em',
                      marginBottom: 20,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                      display: 'flex',
                    }}
                  >
                    {tripCode}
                  </div>

                  <div
                    style={{
                      width: 140,
                      height: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: 2,
                      display: 'flex',
                    }}
                  />
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