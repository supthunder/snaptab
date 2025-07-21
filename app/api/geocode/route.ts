import { NextRequest, NextResponse } from 'next/server'

// POST /api/geocode - Get location suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')
    
    if (!text) {
      return NextResponse.json({ 
        error: 'Text parameter is required' 
      }, { status: 400 })
    }

    const apiKey = process.env.GEO
    if (!apiKey) {
      console.error('GEO API key not found in environment variables')
      return NextResponse.json({ 
        error: 'Geocoding service not configured' 
      }, { status: 500 })
    }

    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${apiKey}&limit=8&type=city`, 
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Geoapify API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform the response to a simpler format
    const suggestions = data.features?.map((feature: any) => ({
      id: feature.properties.place_id || feature.properties.osm_id,
      display_name: feature.properties.formatted || feature.properties.name,
      city: feature.properties.city,
      country: feature.properties.country,
      coordinates: {
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      }
    })) || []

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('Error in geocode API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch location suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 