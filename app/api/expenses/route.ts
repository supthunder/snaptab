import { NextRequest, NextResponse } from 'next/server'
import { createExpense, getTripExpenses } from '@/lib/data-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const tripId = url.searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    const expenses = await getTripExpenses(tripId)
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      description, 
      amount, 
      currency, 
      date, 
      tripId, 
      receiptImageUrl, 
      splitWithUserIds 
    } = body

    if (!description || !amount || !currency || !tripId || !splitWithUserIds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const expense = await createExpense({
      description,
      amount: parseFloat(amount),
      currency,
      date: date ? new Date(date) : new Date(),
      tripId,
      receiptImageUrl,
      splitWithUserIds,
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}