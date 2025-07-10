import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenseId = params.id
    const body = await request.json()
    const { description, amount, currency, date, receiptImageUrl, splitWithUserIds } = body

    // Verify the expense exists and user has permission to edit it
    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        trip: {
          include: {
            members: true,
          },
        },
        splits: true,
      },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if user is member of the trip
    const isMember = existingExpense.trip.members.some(
      (member) => member.userId === session.user.id
    )

    if (!isMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete existing splits
    await prisma.expenseSplit.deleteMany({
      where: { expenseId },
    })

    // Calculate new split amount
    const splitAmount = parseFloat(amount) / splitWithUserIds.length

    // Update expense with new data
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        description,
        amount: parseFloat(amount),
        currency,
        date: date ? new Date(date) : undefined,
        receiptImageUrl,
        splits: {
          create: splitWithUserIds.map((userId: string) => ({
            userId,
            amountOwed: splitAmount,
          })),
        },
      },
      include: {
        paidBy: true,
        splits: true,
      },
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const expenseId = params.id

    // Verify the expense exists and user has permission to delete it
    const existingExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        trip: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Check if user is member of the trip or the one who paid
    const isMember = existingExpense.trip.members.some(
      (member) => member.userId === session.user.id
    )
    const isPayer = existingExpense.paidById === session.user.id

    if (!isMember && !isPayer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete expense (splits will be deleted automatically due to cascade)
    await prisma.expense.delete({
      where: { id: expenseId },
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}