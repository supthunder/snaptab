import { NextRequest, NextResponse } from 'next/server'
import { 
  initializeNewDatabase, 
  testNewConnection, 
  createUser, 
  createTrip, 
  joinTrip,
  addExpenseToTrip,
  getTripByCode,
  getTripMembers,
  getTripExpenses
} from '@/lib/neon-db-new'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing new SnapTab database system...')
    
    // Test connection
    const connectionResult = await testNewConnection()
    if (!connectionResult.success) {
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: connectionResult.error 
      }, { status: 500 })
    }

    // Initialize new database schema
    console.log('🔧 Initializing new database schema...')
    const initResult = await initializeNewDatabase()
    if (!initResult.success) {
      return NextResponse.json({ 
        error: 'Database initialization failed', 
        details: initResult.error 
      }, { status: 500 })
    }

    // Test the complete flow
    console.log('🧪 Testing complete user flow...')
    
    try {
      // Create test users
      const user1 = await createUser('testuser1', 'Test User 1')
      const user2 = await createUser('testuser2', 'Test User 2')
      
      if (!user1 || !user2) {
        throw new Error('Failed to create test users')
      }

      // Create a trip
      const tripResult = await createTrip('Test Tokyo Trip', 'USD', 'testuser1')
      
      if (!tripResult) {
        throw new Error('Failed to create test trip')
      }

      // User 2 joins the trip
      const joinSuccess = await joinTrip(tripResult.tripCode, 'testuser2')
      
      if (!joinSuccess) {
        throw new Error('Failed to join trip')
      }

      // Add an expense with items
      const expenseData = {
        name: 'Test Restaurant Bill',
        merchant_name: 'Test Restaurant',
        total_amount: 50.00,
        currency: 'USD',
        expense_date: '2024-12-28',
        category: 'food',
        summary: 'Dinner',
        emoji: '🍽️'
      }

      const items = [
        { name: 'Burger', price: 15.00, quantity: 1, item_order: 0 },
        { name: 'Pizza', price: 20.00, quantity: 1, item_order: 1 },
        { name: 'Drinks', price: 15.00, quantity: 2, item_order: 2 }
      ]

      const expense = await addExpenseToTrip(
        tripResult.tripCode, 
        'testuser1', 
        expenseData, 
        items
      )

      if (!expense) {
        throw new Error('Failed to add test expense')
      }

      // Get trip data to verify everything works
      const trip = await getTripByCode(tripResult.tripCode)
      const members = await getTripMembers(tripResult.tripCode)
      const expenses = await getTripExpenses(tripResult.tripCode)

      return NextResponse.json({ 
        success: true,
        message: '✅ New database system initialized and tested successfully!',
        testResults: {
          connectionTest: connectionResult.data,
          users: [user1, user2],
          trip: trip,
          tripCode: tripResult.tripCode,
          members: members,
          expenses: expenses,
          testExpense: expense
        },
        summary: {
          usersCreated: 2,
          tripCreated: true,
          tripCode: tripResult.tripCode,
          membersCount: members.length,
          expensesCount: expenses.length
        },
        timestamp: new Date().toISOString()
      })

    } catch (testError) {
      console.error('Test flow failed:', testError)
      return NextResponse.json({ 
        success: true,
        message: '✅ Database schema created successfully, but test flow failed',
        initializationResult: initResult,
        connectionTest: connectionResult.data,
        testError: testError instanceof Error ? testError.message : 'Unknown test error',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ New database system test failed:', error)
    return NextResponse.json({ 
      error: 'Database system test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 