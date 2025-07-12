import { sql } from '@vercel/postgres'
import { Expense, Trip, ReceiptItem, ItemAssignment } from './data'

// Database initialization - create tables if they don't exist
export async function initializeDatabase() {
  try {
    // Create trips table
    await sql`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        members TEXT[] NOT NULL,
        total_expenses DECIMAL(10,2) DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        start_date DATE,
        end_date DATE,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create expenses table
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        paid_by TEXT NOT NULL,
        split_with TEXT[] NOT NULL,
        category TEXT,
        summary TEXT,
        emoji TEXT,
        items JSONB,
        item_assignments JSONB,
        split_mode TEXT CHECK (split_mode IN ('even', 'items')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_trips_is_active ON trips(is_active)`
    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`
    await sql`CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at)`

    console.log('✅ Database initialized successfully!')
    return { success: true }
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return { success: false, error }
  }
}

// Test database connection
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`
    console.log('✅ Database connection successful:', result.rows[0])
    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return { success: false, error }
  }
}

// Convert database row to Trip interface
function dbRowToTrip(row: any): Trip {
  return {
    id: row.id,
    name: row.name,
    members: typeof row.members === 'string' ? JSON.parse(row.members) : row.members,
    totalExpenses: parseFloat(row.total_expenses),
    currency: row.currency,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    createdAt: row.created_at,
    expenses: [] // Will be loaded separately
  }
}

// Convert database row to Expense interface
function dbRowToExpense(row: any): Expense {
  return {
    id: row.id,
    tripId: row.trip_id,
    description: row.description,
    amount: parseFloat(row.amount),
    date: row.date,
    paidBy: row.paid_by,
    splitWith: typeof row.split_with === 'string' ? JSON.parse(row.split_with) : row.split_with,
    category: row.category,
    summary: row.summary,
    emoji: row.emoji,
    items: row.items,
    itemAssignments: row.item_assignments,
    splitMode: row.split_mode,
    createdAt: row.created_at
  }
}

// Get all trips
export async function getTripsFromDB(): Promise<Trip[]> {
  try {
    const result = await sql`
      SELECT * FROM trips 
      ORDER BY created_at DESC
    `
    return result.rows.map(dbRowToTrip)
  } catch (error) {
    console.error('Error fetching trips:', error)
    return []
  }
}

// Get active trip
export async function getActiveTripFromDB(): Promise<Trip | null> {
  try {
    const result = await sql`
      SELECT * FROM trips 
      WHERE is_active = true 
      LIMIT 1
    `
    return result.rows.length > 0 ? dbRowToTrip(result.rows[0]) : null
  } catch (error) {
    console.error('Error fetching active trip:', error)
    return null
  }
}

// Create new trip
export async function createTripInDB(tripData: Omit<Trip, 'id' | 'createdAt' | 'expenses'>): Promise<Trip | null> {
  try {
    const result = await sql`
      INSERT INTO trips (name, members, total_expenses, currency, start_date, end_date, is_active)
      VALUES (${tripData.name}, ${JSON.stringify(tripData.members)}, ${tripData.totalExpenses}, ${tripData.currency}, ${tripData.startDate}, ${tripData.endDate}, ${tripData.isActive})
      RETURNING *
    `
    return result.rows.length > 0 ? dbRowToTrip(result.rows[0]) : null
  } catch (error) {
    console.error('Error creating trip:', error)
    return null
  }
}

// Get expenses for a trip
export async function getTripExpensesFromDB(tripId: string): Promise<Expense[]> {
  try {
    const result = await sql`
      SELECT * FROM expenses 
      WHERE trip_id = ${tripId} 
      ORDER BY created_at DESC
    `
    return result.rows.map(dbRowToExpense)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return []
  }
}

// Add expense to trip
export async function addExpenseToTripInDB(tripId: string, expenseData: Omit<Expense, 'id' | 'createdAt' | 'tripId'>): Promise<Expense | null> {
  try {
    const result = await sql`
      INSERT INTO expenses (trip_id, description, amount, date, paid_by, split_with, category, summary, emoji, items, item_assignments, split_mode)
      VALUES (${tripId}, ${expenseData.description}, ${expenseData.amount}, ${expenseData.date}, ${expenseData.paidBy}, ${JSON.stringify(expenseData.splitWith)}, ${expenseData.category}, ${expenseData.summary}, ${expenseData.emoji}, ${JSON.stringify(expenseData.items)}, ${JSON.stringify(expenseData.itemAssignments)}, ${expenseData.splitMode})
      RETURNING *
    `
    
    if (result.rows.length > 0) {
      // Update trip total
      await updateTripTotalInDB(tripId)
      return dbRowToExpense(result.rows[0])
    }
    return null
  } catch (error) {
    console.error('Error adding expense:', error)
    return null
  }
}

