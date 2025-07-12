import { sql } from '@vercel/postgres'

// Types for the new database schema
export interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  trip_code: number
  name: string
  currency: string
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  joined_at: string
  is_active: boolean
}

export interface Expense {
  id: string
  trip_id: string
  name: string
  merchant_name?: string
  total_amount: number
  currency: string
  receipt_image_url?: string
  expense_date: string
  paid_by: string
  category?: string
  summary?: string
  emoji?: string
  created_at: string
  updated_at: string
}

export interface ExpenseItem {
  id: string
  expense_id: string
  name: string
  price: number
  quantity: number
  item_order: number
  created_at: string
}

export interface ItemAssignment {
  id: string
  expense_item_id: string
  user_id: string
  assigned_at: string
}

// Database initialization - create the new schema
export async function initializeNewDatabase() {
  try {
    console.log('🔧 Creating new SnapTab database schema...')

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create trips table with 3-digit codes
    await sql`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_code INTEGER UNIQUE NOT NULL CHECK (trip_code >= 100 AND trip_code <= 999),
        name VARCHAR(100) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        created_by UUID NOT NULL REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create trip_members table
    await sql`
      CREATE TABLE IF NOT EXISTS trip_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        UNIQUE(trip_id, user_id)
      )
    `

    // Create expenses table
    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        merchant_name VARCHAR(200),
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        receipt_image_url TEXT,
        expense_date DATE NOT NULL,
        paid_by UUID NOT NULL REFERENCES users(id),
        category VARCHAR(50),
        summary VARCHAR(100),
        emoji VARCHAR(10),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create expense_items table
    await sql`
      CREATE TABLE IF NOT EXISTS expense_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INTEGER DEFAULT 1,
        item_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create item_assignments table
    await sql`
      CREATE TABLE IF NOT EXISTS item_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_item_id UUID NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(expense_item_id, user_id)
      )
    `

    // Create indexes (with error handling)
    console.log('Creating indexes...')
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`
      await sql`CREATE INDEX IF NOT EXISTS idx_trips_code ON trips(trip_code)`
      await sql`CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by)`
      await sql`CREATE INDEX IF NOT EXISTS idx_trips_active ON trips(is_active)`
      await sql`CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_trip_members_user ON trip_members(user_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_trip_members_active ON trip_members(is_active)`
      await sql`CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by)`
      await sql`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)`
      await sql`CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at)`
      await sql`CREATE INDEX IF NOT EXISTS idx_expense_items_expense ON expense_items(expense_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_expense_items_order ON expense_items(expense_id, item_order)`
      await sql`CREATE INDEX IF NOT EXISTS idx_item_assignments_item ON item_assignments(expense_item_id)`
      await sql`CREATE INDEX IF NOT EXISTS idx_item_assignments_user ON item_assignments(user_id)`
      console.log('Indexes created successfully')
    } catch (indexError) {
      console.warn('Some indexes may have failed to create:', indexError)
      // Continue anyway - indexes are not critical for basic functionality
    }

    console.log('✅ New database schema created successfully!')
    return { success: true }
  } catch (error) {
    console.error('❌ Database schema creation failed:', error)
    return { success: false, error }
  }
}

// User Management Functions
export async function createUser(username: string, displayName?: string, avatarUrl?: string): Promise<User | null> {
  try {
    // Validate username
    if (!isValidUsername(username)) {
      throw new Error('Invalid username format')
    }

    const result = await sql`
      INSERT INTO users (username, display_name, avatar_url)
      VALUES (${username.toLowerCase()}, ${displayName}, ${avatarUrl})
      RETURNING *
    `
    return result.rows[0] as User
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username.toLowerCase()} LIMIT 1
    `
    return result.rows[0] as User || null
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function updateUser(username: string, updates: Partial<User>): Promise<User | null> {
  try {
    const result = await sql`
      UPDATE users 
      SET 
        display_name = COALESCE(${updates.display_name}, display_name),
        avatar_url = COALESCE(${updates.avatar_url}, avatar_url),
        updated_at = NOW()
      WHERE username = ${username.toLowerCase()}
      RETURNING *
    `
    return result.rows[0] as User || null
  } catch (error) {
    console.error('Error updating user:', error)
    return null
  }
}

// Trip Management Functions
export async function createTrip(name: string, currency: string, createdByUsername: string): Promise<{ trip: Trip; tripCode: number } | null> {
  try {
    console.log('Creating trip for user:', createdByUsername)
    
    // Get user
    const user = await getUserByUsername(createdByUsername)
    console.log('Found user:', user ? 'Yes' : 'No', user?.id)
    if (!user) throw new Error('User not found')

    // Generate unique trip code
    console.log('Generating trip code...')
    const tripCode = await generateUniqueTripCode()
    console.log('Generated trip code:', tripCode)
    
    console.log('Inserting trip into database...')
    const result = await sql`
      INSERT INTO trips (trip_code, name, currency, created_by)
      VALUES (${tripCode}, ${name}, ${currency}, ${user.id})
      RETURNING *
    `
    
    const trip = result.rows[0] as Trip
    console.log('Trip created:', trip.id)

    // Add creator as member
    console.log('Adding creator as member...')
    await sql`
      INSERT INTO trip_members (trip_id, user_id)
      VALUES (${trip.id}, ${user.id})
    `
    console.log('Creator added as member')

    return { trip, tripCode }
  } catch (error) {
    console.error('Error creating trip:', error)
    return null
  }
}

export async function getTripByCode(tripCode: number): Promise<Trip | null> {
  try {
    const result = await sql`
      SELECT * FROM trips WHERE trip_code = ${tripCode} AND is_active = true LIMIT 1
    `
    return result.rows[0] as Trip || null
  } catch (error) {
    console.error('Error fetching trip:', error)
    return null
  }
}

export async function joinTrip(tripCode: number, username: string): Promise<boolean> {
  try {
    const trip = await getTripByCode(tripCode)
    const user = await getUserByUsername(username)
    
    if (!trip || !user) return false

    // Check if already a member
    const existing = await sql`
      SELECT id FROM trip_members 
      WHERE trip_id = ${trip.id} AND user_id = ${user.id}
    `
    
    if (existing.rows.length > 0) {
      // Reactivate if inactive
      await sql`
        UPDATE trip_members 
        SET is_active = true 
        WHERE trip_id = ${trip.id} AND user_id = ${user.id}
      `
      return true
    }

    // Add as new member
    await sql`
      INSERT INTO trip_members (trip_id, user_id)
      VALUES (${trip.id}, ${user.id})
    `
    
    return true
  } catch (error) {
    console.error('Error joining trip:', error)
    return false
  }
}

export async function getTripMembers(tripCode: number): Promise<User[]> {
  try {
    const result = await sql`
      SELECT u.* 
      FROM users u
      JOIN trip_members tm ON u.id = tm.user_id
      JOIN trips t ON tm.trip_id = t.id
      WHERE t.trip_code = ${tripCode} AND tm.is_active = true
      ORDER BY tm.joined_at
    `
    return result.rows as User[]
  } catch (error) {
    console.error('Error fetching trip members:', error)
    return []
  }
}

export async function getUserTrips(username: string): Promise<Trip[]> {
  try {
    const user = await getUserByUsername(username)
    if (!user) return []

    const result = await sql`
      SELECT t.* 
      FROM trips t
      JOIN trip_members tm ON t.id = tm.trip_id
      WHERE tm.user_id = ${user.id} AND tm.is_active = true AND t.is_active = true
      ORDER BY t.created_at DESC
    `
    return result.rows as Trip[]
  } catch (error) {
    console.error('Error fetching user trips:', error)
    return []
  }
}

// Expense Management Functions
export async function addExpenseToTrip(
  tripCode: number, 
  paidByUsername: string, 
  expenseData: Omit<Expense, 'id' | 'trip_id' | 'paid_by' | 'created_at' | 'updated_at'>,
  items: Omit<ExpenseItem, 'id' | 'expense_id' | 'created_at'>[]
): Promise<Expense | null> {
  try {
    const trip = await getTripByCode(tripCode)
    const user = await getUserByUsername(paidByUsername)
    
    if (!trip || !user) return null

    // Verify user is member of trip
    const isMember = await sql`
      SELECT id FROM trip_members 
      WHERE trip_id = ${trip.id} AND user_id = ${user.id} AND is_active = true
    `
    if (isMember.rows.length === 0) return null

    // Create expense
    const expenseResult = await sql`
      INSERT INTO expenses (
        trip_id, name, merchant_name, total_amount, currency, 
        receipt_image_url, expense_date, paid_by, category, summary, emoji
      )
      VALUES (
        ${trip.id}, ${expenseData.name}, ${expenseData.merchant_name}, 
        ${expenseData.total_amount}, ${expenseData.currency}, 
        ${expenseData.receipt_image_url}, ${expenseData.expense_date}, 
        ${user.id}, ${expenseData.category}, ${expenseData.summary}, ${expenseData.emoji}
      )
      RETURNING *
    `
    
    const expense = expenseResult.rows[0] as Expense

    // Add items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await sql`
        INSERT INTO expense_items (expense_id, name, price, quantity, item_order)
        VALUES (${expense.id}, ${item.name}, ${item.price}, ${item.quantity}, ${i})
      `
    }

    return expense
  } catch (error) {
    console.error('Error adding expense:', error)
    return null
  }
}

export async function getTripExpenses(tripCode: number): Promise<(Expense & { items: ExpenseItem[]; paid_by_user: User })[]> {
  try {
    const trip = await getTripByCode(tripCode)
    if (!trip) return []

    const result = await sql`
      SELECT 
        e.*,
        u.username as paid_by_username,
        u.display_name as paid_by_display_name,
        u.avatar_url as paid_by_avatar_url
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.trip_id = ${trip.id}
      ORDER BY e.created_at DESC
    `
    
    const expenses = result.rows

    // Get items for each expense
    const expensesWithItems = []
    for (const expense of expenses) {
      const itemsResult = await sql`
        SELECT * FROM expense_items 
        WHERE expense_id = ${expense.id} 
        ORDER BY item_order
      `
      
      expensesWithItems.push({
        ...expense,
        items: itemsResult.rows as ExpenseItem[],
        paid_by_user: {
          id: expense.paid_by,
          username: expense.paid_by_username,
          display_name: expense.paid_by_display_name,
          avatar_url: expense.paid_by_avatar_url,
          created_at: expense.created_at,
          updated_at: expense.updated_at
        }
      } as Expense & { items: ExpenseItem[]; paid_by_user: User })
    }

    return expensesWithItems
  } catch (error) {
    console.error('Error fetching trip expenses:', error)
    return []
  }
}

export async function assignItemToUser(expenseItemId: string, username: string): Promise<boolean> {
  try {
    const user = await getUserByUsername(username)
    if (!user) return false

    await sql`
      INSERT INTO item_assignments (expense_item_id, user_id)
      VALUES (${expenseItemId}, ${user.id})
      ON CONFLICT (expense_item_id, user_id) DO NOTHING
    `
    
    return true
  } catch (error) {
    console.error('Error assigning item:', error)
    return false
  }
}

export async function unassignItemFromUser(expenseItemId: string, username: string): Promise<boolean> {
  try {
    const user = await getUserByUsername(username)
    if (!user) return false

    await sql`
      DELETE FROM item_assignments 
      WHERE expense_item_id = ${expenseItemId} AND user_id = ${user.id}
    `
    
    return true
  } catch (error) {
    console.error('Error unassigning item:', error)
    return false
  }
}

export async function getExpenseWithItems(expenseId: string): Promise<(Expense & { items: (ExpenseItem & { assignments: User[] })[] }) | null> {
  try {
    const expenseResult = await sql`
      SELECT * FROM expenses WHERE id = ${expenseId}
    `
    
    if (expenseResult.rows.length === 0) return null
    
    const expense = expenseResult.rows[0] as Expense

    const itemsResult = await sql`
      SELECT 
        ei.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', u.id,
              'username', u.username,
              'display_name', u.display_name,
              'avatar_url', u.avatar_url
            )
          ) FILTER (WHERE u.id IS NOT NULL), 
          '[]'
        ) as assignments
      FROM expense_items ei
      LEFT JOIN item_assignments ia ON ei.id = ia.expense_item_id
      LEFT JOIN users u ON ia.user_id = u.id
      WHERE ei.expense_id = ${expenseId}
      GROUP BY ei.id
      ORDER BY ei.item_order
    `

    const items = itemsResult.rows.map(row => ({
      ...row,
      assignments: row.assignments || []
    })) as (ExpenseItem & { assignments: User[] })[]

    return {
      ...expense,
      items
    }
  } catch (error) {
    console.error('Error fetching expense with items:', error)
    return null
  }
}

// Utility Functions
function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,50}$/.test(username)
}

async function generateUniqueTripCode(): Promise<number> {
  const maxAttempts = 100
  console.log('Starting trip code generation...')
  
  for (let i = 0; i < maxAttempts; i++) {
    const code = Math.floor(Math.random() * 900) + 100 // 100-999
    console.log(`Attempt ${i + 1}: Generated code ${code}`)
    
    try {
      const existing = await sql`
        SELECT id FROM trips WHERE trip_code = ${code}
      `
      console.log(`Code ${code} check result: ${existing.rows.length} existing`)
      
      if (existing.rows.length === 0) {
        console.log(`Code ${code} is unique! Returning.`)
        return code
      }
    } catch (error) {
      console.error(`Error checking code ${code}:`, error)
      throw error
    }
  }
  
  console.error('Failed to generate unique trip code after', maxAttempts, 'attempts')
  throw new Error('Could not generate unique trip code')
}

// Test function
export async function testNewConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`
    console.log('✅ New database connection successful:', result.rows[0])
    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error('❌ New database connection failed:', error)
    return { success: false, error }
  }
} 