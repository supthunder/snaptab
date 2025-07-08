# OpenAI Receipt Scanning Integration

This document details how the OpenAI Vision API is integrated into SnapTab for automated receipt scanning and data extraction.

## Overview

The integration uses OpenAI's GPT-4o vision model to analyze receipt images and extract structured data including merchant information, amounts, dates, and itemized details.

## Architecture Flow

```
User selects image → Frontend upload → API route → OpenAI Vision API → Structured data → Frontend display
```

## 1. Image Capture & Upload

### Frontend Implementation

The app uses native iPhone camera/photo picker integration:

```typescript
// Hidden file input with camera capture
<input 
  ref={fileInputRef} 
  type="file" 
  accept="image/*" 
  capture="environment"  // Triggers rear camera on mobile
  className="hidden" 
  onChange={handleFileUpload} 
/>
```

### Supported Image Formats
- **File Types**: PNG (.png), JPEG (.jpeg, .jpg), WEBP (.webp), GIF (.gif)
- **Size Limits**: Up to 50MB total payload per request
- **Requirements**: Clear, well-lit images without watermarks

## 2. API Route Processing

### File Processing (`/app/api/scan-receipt/route.ts`)

```typescript
export async function POST(request: NextRequest) {
  // 1. Extract file from FormData
  const formData = await request.formData()
  const file = formData.get('file') as File

  // 2. Convert to base64 for OpenAI API
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mimeType = file.type

  // 3. Create data URL for OpenAI
  const imageUrl = `data:${mimeType};base64,${base64}`
}
```

## 3. OpenAI API Call

### Model Configuration

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

### Vision API Request

```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",  // GPT-4 with vision capabilities
  messages: [
    {
      role: "user",
      content: [
        { 
          type: "text", 
          text: prompt  // Structured prompt for data extraction
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: "high"  // High resolution analysis
          },
        },
      ],
    },
  ],
  max_tokens: 1000,
})
```

### Image Detail Levels

- **`"low"`**: 512px x 512px, ~85 tokens, faster processing
- **`"high"`**: Full resolution analysis, more accurate but slower
- **`"auto"`**: Model decides based on image content

## 4. Structured Prompt Engineering

### Prompt Design

```typescript
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
```

### Key Prompt Elements

1. **Structured Format**: Requests specific JSON schema
2. **Data Types**: Specifies number vs string requirements
3. **Fallback Handling**: Instructions for missing data
4. **Output Format**: Requests clean JSON only

## 5. Response Processing

### Data Extraction

```typescript
const content = response.choices[0]?.message?.content

try {
  const receiptData = JSON.parse(content)
  return NextResponse.json(receiptData)
} catch (parseError) {
  // Handle parsing errors
  return NextResponse.json({ 
    error: 'Failed to parse receipt data',
    rawResponse: content 
  }, { status: 500 })
}
```

### Expected Response Structure

```json
{
  "merchantName": "Tokyo Ramen House",
  "total": 89.50,
  "currency": "USD",
  "transactionDate": "2024-01-15",
  "items": [
    {
      "name": "Tonkotsu Ramen",
      "price": 24.50,
      "quantity": 2
    },
    {
      "name": "Gyoza",
      "price": 12.00,
      "quantity": 1
    }
  ],
  "tax": 8.50,
  "tip": 12.00,
  "confidence": 0.85
}
```

## 6. Error Handling & Fallbacks

### Quota Management

```typescript
} catch (openaiError: any) {
  // Check for quota/rate limit errors
  if (openaiError.status === 429 || openaiError.message?.includes('quota')) {
    console.log('OpenAI quota exceeded, using mock response for testing')
    
    // Return mock response for development/testing
    return NextResponse.json({
      ...mockReceiptResponse,
      _note: "This is a mock response due to API quota limits."
    })
  }
  
  // Handle other API errors
  return NextResponse.json({ 
    error: 'OpenAI API error',
    details: openaiError.message || 'Unknown OpenAI error'
  }, { status: 500 })
}
```

### Mock Response System

For development and testing when API quotas are exceeded:

```typescript
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
    }
  ],
  tax: 8.50,
  tip: 12.00,
  confidence: 0.85
}
```

## 7. Frontend Integration

### Scanning Flow

```typescript
const handleScan = async (file: File) => {
  setIsScanning(true)
  setError(null)

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/scan-receipt', {
      method: 'POST',
      body: formData,
    })

    const receiptData = await response.json()
    setScannedData(receiptData)
  } catch (err) {
    setError(err.message)
  } finally {
    setIsScanning(false)
  }
}
```

### Data Flow to Add Expense

```typescript
const handleConfirm = () => {
  if (scannedData) {
    const params = new URLSearchParams({
      amount: scannedData.total.toString(),
      merchant: scannedData.merchantName,
      date: scannedData.transactionDate,
      currency: scannedData.currency,
    })
    window.location.href = `/add-expense?${params.toString()}`
  }
}
```

## 8. Cost Considerations

### Token Calculation

Images are converted to tokens based on dimensions:
- **GPT-4o**: Base cost 85 tokens + 170 tokens per 512px tile
- **Token cost**: Number of 32px x 32px patches needed to cover image
- **Maximum**: 1536 tokens per image (scaled down if larger)

### Example Costs

- **1024x1024 image**: ~1024 tokens
- **2048x1024 image**: ~1105 tokens  
- **Low detail mode**: Fixed 85 tokens regardless of size

## 9. Security & Environment

### API Key Management

```bash
# .env.local (git-ignored)
OPENAI_API_KEY=sk-proj-...your-key-here
```

### Server-Side Processing

- API key never exposed to client
- Image processing happens on server
- Secure environment variable handling

## 10. Performance Optimizations

### Image Preprocessing

- Automatic scaling for optimal token usage
- High detail mode for better accuracy
- Format validation before processing

### Caching Strategy

- No caching implemented (receipts are unique)
- Consider implementing for repeated scans
- Session storage for temporary data transfer

## 11. Testing & Development

### Mock Response Testing

When OpenAI quota is exceeded, the system automatically falls back to mock responses, allowing for:
- Frontend development without API costs
- UI/UX testing with realistic data
- Integration testing of the complete flow

### Debug Information

The API includes debug information in responses:
- Raw OpenAI response on parse errors
- Detailed error messages for troubleshooting
- Confidence scores for accuracy assessment

## 12. Future Enhancements

### Potential Improvements

1. **Multi-language Support**: Detect and handle non-English receipts
2. **Receipt Validation**: Cross-reference extracted data for accuracy
3. **Batch Processing**: Handle multiple receipts simultaneously
4. **OCR Fallback**: Use traditional OCR when vision API fails
5. **Learning System**: Improve accuracy based on user corrections

### Model Upgrades

- Monitor for new OpenAI vision models
- Consider specialized receipt processing models
- Implement A/B testing for different prompts 