import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { tripCode, placeId, placeName } = await request.json()
    
    if (!tripCode) {
      return NextResponse.json({ 
        error: 'tripCode is required' 
      }, { status: 400 })
    }

    const apiKey = process.env.GP
    if (!apiKey) {
      console.error('GP API key not found in environment variables')
      return NextResponse.json({ 
        error: 'Google Places API not configured' 
      }, { status: 500 })
    }

    let photoUrl = null

    // If we have a place ID, try to get a photo
    if (placeId) {
      try {
        // First get place details to get photo reference
        const detailsResponse = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=photos`
        )

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()
          
          if (detailsData.status === 'OK' && detailsData.result?.photos?.length > 0) {
            const photoReference = detailsData.result.photos[0].photo_reference
            
            // Generate Google Places Photo URL
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&maxheight=600&photo_reference=${photoReference}&key=${apiKey}`
          }
        }
      } catch (photoError) {
        console.error('Error fetching place photo:', photoError)
        // Continue without photo
      }
    }

    // Return trip card data
    const tripCard = {
      tripCode,
      placeName: placeName || null,
      backgroundImageUrl: photoUrl,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(tripCard)

  } catch (error) {
    console.error('Error creating trip card:', error)
    return NextResponse.json({ 
      error: 'Failed to create trip card',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 