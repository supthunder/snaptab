import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { put } from '@vercel/blob'

// Mock response for testing when API quota is exceeded
const mockReceiptResponse = {
  merchantName: "Tokyo Ramen House",
  total: 89.50,
  currency: "USD",
  transactionDate: "2024-01-15",
  category: "food",
  summary: "Ramen",
  emoji: "🍜",
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
  
  // Remove markdown comments like **additional text**
  cleanContent = cleanContent.replace(/\*\*[^*]+\*\*/g, '')
  
  // Remove any text before the first { or after the last }
  const firstBrace = cleanContent.indexOf('{')
  const lastBrace = cleanContent.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleanContent = cleanContent.substring(firstBrace, lastBrace + 1)
  }
  
  // Remove trailing commas before closing braces/brackets
  cleanContent = cleanContent.replace(/,(\s*[}\]])/g, '$1')
  
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('File must be an image')
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (10MB limit for receipts)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File size too large')
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Store receipt image in Vercel Blob
    console.log('Storing receipt image in blob storage...')
    let receiptImageUrl: string | null = null
    
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `receipts/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
      })
      
      receiptImageUrl = blob.url
      console.log('Receipt image stored successfully:', receiptImageUrl)
    } catch (blobError) {
      console.error('Failed to store receipt image:', blobError)
      // Continue processing even if blob storage fails
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('No OpenAI API key found, using mock response')
      return NextResponse.json({
        ...mockReceiptResponse,
        receiptImageUrl,
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
        receiptImageUrl,
        _note: "This is a mock response because OpenAI client initialization failed."
      })
    }

    // Convert file to base64
    console.log('Converting file to base64...')
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type

    console.log('File converted, calling OpenAI API...')

    // Create the prompt for receipt analysis with travel categories
    const prompt = `
      You are analyzing a receipt image for a travel expense tracking app. Extract the following information in JSON format:
      
      {
        "merchantName": "Name of the business/restaurant",
        "total": "Total amount as a number (no currency symbol)",
        "currency": "Currency code (USD, EUR, etc.)",
        "transactionDate": "Date in YYYY-MM-DD format",
        "category": "Category from the travel expense options below",
        "summary": "1-2 word summary of the expense (e.g. 'Tacos', 'Hotel', 'Flight', 'Coffee')",
        "emoji": "Single emoji that best represents this expense",
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
      
      CRITICAL ITEM SPLITTING RULE:
      - If a receipt shows "qty 6 lemonade $60", create 6 separate items each with "lemonade" at $10 each
      - If a receipt shows "3x Coffee $15", create 3 separate items each with "Coffee" at $5 each
      - ALWAYS split items by their quantity into individual entries rather than grouping them
      - Each item should have quantity: 1 and the individual item price
      - This allows for better expense splitting between people
      - Example: "2 Burgers $20" should become 2 items: [{"name": "Burger", "price": 10, "quantity": 1}, {"name": "Burger", "price": 10, "quantity": 1}]
      
      TRAVEL EXPENSE CATEGORIES (choose the most appropriate one):
      - "food" - Restaurants, cafes, food delivery, groceries, snacks
      - "lodging" - Hotels, Airbnb, hostels, vacation rentals  
      - "transportation" - Flights, trains, buses, taxis, rideshare, car rentals, gas
      - "entertainment" - Movies, concerts, shows, attractions, tours, nightlife
      - "shopping" - Clothing, souvenirs, gifts, retail purchases
      - "health" - Pharmacy, medical expenses, wellness, spa
      - "communication" - Phone bills, internet, SIM cards
      - "business" - Office supplies, coworking, business services
      - "miscellaneous" - Other expenses that don't fit above categories
      
      SUMMARY GUIDELINES:
      - Keep to 1-2 words maximum
      - Be specific and descriptive (e.g. "Burrito" not "Food", "Uber" not "Transport")
      - Use the most recognizable part of the merchant or main item
      - Examples: "Starbucks" → "Coffee", "McDonald's" → "Burgers", "Marriott" → "Hotel"
      - SPECIAL RULE: If merchant is "Airbnb" or "airbnb", always use "Airbnb" as the summary (not "Hotel")
      
      EMOJI SELECTION (for database storage):
      - For specific food types: 🍜 (ramen), 🍕 (pizza), 🍣 (sushi), 🍔 (burger), ☕ (coffee), 🍺 (bar/alcohol)
      - For generic food: 🍽️ or 🥘
      - For lodging: 🏨 (hotel), 🏠 (Airbnb - always use house emoji), 🏕️ (camping)
      - For transportation: ✈️ (flight), 🚗 (car/taxi), 🚌 (bus), 🚂 (train), ⛽ (gas)
      - For entertainment: 🎬 (movies), 🎫 (shows/attractions), 🎵 (music), 🎪 (tours)
      - For shopping: 🛒 (general shopping), 👕 (clothing), 🎁 (gifts), 💄 (beauty)
      - For health: 💊 (pharmacy), 🏥 (medical), 💆 (spa/wellness)
      - For communication: 📱 (phone), 📶 (internet/data)
      - For business: 💼 (business), 🖥️ (coworking), 📋 (services)
      - For miscellaneous: 💰 (general expense)
      
      Analyze the merchant name, items, and context to determine the most accurate category, summary, and emoji.
      Focus on creating a concise, recognizable summary that fits in limited UI space.
      
      Please be as accurate as possible. If any information is unclear or missing, use null for that field.
      
      IMPORTANT OUTPUT REQUIREMENTS:
      - Return ONLY valid JSON - no additional text, comments, or explanations
      - Do NOT include markdown code blocks or formatting
      - Do NOT include any comments or notes in the response
      - Do NOT add trailing commas in the JSON
      - Make sure all strings are properly quoted
      - The response must be parseable by JSON.parse()
      
      Return ONLY the JSON object, nothing else.
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
        
        // Add receipt image URL to response
        const responseData = {
          ...receiptData,
          receiptImageUrl
        }
        
        return NextResponse.json(responseData)
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
            
            // Add receipt image URL to extracted response
            const responseData = {
              ...extractedJson,
              receiptImageUrl
            }
            
            return NextResponse.json(responseData)
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
          receiptImageUrl,
          _note: "This is a mock response due to OpenAI API timeout. The request took too long."
        })
      }
      
      // Check if it's a quota/rate limit error
      if (openaiError.status === 429 || openaiError.message?.includes('quota')) {
        console.log('OpenAI quota exceeded, using mock response for testing')
        
        // Return mock response for testing
        return NextResponse.json({
          ...mockReceiptResponse,
          receiptImageUrl,
          _note: "This is a mock response due to API quota limits. In production, this would be real AI-extracted data."
        })
      }
      
      // For other OpenAI errors, return mock response
      console.log('OpenAI API error, using mock response')
      return NextResponse.json({
        ...mockReceiptResponse,
        receiptImageUrl,
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