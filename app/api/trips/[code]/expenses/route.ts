import { NextRequest, NextResponse } from 'next/server'
import { addExpenseToTrip, getExpensesForTrip } from '@/lib/neon-db-new'

// GET /api/trips/[code]/expenses - Get all expenses for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const tripCode = parseInt(code)
    
    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code. Must be 3 digits (100-999)' 
      }, { status: 400 })
    }

    const expenses = await getExpensesForTrip(tripCode)
    
    return NextResponse.json({ expenses })

  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch expenses',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/trips/[code]/expenses - Add expense to trip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const tripCode = parseInt(code)
    const body = await request.json()
    
    const { 
      name, 
      description,
      merchant_name, 
      total_amount, 
      currency, 
      receipt_image_url,
      expense_date, 
      paid_by_username,
      split_with_usernames,
      split_mode = 'even',
      category, 
      summary, 
      emoji,
      tax_amount,
      tip_amount,
      confidence,
      items = [] 
    } = body

    if (!name || !total_amount || !currency || !expense_date || !paid_by_username) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, total_amount, currency, expense_date, paid_by_username' 
      }, { status: 400 })
    }

    if (isNaN(tripCode) || tripCode < 100 || tripCode > 999) {
      return NextResponse.json({ 
        error: 'Invalid trip code' 
      }, { status: 400 })
    }

    const expenseData = {
      name,
      description,
      merchant_name,
      total_amount: parseFloat(total_amount),
      currency,
      receipt_image_url,
      expense_date,
      split_with: [], // Will be populated by the function
      split_mode: split_mode as 'even' | 'items',
      category,
      summary,
      emoji,
      tax_amount: tax_amount ? parseFloat(tax_amount) : undefined,
      tip_amount: tip_amount ? parseFloat(tip_amount) : undefined,
      confidence: confidence ? parseFloat(confidence) : undefined
    }

    const expense = await addExpenseToTrip(
      tripCode, 
      paid_by_username, 
      expenseData, 
      items,
      split_with_usernames
    )

    if (!expense) {
      return NextResponse.json({ 
        error: 'Failed to create expense. User may not be a member of this trip.' 
      }, { status: 500 })
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