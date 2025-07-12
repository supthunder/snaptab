import { NextRequest, NextResponse } from 'next/server'
import { getExpenseWithItems } from '@/lib/neon-db-new'

// GET /api/expenses/[id] - Get expense details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Expense ID is required' 
      }, { status: 400 })
    }

    const expense = await getExpenseWithItems(id)
    
    if (!expense) {
      return NextResponse.json({ 
        error: 'Expense not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ expense })

  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 