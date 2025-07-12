import { NextRequest, NextResponse } from 'next/server'
import { addExpenseToTrip, getTripExpenses } from '@/lib/neon-db-new'

// GET /api/trips/[code]/expenses - Get all expenses for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const tripCode = parseInt(params.code)
    
    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code. Must be 3 digits (100-999)' 
      }, { status: 400 })
    }

    const expenses = await getTripExpenses(tripCode)
    
    return NextResponse.json({ expenses })

  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch expenses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/trips/[code]/expenses - Add new expense to trip
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const body = await request.json()
    const tripCode = parseInt(params.code)
    
    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code. Must be 3 digits (100-999)' 
      }, { status: 400 })
    }

    const { 
      name, 
      merchantName, 
      totalAmount, 
      currency, 
      receiptImageUrl, 
      expenseDate, 
      paidByUsername, 
      category, 
      summary, 
      emoji,
      items 
    } = body

    if (!name || !totalAmount || !currency || !paidByUsername || !expenseDate) {
      return NextResponse.json({ 
        error: 'Required fields: name, totalAmount, currency, paidByUsername, expenseDate' 
      }, { status: 400 })
    }

    const expenseData = {
      name,
      merchant_name: merchantName,
      total_amount: parseFloat(totalAmount),
      currency,
      receipt_image_url: receiptImageUrl,
      expense_date: expenseDate,
      category,
      summary,
      emoji
    }

    const processedItems = (items || []).map((item: any, index: number) => ({
      name: item.name,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity) || 1,
      item_order: index
    }))

    const expense = await addExpenseToTrip(
      tripCode, 
      paidByUsername, 
      expenseData, 
      processedItems
    )
    
    if (!expense) {
      return NextResponse.json({ 
        error: 'Failed to add expense. Check if user exists and is member of trip.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      expense,
      message: 'Expense added successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding expense:', error)
    return NextResponse.json({ 
      error: 'Failed to add expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 