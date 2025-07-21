import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const input = searchParams.get('input')
    
    if (!input) {
      return NextResponse.json({ 
        error: 'Input parameter is required' 
      }, { status: 400 })
    }

    const apiKey = process.env.GP
    if (!apiKey) {
      console.error('GP API key not found in environment variables')
      return NextResponse.json({ 
        error: 'Google Places API not configured' 
      }, { status: 500 })
    }

    // Google Places Autocomplete API call
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}&types=(cities)&language=en`, 
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
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    // Transform the response to a simpler format
    const suggestions = data.predictions?.map((prediction: any) => ({
      place_id: prediction.place_id,
      description: prediction.description,
      main_text: prediction.structured_formatting?.main_text || prediction.description,
      secondary_text: prediction.structured_formatting?.secondary_text || '',
      types: prediction.types || []
    })) || []

    return NextResponse.json({ 
      suggestions,
      status: data.status 
    })

  } catch (error) {
    console.error('Error in places autocomplete API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch place suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 