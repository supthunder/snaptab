import { NextRequest, NextResponse } from 'next/server'
import { assignItemToUser, unassignItemFromUser, getExpenseWithItems } from '@/lib/neon-db-new'

// POST /api/expenses/[id]/items/assign - Assign item to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { expenseItemId, username } = body
    
    if (!expenseItemId || !username) {
      return NextResponse.json({ 
        error: 'expenseItemId and username are required' 
      }, { status: 400 })
    }

    const success = await assignItemToUser(expenseItemId, username)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to assign item. User may not exist.' 
      }, { status: 400 })
    }

    // Get updated expense with items
    const { id } = await params
    const expense = await getExpenseWithItems(id)

    return NextResponse.json({ 
      message: 'Item assigned successfully',
      expense
    })

  } catch (error) {
    console.error('Error assigning item:', error)
    return NextResponse.json({ 
      error: 'Failed to assign item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/expenses/[id]/items/assign - Unassign item from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { expenseItemId, username } = body
    
    if (!expenseItemId || !username) {
      return NextResponse.json({ 
        error: 'expenseItemId and username are required' 
      }, { status: 400 })
    }

    const success = await unassignItemFromUser(expenseItemId, username)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to unassign item. User may not exist.' 
      }, { status: 400 })
    }

    // Get updated expense with items
    const { id } = await params
    const expense = await getExpenseWithItems(id)

    return NextResponse.json({ 
      message: 'Item unassigned successfully',
      expense
    })

  } catch (error) {
    console.error('Error unassigning item:', error)
    return NextResponse.json({ 
      error: 'Failed to unassign item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 