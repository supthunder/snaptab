import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = searchParams.get('place_id')
    
    if (!placeId) {
      return NextResponse.json({ 
        error: 'place_id parameter is required' 
      }, { status: 400 })
    }

    const apiKey = process.env.GP
    if (!apiKey) {
      console.error('GP API key not found in environment variables')
      return NextResponse.json({ 
        error: 'Google Places API not configured' 
      }, { status: 500 })
    }

    // Google Places Details API call
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=name,formatted_address,geometry,photos,types,place_id`, 
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    const place = data.result
    
    // Transform the response
    const placeDetails = {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng
      },
      photos: place.photos?.map((photo: any) => ({
        photo_reference: photo.photo_reference,
        height: photo.height,
        width: photo.width,
        html_attributions: photo.html_attributions
      })) || [],
      types: place.types || []
    }

    return NextResponse.json({ 
      place: placeDetails,
      status: data.status 
    })

  } catch (error) {
    console.error('Error in places details API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch place details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 