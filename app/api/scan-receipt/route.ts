import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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

// Helper function to clean and parse JSON response
function parseOpenAIResponse(content: string) {
  // Remove markdown code blocks if present
  let cleanContent = content.trim()
  
  // Remove ```json and ``` if present
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '')
  }
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '')
  }
  if (cleanContent.endsWith('```')) {
    cleanContent = cleanContent.replace(/\s*```$/, '')
  }
  
  // Parse the cleaned JSON
  return JSON.parse(cleanContent.trim())
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Scan receipt API is working',
    method: 'GET',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('API called, checking environment...')
    
    console.log('Processing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('File received:', file.name, file.type, file.size)

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('No OpenAI API key found, using mock response')
      return NextResponse.json({
        ...mockReceiptResponse,
        _note: "This is a mock response because OpenAI API key is not configured."
      })
    }

    console.log('OpenAI API key found, initializing client...')
    
    let openai: OpenAI
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      console.log('OpenAI client initialized successfully')
    } catch (initError) {
      console.error('Failed to initialize OpenAI client:', initError)
      return NextResponse.json({
        ...mockReceiptResponse,
        _note: "This is a mock response because OpenAI client initialization failed."
      })
    }

    // Convert file to base64
    console.log('Converting file to base64...')
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    console.log('File converted, calling OpenAI API...')

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
      Return ONLY the JSON object, no additional text, no markdown formatting, no code blocks.
    `

    try {
      // Call OpenAI API with the image with timeout
      console.log('Calling OpenAI API with timeout...')
      
      const apiCallPromise = openai.chat.completions.create({
        model: "gpt-4.1-nano",
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

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI API timeout')), 30000) // 30 second timeout
      })

      const response = await Promise.race([apiCallPromise, timeoutPromise]) as any

      console.log('OpenAI API response received')
      const content = response.choices[0]?.message?.content

      if (!content) {
        console.error('No content in OpenAI response')
        return NextResponse.json({
          ...mockReceiptResponse,
          _note: "This is a mock response because OpenAI returned no content."
        })
      }

      console.log('OpenAI response content:', content)

      // Parse the JSON response with improved error handling
      try {
        const receiptData = parseOpenAIResponse(content)
        console.log('Successfully parsed receipt data:', receiptData)
        return NextResponse.json(receiptData)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content)
        console.error('Parse error:', parseError)
        
        // Try to extract JSON from the response even if it's malformed
        try {
          // Look for JSON-like content between braces
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = parseOpenAIResponse(jsonMatch[0])
            console.log('Successfully extracted JSON from response:', extractedJson)
            return NextResponse.json(extractedJson)
          }
        } catch (secondParseError) {
          console.error('Second parse attempt failed:', secondParseError)
          // If all parsing fails, return the raw response for debugging
          return NextResponse.json({ 
            error: 'Failed to parse receipt data',
            rawResponse: content,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          }, { status: 500 })
        }
      }

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError)
      
      // Check if it's a timeout error
      if (openaiError.message?.includes('timeout')) {
        console.log('OpenAI API timeout, using mock response')
        return NextResponse.json({
          ...mockReceiptResponse,
          _note: "This is a mock response due to OpenAI API timeout. The request took too long."
        })
      }
      
      // Check if it's a quota/rate limit error
      if (openaiError.status === 429 || openaiError.message?.includes('quota')) {
        console.log('OpenAI quota exceeded, using mock response for testing')
        
        // Return mock response for testing
        return NextResponse.json({
          ...mockReceiptResponse,
          _note: "This is a mock response due to API quota limits. In production, this would be real AI-extracted data."
        })
      }
      
      // For other OpenAI errors, return mock response
      console.log('OpenAI API error, using mock response')
      return NextResponse.json({
        ...mockReceiptResponse,
        _note: `This is a mock response due to OpenAI API error: ${openaiError.message || 'Unknown error'}`
      })
    }

  } catch (error) {
    console.error('Error processing receipt:', error)
    return NextResponse.json({ 
      error: 'Failed to process receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 