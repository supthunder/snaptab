import { NextRequest, NextResponse } from 'next/server'
import { getExpenseWithItems, deleteExpense, updateExpense, updateExpensePaymentStatus } from '@/lib/neon-db-new'

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

// PUT /api/expenses/[id] - Update expense by ID
export async function PUT(
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

    const body = await request.json()
    const {
      name,
      description,
      merchant_name,
      total_amount,
      currency,
      expense_date,
      paid_by_username,
      split_mode,
      category,
      summary,
      emoji,
      tax_amount,
      tip_amount,
      confidence,
      item_assignments
    } = body

    // Prepare update data (only include defined values)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (merchant_name !== undefined) updateData.merchant_name = merchant_name
    if (total_amount !== undefined) updateData.total_amount = parseFloat(total_amount)
    if (currency !== undefined) updateData.currency = currency
    if (expense_date !== undefined) updateData.expense_date = expense_date
    if (paid_by_username !== undefined) updateData.paid_by_username = paid_by_username
    if (split_mode !== undefined) updateData.split_mode = split_mode
    if (category !== undefined) updateData.category = category
    if (summary !== undefined) updateData.summary = summary
    if (emoji !== undefined) updateData.emoji = emoji
    if (tax_amount !== undefined) updateData.tax_amount = parseFloat(tax_amount)
    if (tip_amount !== undefined) updateData.tip_amount = parseFloat(tip_amount)
    if (confidence !== undefined) updateData.confidence = parseFloat(confidence)

    const success = await updateExpense(id, updateData, item_assignments)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to update expense' 
      }, { status: 500 })
    }

    // Get updated expense to return
    const updatedExpense = await getExpenseWithItems(id)
    
    return NextResponse.json({ 
      success: true,
      message: 'Expense updated successfully',
      expense: updatedExpense
    })

  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ 
      error: 'Failed to update expense',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH /api/expenses/[id] - Update expense payment status
export async function PATCH(
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

    const body = await request.json()
    const { isPaid, markedByUsername } = body

    if (typeof isPaid !== 'boolean' || !markedByUsername) {
      return NextResponse.json({ 
        error: 'isPaid (boolean) and markedByUsername (string) are required' 
      }, { status: 400 })
    }

    const success = await updateExpensePaymentStatus(id, isPaid, markedByUsername)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to update payment status' 
      }, { status: 500 })
    }

    // Get updated expense to return
    const updatedExpense = await getExpenseWithItems(id)
    
    return NextResponse.json({ 
      success: true,
      message: `Expense marked as ${isPaid ? 'paid' : 'unpaid'}`,
      expense: updatedExpense
    })

  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json({ 
      error: 'Failed to update payment status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 