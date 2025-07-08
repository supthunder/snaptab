import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Mock response for testing when API quota is exceeded
const mockReceiptResponse = {
  merchantName: "Tokyo Ramen House",
  total: 89.50,
  currency: "USD",
  transactionDate: "2024-01-15",
  items: [
    {
      name: "Tonkotsu Ramen",
      price: 24.50,
      quantity: 2
    },
    {
      name: "Gyoza",
      price: 12.00,
      quantity: 1
    },
    {
      name: "Green Tea",
      price: 8.50,
      quantity: 4
    }
  ],
  tax: 8.50,
  tip: 12.00,
  confidence: 0.85
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    // Create the prompt for receipt analysis
    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      
      {
        "merchantName": "Name of the business/restaurant",
        "total": "Total amount as a number (no currency symbol)",
        "currency": "Currency code (USD, EUR, etc.)",
        "transactionDate": "Date in YYYY-MM-DD format",
        "items": [
          {
            "name": "Item name",
            "price": "Item price as number",
            "quantity": "Quantity if available"
          }
        ],
        "tax": "Tax amount as number if available",
        "tip": "Tip amount as number if available",
        "confidence": "Confidence level from 0.0 to 1.0"
      }
      
      Please be as accurate as possible. If any information is unclear or missing, use null for that field.
      Only return the JSON object, no additional text.
    `

    try {
      // Call OpenAI API with the image
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high"
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      })

      const content = response.choices[0]?.message?.content

      if (!content) {
        return NextResponse.json({ error: 'No response from OpenAI' }, { status: 500 })
      }

      // Parse the JSON response
      try {
        const receiptData = JSON.parse(content)
        return NextResponse.json(receiptData)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content)
        return NextResponse.json({ 
          error: 'Failed to parse receipt data',
          rawResponse: content 
        }, { status: 500 })
      }

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      // Check if it's a quota/rate limit error
      if (openaiError.status === 429 || openaiError.message?.includes('quota')) {
        console.log('OpenAI quota exceeded, using mock response for testing')
        
        // Return mock response for testing
        return NextResponse.json({
          ...mockReceiptResponse,
          _note: "This is a mock response due to API quota limits. In production, this would be real AI-extracted data."
        })
      }
      
      // For other OpenAI errors, return the actual error
      return NextResponse.json({ 
        error: 'OpenAI API error',
        details: openaiError.message || 'Unknown OpenAI error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error processing receipt:', error)
    return NextResponse.json({ 
      error: 'Failed to process receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 