// Update trip total expenses
export async function updateTripTotalInDB(tripId: string): Promise<void> {
  try {
    const result = await sql`
      SELECT SUM(amount) as total FROM expenses WHERE trip_id = ${tripId}
    `
    const total = result.rows[0]?.total || 0

    await sql`
      UPDATE trips 
      SET total_expenses = ${total}, updated_at = NOW() 
      WHERE id = ${tripId}
    `
  } catch (error) {
    console.error('Error updating trip total:', error)
  }
}

// Get recent expenses
export async function getRecentExpensesFromDB(tripId?: string, limit: number = 5): Promise<Expense[]> {
  try {
    let result
    if (tripId) {
      result = await sql`
        SELECT * FROM expenses 
        WHERE trip_id = ${tripId} 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `
    } else {
      result = await sql`
        SELECT * FROM expenses 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `
    }
    return result.rows.map(dbRowToExpense)
  } catch (error) {
    console.error('Error fetching recent expenses:', error)
    return []
  }
}

// Get expense by ID
export async function getExpenseByIdFromDB(id: string): Promise<Expense | null> {
  try {
    const result = await sql`
      SELECT * FROM expenses 
      WHERE id = ${id} 
      LIMIT 1
    `
    return result.rows.length > 0 ? dbRowToExpense(result.rows[0]) : null
  } catch (error) {
    console.error('Error fetching expense:', error)
    return null
  }
}

// Update expense
export async function updateExpenseInDB(id: string, expenseData: Partial<Expense>): Promise<Expense | null> {
  try {
    const result = await sql`
      UPDATE expenses 
      SET 
        description = COALESCE(${expenseData.description}, description),
        amount = COALESCE(${expenseData.amount}, amount),
        date = COALESCE(${expenseData.date}, date),
        paid_by = COALESCE(${expenseData.paidBy}, paid_by),
        split_with = COALESCE(${expenseData.splitWith ? JSON.stringify(expenseData.splitWith) : null}, split_with),
        category = COALESCE(${expenseData.category}, category),
        summary = COALESCE(${expenseData.summary}, summary),
        emoji = COALESCE(${expenseData.emoji}, emoji),
        items = COALESCE(${JSON.stringify(expenseData.items)}, items),
        item_assignments = COALESCE(${JSON.stringify(expenseData.itemAssignments)}, item_assignments),
        split_mode = COALESCE(${expenseData.splitMode}, split_mode),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    
    if (result.rows.length > 0) {
      // Update trip total
      await updateTripTotalInDB(result.rows[0].trip_id)
      return dbRowToExpense(result.rows[0])
    }
    return null
  } catch (error) {
    console.error('Error updating expense:', error)
    return null
  }
}

// Delete expense
export async function deleteExpenseFromDB(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM expenses 
      WHERE id = ${id}
      RETURNING trip_id
    `
    
    if (result.rows.length > 0) {
      // Update trip total
      await updateTripTotalInDB(result.rows[0].trip_id)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting expense:', error)
    return false
  }
}

// Migration function - move localStorage data to Neon
export async function migrateLocalStorageToNeon(): Promise<void> {
  if (typeof window === 'undefined') return

  const stored = localStorage.getItem('snaptab-trips')
  if (!stored) return

  try {
    const trips: Trip[] = JSON.parse(stored)
    
    for (const trip of trips) {
      // Create trip in Neon
      const result = await sql`
        INSERT INTO trips (name, members, total_expenses, currency, start_date, end_date, is_active)
        VALUES (${trip.name}, ${JSON.stringify(trip.members)}, ${trip.totalExpenses}, ${trip.currency}, ${trip.startDate}, ${trip.endDate}, ${trip.isActive})
        RETURNING id
      `

      const tripId = result.rows[0]?.id
      if (!tripId) continue

      // Create expenses for this trip
      for (const expense of trip.expenses) {
        await sql`
          INSERT INTO expenses (trip_id, description, amount, date, paid_by, split_with, category, summary, emoji, items, item_assignments, split_mode)
          VALUES (${tripId}, ${expense.description}, ${expense.amount}, ${expense.date}, ${expense.paidBy}, ${JSON.stringify(expense.splitWith)}, ${expense.category}, ${expense.summary}, ${expense.emoji}, ${JSON.stringify(expense.items)}, ${JSON.stringify(expense.itemAssignments)}, ${expense.splitMode})
        `
      }
    }

    // Backup localStorage and clear it
    localStorage.setItem('snaptab-trips-backup', stored)
    localStorage.removeItem('snaptab-trips')
    
    console.log('✅ Migration to Neon completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
} 