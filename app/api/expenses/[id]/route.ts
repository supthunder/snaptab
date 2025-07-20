import { NextRequest, NextResponse } from 'next/server'
import { getExpenseWithItems, deleteExpense } from '@/lib/neon-db-new'

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

// DELETE /api/expenses/[id] - Delete expense by ID
export async function DELETE(
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

    const success = await deleteExpense(id)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Expense not found or failed to delete' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Expense deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ 
      error: 'Failed to delete expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 