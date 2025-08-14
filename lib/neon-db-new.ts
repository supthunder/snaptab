import { sql } from '@vercel/postgres'

// Database types
export interface User {
  id: string;
  username: string;
  display_name?: string;
  passkey_credential?: any;
  created_at: string;
  avatar_url?: string;
  venmo_username?: string;
}

export interface Trip {
  id: string;
  trip_code: number;
  name: string;
  place_name?: string;
  background_image_url?: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
  currency: string;
}

export interface Expense {
  id: string;
  trip_id: string;
  name: string;
  description?: string;
  merchant_name?: string;
  total_amount: number;
  currency: string;
  receipt_image_url?: string;
  expense_date: string;
  paid_by: string;
  split_with: string[];
  split_mode: 'even' | 'items';
  category?: string;
  summary?: string;
  emoji?: string;
  tax_amount?: number;
  tip_amount?: number;
  confidence?: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseItem {
  id: string;
  expense_id: string;
  name: string;
  price: number;
  quantity: number;
  item_order: number;
  created_at: string;
}

export interface ItemAssignment {
  id: string;
  expense_item_id: string;
  user_id: string;
  assigned_at: string;
}

export interface SettlementPayment {
  id: string;
  trip_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  is_paid: boolean;
  paid_at?: string;
  marked_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TripShare {
  id: string;
  share_code: string;
  trip_code: number;
  og_image_url?: string;
  username?: string;
  place_name?: string;
  created_at: string;
}

// Database initialization - create the new schema
export async function initializeNewDatabase() {
  try {
    console.log('🚀 Initializing new database schema...')

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        passkey_credential JSONB,
        avatar_url TEXT,
        venmo_username VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // Create trips table
    await sql`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_code INTEGER UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        place_name VARCHAR(200),
        background_image_url TEXT,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
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
        description TEXT,
        merchant_name VARCHAR(200),
        total_amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        receipt_image_url TEXT,
        expense_date DATE NOT NULL,
        paid_by UUID NOT NULL REFERENCES users(id),
        split_with JSONB NOT NULL DEFAULT '[]'::jsonb,
        split_mode VARCHAR(10) NOT NULL DEFAULT 'even' CHECK (split_mode IN ('even', 'items')),
        category VARCHAR(50),
        summary VARCHAR(100),
        emoji VARCHAR(10),
        tax_amount DECIMAL(10,2),
        tip_amount DECIMAL(10,2),
        confidence DECIMAL(3,2),
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

    // Create settlement_payments table for tracking payment status
    await sql`
      CREATE TABLE IF NOT EXISTS settlement_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
        from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        is_paid BOOLEAN DEFAULT false,
        paid_at TIMESTAMPTZ,
        marked_by_user_id UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(trip_id, from_user_id, to_user_id)
      )
    `

    // Create trip_shares table for sharing system
    await sql`
      CREATE TABLE IF NOT EXISTS trip_shares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        share_code VARCHAR(10) UNIQUE NOT NULL,
        trip_code INTEGER NOT NULL,
        og_image_url TEXT,
        username VARCHAR(50),
        place_name VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    console.log('✅ New database schema initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Error initializing new database:', error)
    throw error
  }
}

// Create a new user with passkey
export async function createUser(username: string, displayName?: string, passkeyCredential?: any): Promise<User | null> {
  try {
    const result = await sql`
      INSERT INTO users (username, display_name, passkey_credential)
      VALUES (${username}, ${displayName || null}, ${passkeyCredential ? JSON.stringify(passkeyCredential) : null})
      RETURNING *
    `
    
    if (result.rows.length > 0) {
    return result.rows[0] as User
    }
    return null
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username}
    `
    
    if (result.rows.length > 0) {
      return result.rows[0] as User
    }
    return null
  } catch (error) {
    console.error('Error getting user by username:', error)
    return null
  }
}

// Update user's passkey credential
export async function updateUserPasskey(username: string, passkeyCredential: any): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE users 
      SET passkey_credential = ${JSON.stringify(passkeyCredential)}
      WHERE username = ${username}
    `
    
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Error updating user passkey:', error)
    return false
  }
}

// Generate a unique 3-digit trip code
async function generateUniqueTripCode(): Promise<number> {
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    const tripCode = Math.floor(Math.random() * 900) + 100 // 100-999
    
    const result = await sql`
      SELECT trip_code FROM trips WHERE trip_code = ${tripCode}
    `
    
    if (result.rows.length === 0) {
      return tripCode
    }
    
    attempts++
  }
  
  throw new Error('Could not generate unique trip code after 100 attempts')
}

// Create a new trip
export async function createTrip(
  name: string, 
  createdByUsername: string, 
  placeName?: string, 
  backgroundImageUrl?: string,
  currency: string = 'USD'
): Promise<{ trip: Trip; tripCode: number } | null> {
  try {
    // Get user by username
    const user = await getUserByUsername(createdByUsername)
    if (!user) {
      console.error('User not found:', createdByUsername)
      return null
    }

    // Generate unique trip code
    const tripCode = await generateUniqueTripCode()
    
    // Create trip
    const result = await sql`
      INSERT INTO trips (trip_code, name, place_name, background_image_url, currency, created_by)
      VALUES (${tripCode}, ${name}, ${placeName || null}, ${backgroundImageUrl || null}, ${currency}, ${user.id})
      RETURNING *
    `
    
    if (result.rows.length > 0) {
    const trip = result.rows[0] as Trip

      // Add creator as first member
    await sql`
      INSERT INTO trip_members (trip_id, user_id)
      VALUES (${trip.id}, ${user.id})
    `

    return { trip, tripCode }
    }
    return null
  } catch (error) {
    console.error('Error creating trip:', error)
    return null
  }
}

// Get trip by code
export async function getTripByCode(tripCode: number): Promise<{ trip: Trip; members: User[] } | null> {
  try {
    const tripResult = await sql`
      SELECT * FROM trips WHERE trip_code = ${tripCode}
    `
    
    if (tripResult.rows.length === 0) {
    return null
    }
    
    const trip = tripResult.rows[0] as Trip
    
    // Get trip members
    const membersResult = await sql`
      SELECT u.* FROM users u
      JOIN trip_members tm ON u.id = tm.user_id
      WHERE tm.trip_id = ${trip.id} AND tm.is_active = true
    `
    
    const members = membersResult.rows as User[]
    
    return { trip, members }
  } catch (error) {
    console.error('Error getting trip by code:', error)
    return null
  }
}

// Add user to trip
export async function addUserToTrip(tripCode: number, username: string): Promise<boolean> {
  try {
    // Get trip
    const tripResult = await sql`
      SELECT id FROM trips WHERE trip_code = ${tripCode}
    `
    
    if (tripResult.rows.length === 0) {
      return false
    }
    
    const tripId = tripResult.rows[0].id
    
    // Get user
    const user = await getUserByUsername(username)
    if (!user) {
      return false
    }
    
    // Add to trip (ON CONFLICT DO NOTHING handles duplicates)
    await sql`
      INSERT INTO trip_members (trip_id, user_id)
      VALUES (${tripId}, ${user.id})
      ON CONFLICT (trip_id, user_id) DO UPDATE SET is_active = true
    `
    
    return true
  } catch (error) {
    console.error('Error adding user to trip:', error)
    return false
  }
}

// Get trips for user
export async function getTripsForUser(username: string): Promise<Trip[]> {
  try {
    const user = await getUserByUsername(username)
    if (!user) {
      return []
    }

    const result = await sql`
      SELECT t.* FROM trips t
      JOIN trip_members tm ON t.id = tm.trip_id
      WHERE tm.user_id = ${user.id} AND tm.is_active = true
      ORDER BY t.created_at DESC
    `
    
    return result.rows as Trip[]
  } catch (error) {
    console.error('Error getting trips for user:', error)
    return []
  }
}

// Add expense to trip
export async function addExpenseToTrip(
  tripCode: number, 
  paidByUsername: string, 
  expenseData: {
    name: string;
    description?: string;
    merchant_name?: string;
    total_amount: number;
    currency: string;
    receipt_image_url?: string;
    expense_date: string;
    split_with: string[];
    split_mode: 'even' | 'items';
    category?: string;
    summary?: string;
    emoji?: string;
    tax_amount?: number;
    tip_amount?: number;
    confidence?: number;
  },
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    item_order: number;
  }> = [],
  splitWithUsernames: string[] = []
): Promise<Expense | null> {
  try {
    // Get trip
    const tripResult = await sql`
      SELECT id FROM trips WHERE trip_code = ${tripCode}
    `
    
    if (tripResult.rows.length === 0) {
      return null
    }
    
    const tripId = tripResult.rows[0].id
    
    // Get user who paid
    const paidByUser = await getUserByUsername(paidByUsername)
    if (!paidByUser) {
      return null
    }
    
    // Get split_with user IDs
    const splitWithUserIds: string[] = []
      for (const username of splitWithUsernames) {
      const user = await getUserByUsername(username)
      if (user) {
        splitWithUserIds.push(user.id)
      }
    }

    // Create expense
    const expenseResult = await sql`
      INSERT INTO expenses (
        trip_id, name, description, merchant_name, total_amount, currency, 
        receipt_image_url, expense_date, paid_by, split_with, split_mode,
        category, summary, emoji, tax_amount, tip_amount, confidence
      )
      VALUES (
        ${tripId}, ${expenseData.name}, ${expenseData.description || null}, 
        ${expenseData.merchant_name || null}, ${expenseData.total_amount}, ${expenseData.currency},
        ${expenseData.receipt_image_url || null}, ${expenseData.expense_date}, ${paidByUser.id}, 
        ${JSON.stringify(splitWithUserIds)}, ${expenseData.split_mode},
        ${expenseData.category || null}, ${expenseData.summary || null}, ${expenseData.emoji || null},
        ${expenseData.tax_amount || null}, ${expenseData.tip_amount || null}, ${expenseData.confidence || null}
      )
      RETURNING *
    `
    
    if (expenseResult.rows.length === 0) {
      return null
    }
    
    const expense = expenseResult.rows[0] as Expense

    // Add expense items if provided
    if (items.length > 0) {
      for (const item of items) {
      await sql`
        INSERT INTO expense_items (expense_id, name, price, quantity, item_order)
          VALUES (${expense.id}, ${item.name}, ${item.price}, ${item.quantity}, ${item.item_order})
      `
      }
    }

    return expense
  } catch (error) {
    console.error('Error adding expense to trip:', error)
    return null
  }
}

// Get expenses for trip
export async function getExpensesForTrip(tripCode: number): Promise<Array<Expense & { paid_by_username: string; paid_by_display_name?: string; split_with_users: User[] }>> {
  try {
    const tripResult = await sql`
      SELECT id FROM trips WHERE trip_code = ${tripCode}
    `
    
    if (tripResult.rows.length === 0) {
      return []
    }
    
    const tripId = tripResult.rows[0].id

    const result = await sql`
      SELECT 
        e.*,
        u.username as paid_by_username,
        u.display_name as paid_by_display_name
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.trip_id = ${tripId}
      ORDER BY e.created_at DESC
    `
    
    const expenses = []
    
    for (const row of result.rows) {
      const expense = row as any
      
      // Get split_with users
      const splitWithIds = expense.split_with || []
      const splitWithUsers: User[] = []
      
      for (const userId of splitWithIds) {
        const userResult = await sql`
          SELECT * FROM users WHERE id = ${userId}
        `
        if (userResult.rows.length > 0) {
          splitWithUsers.push(userResult.rows[0] as User)
        }
      }
      
      expenses.push({
        ...expense,
        split_with_users: splitWithUsers
      })
    }
    
    return expenses
  } catch (error) {
    console.error('Error getting expenses for trip:', error)
    return []
  }
}

// Get expense with items and assignments
export async function getExpenseWithItems(expenseId: string): Promise<(Expense & { items: (ExpenseItem & { assignments: User[] })[]; paid_by_username?: string; paid_by_display_name?: string; split_with_users?: User[] }) | null> {
  try {
    // Get expense with paid_by user info
    const expenseResult = await sql`
      SELECT 
        e.*,
        u.username as paid_by_username,
        u.display_name as paid_by_display_name
      FROM expenses e
      JOIN users u ON e.paid_by = u.id
      WHERE e.id = ${expenseId}
    `
    
    if (expenseResult.rows.length === 0) {
      return null
    }
    
    const expense = expenseResult.rows[0] as any
    
    // Get split_with users
    const splitWithIds = expense.split_with || []
    const splitWithUsers: User[] = []
    
    for (const userId of splitWithIds) {
        const userResult = await sql`
        SELECT * FROM users WHERE id = ${userId}
        `
        if (userResult.rows.length > 0) {
          splitWithUsers.push(userResult.rows[0] as User)
        }
    }
    
    // Get expense items
    const itemsResult = await sql`
      SELECT * FROM expense_items 
      WHERE expense_id = ${expenseId}
      ORDER BY item_order
    `
    
    const items = []
    
    for (const itemRow of itemsResult.rows) {
      const item = itemRow as ExpenseItem
      
      // Get assignments for this item
      const assignmentsResult = await sql`
        SELECT u.* FROM users u
        JOIN item_assignments ia ON u.id = ia.user_id
        WHERE ia.expense_item_id = ${item.id}
      `
      
      const assignments = assignmentsResult.rows as User[]
      
      items.push({
        ...item,
        assignments
      })
    }

    return {
      ...expense,
      items,
      split_with_users: splitWithUsers
    }
  } catch (error) {
    console.error('Error fetching expense with items:', error)
    return null
  }
}

// Delete expense and all related data
export async function deleteExpense(expenseId: string): Promise<boolean> {
  try {
    // Get expense info before deleting (to get trip_id for trip total recalculation)
    const expenseResult = await sql`
      SELECT trip_id, total_amount FROM expenses WHERE id = ${expenseId}
    `
    
    if (expenseResult.rows.length === 0) {
      return false // Expense not found
    }
    
    const expense = expenseResult.rows[0]
    const tripId = expense.trip_id
    
    // Delete expense (CASCADE will automatically delete expense_items and item_assignments)
    const deleteResult = await sql`
      DELETE FROM expenses WHERE id = ${expenseId}
    `
    
    // Return true if expense was deleted
    return (deleteResult.rowCount ?? 0) > 0
    
  } catch (error) {
    console.error('Error deleting expense:', error)
    return false
  }
}

// Calculate user balance for database-based trips
export async function getUserBalanceFromDB(tripCode: number, username: string): Promise<number> {
  try {
    const user = await getUserByUsername(username)
    if (!user) {
      return 0
    }

    const tripResult = await sql`
      SELECT id FROM trips WHERE trip_code = ${tripCode}
    `
    
    if (tripResult.rows.length === 0) {
      return 0
    }
    
    const tripId = tripResult.rows[0].id

    // Get all expenses for this trip (excluding settled ones)
    const expensesResult = await sql`
      SELECT 
        id, paid_by, total_amount, split_with, split_mode
      FROM expenses 
      WHERE trip_id = ${tripId} AND (is_settled IS NULL OR is_settled = false)
    `

    let balance = 0

    for (const expense of expensesResult.rows) {
      const expenseAmount = parseFloat(expense.total_amount.toString())
      
      // If user paid for this expense, they get credited
      if (expense.paid_by === user.id) {
        balance += expenseAmount
      }

      // Calculate how much this user owes for this expense
      if (expense.split_mode === 'even') {
        // Even split among split_with users
        const splitWithIds = expense.split_with || []
        if (splitWithIds.includes(user.id)) {
          const shareAmount = expenseAmount / splitWithIds.length
          balance -= shareAmount
        }
      } else if (expense.split_mode === 'items') {
        // Item-based split - get user's assigned items
        const assignedItemsResult = await sql`
          SELECT ei.price, ia_count.assignment_count
          FROM expense_items ei
          JOIN item_assignments ia ON ei.id = ia.expense_item_id
          JOIN (
            SELECT expense_item_id, COUNT(*) as assignment_count
            FROM item_assignments
            GROUP BY expense_item_id
          ) ia_count ON ei.id = ia_count.expense_item_id
          WHERE ei.expense_id = ${expense.id} AND ia.user_id = ${user.id}
        `
        
        for (const assignedItem of assignedItemsResult.rows) {
          const itemPrice = parseFloat(assignedItem.price.toString())
          const assignmentCount = parseInt(assignedItem.assignment_count)
          const shareAmount = itemPrice / assignmentCount
          balance -= shareAmount
        }
      }
    }

    return balance
  } catch (error) {
    console.error('Error calculating user balance from DB:', error)
    return 0
  }
}

// Assign item to user
export async function assignItemToUser(expenseItemId: string, username: string): Promise<boolean> {
  try {
    const user = await getUserByUsername(username)
    if (!user) {
      return false
    }
    
    await sql`
      INSERT INTO item_assignments (expense_item_id, user_id)
      VALUES (${expenseItemId}, ${user.id})
      ON CONFLICT (expense_item_id, user_id) DO NOTHING
    `
    
    return true
  } catch (error) {
    console.error('Error assigning item to user:', error)
    return false
  }
}

// Unassign item from user
export async function unassignItemFromUser(expenseItemId: string, username: string): Promise<boolean> {
  try {
    const user = await getUserByUsername(username)
    if (!user) {
      return false
    }
    
    const result = await sql`
      DELETE FROM item_assignments 
      WHERE expense_item_id = ${expenseItemId} AND user_id = ${user.id}
    `
    
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Error unassigning item from user:', error)
    return false
  }
}

// Calculate settlement payments for a trip
export async function calculateSettlementPayments(tripCode: number): Promise<Array<{
  from_username: string;
  to_username: string;
  amount: number;
}>> {
  try {
    const tripResult = await sql`
      SELECT id FROM trips WHERE trip_code = ${tripCode}
    `
    
    if (tripResult.rows.length === 0) {
      return []
    }
    
    const tripId = tripResult.rows[0].id

    // Get all trip members
    const membersResult = await sql`
      SELECT u.id, u.username FROM users u
      JOIN trip_members tm ON u.id = tm.user_id
      WHERE tm.trip_id = ${tripId} AND tm.is_active = true
    `

    const members = membersResult.rows
    const balances: { [username: string]: number } = {}

    // Calculate balance for each member
    for (const member of members) {
      balances[member.username] = await getUserBalanceFromDB(tripCode, member.username)
    }

    // Calculate settlement payments using a simple algorithm
    const settlements: Array<{
      from_username: string;
      to_username: string;
      amount: number;
    }> = []

    const creditors = Object.entries(balances).filter(([_, balance]) => balance > 0.01).sort((a, b) => b[1] - a[1])
    const debtors = Object.entries(balances).filter(([_, balance]) => balance < -0.01).sort((a, b) => a[1] - b[1])

    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const [creditorUsername, creditorBalance] = creditors[creditorIndex]
      const [debtorUsername, debtorBalance] = debtors[debtorIndex]

      const settlementAmount = Math.min(creditorBalance, Math.abs(debtorBalance))

      if (settlementAmount > 0.01) {
        settlements.push({
          from_username: debtorUsername,
          to_username: creditorUsername,
          amount: Math.round(settlementAmount * 100) / 100
        })

        creditors[creditorIndex][1] -= settlementAmount
        debtors[debtorIndex][1] += settlementAmount
      }

      if (creditors[creditorIndex][1] <= 0.01) {
        creditorIndex++
      }
      if (debtors[debtorIndex][1] >= -0.01) {
        debtorIndex++
      }
    }

    return settlements
  } catch (error) {
    console.error('Error calculating settlement payments:', error)
    return []
  }
}

// Get or create settlement payments for a trip
export async function getSettlementPayments(tripCode: number): Promise<Array<{
  id: string;
  trip_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  is_paid: boolean;
  paid_at?: string;
  marked_by_user_id?: string;
  created_at: string;
  updated_at: string;
  from_username: string;
  to_username: string;
}>> {
  try {
    const tripResult = await sql`
      SELECT id FROM trips WHERE trip_code = ${tripCode}
    `
    
    if (tripResult.rows.length === 0) {
      return []
    }
    
    const tripId = tripResult.rows[0].id

    // First, calculate what the settlements should be
    const calculatedSettlements = await calculateSettlementPayments(tripCode)

    // Get existing settlement payments
    const existingResult = await sql`
      SELECT sp.id, sp.trip_id, sp.from_user_id, sp.to_user_id, 
             CAST(sp.amount AS FLOAT) as amount,
             sp.is_paid, sp.paid_at, sp.marked_by_user_id, 
             sp.created_at, sp.updated_at,
             fu.username as from_username, tu.username as to_username
      FROM settlement_payments sp
      JOIN users fu ON sp.from_user_id = fu.id
      JOIN users tu ON sp.to_user_id = tu.id
      WHERE sp.trip_id = ${tripId}
    `

    const existingPayments = existingResult.rows

    // Create or update settlement payments based on calculated settlements
    for (const settlement of calculatedSettlements) {
      await createOrUpdateSettlementPayment(
        tripId,
        settlement.from_username,
        settlement.to_username,
        settlement.amount
      )
    }

    // Get updated settlement payments
    const updatedResult = await sql`
      SELECT sp.id, sp.trip_id, sp.from_user_id, sp.to_user_id, 
             CAST(sp.amount AS FLOAT) as amount,
             sp.is_paid, sp.paid_at, sp.marked_by_user_id, 
             sp.created_at, sp.updated_at,
             fu.username as from_username, tu.username as to_username
      FROM settlement_payments sp
      JOIN users fu ON sp.from_user_id = fu.id
      JOIN users tu ON sp.to_user_id = tu.id
      WHERE sp.trip_id = ${tripId}
    `

    return updatedResult.rows as any[]
  } catch (error) {
    console.error('Error getting settlement payments:', error)
    return []
  }
}

// Create or update a settlement payment
export async function createOrUpdateSettlementPayment(
  tripId: string,
  fromUsername: string,
  toUsername: string,
  amount: number
): Promise<boolean> {
  try {
    const fromUser = await getUserByUsername(fromUsername)
    const toUser = await getUserByUsername(toUsername)
    
    if (!fromUser || !toUser) {
      return false
    }

    const result = await sql`
      INSERT INTO settlement_payments (trip_id, from_user_id, to_user_id, amount)
      VALUES (${tripId}, ${fromUser.id}, ${toUser.id}, ${amount})
      ON CONFLICT (trip_id, from_user_id, to_user_id) 
      DO UPDATE SET 
        amount = EXCLUDED.amount,
        updated_at = NOW()
      RETURNING id, trip_id, from_user_id, to_user_id, 
                CAST(amount AS FLOAT) as amount,
                is_paid, paid_at, marked_by_user_id, 
                created_at, updated_at
    `

    return result.rows.length > 0
  } catch (error) {
    console.error('Error creating/updating settlement payment:', error)
    return false
  }
}

// Update payment status
export async function updatePaymentStatus(paymentId: string, isPaid: boolean, markedByUserId: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE settlement_payments 
      SET 
        is_paid = ${isPaid},
        paid_at = ${isPaid ? 'NOW()' : null},
        marked_by_user_id = ${markedByUserId},
        updated_at = NOW()
      WHERE id = ${paymentId}
    `

    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Error updating payment status:', error)
    return false
  }
}

// Get payment by ID
export async function getPaymentById(paymentId: string): Promise<any> {
  try {
    const result = await sql`
      SELECT sp.id, sp.trip_id, sp.from_user_id, sp.to_user_id, 
             CAST(sp.amount AS FLOAT) as amount,
             sp.is_paid, sp.paid_at, sp.marked_by_user_id, 
             sp.created_at, sp.updated_at,
             fu.username as from_username, tu.username as to_username
      FROM settlement_payments sp
      JOIN users fu ON sp.from_user_id = fu.id
      JOIN users tu ON sp.to_user_id = tu.id
      WHERE sp.id = ${paymentId}
    `

    return result.rows.length > 0 ? result.rows[0] : null
  } catch (error) {
    console.error('Error getting payment by ID:', error)
    return null
  }
}

// Create trip share
export async function createTripShare(
  shareCode: string,
  tripCode: number,
  ogImageUrl?: string,
  username?: string,
  placeName?: string
): Promise<TripShare | null> {
  try {
    const result = await sql`
      INSERT INTO trip_shares (share_code, trip_code, og_image_url, username, place_name)
      VALUES (${shareCode}, ${tripCode}, ${ogImageUrl || null}, ${username || null}, ${placeName || null})
      RETURNING *
    `
    
    if (result.rows.length > 0) {
      return result.rows[0] as TripShare
    }
    return null
  } catch (error) {
    console.error('Error creating trip share:', error)
    return null
  }
}

// Get trip share by share code
export async function getTripShareByCode(shareCode: string): Promise<TripShare | null> {
  try {
    const result = await sql`
      SELECT * FROM trip_shares WHERE share_code = ${shareCode}
    `
    
    if (result.rows.length > 0) {
      return result.rows[0] as TripShare
    }
    return null
    } catch (error) {
    console.error('Error getting trip share by code:', error)
    return null
  }
}

// Update user avatar
export async function updateUserAvatar(username: string, avatarUrl: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE users 
      SET avatar_url = ${avatarUrl}
      WHERE username = ${username}
    `
    
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Error updating user avatar:', error)
    return false
  }
}

// Get user's Venmo username
export async function getUserVenmoUsername(username: string): Promise<string | null> {
  try {
    const result = await sql`
      SELECT venmo_username FROM users WHERE username = ${username}
    `
    
    if (result.rows.length > 0) {
      return result.rows[0].venmo_username || null
    }
    return null
  } catch (error) {
    console.error('Error getting user Venmo username:', error)
    return null
  }
}

// Update user's Venmo username
export async function updateUserVenmoUsername(username: string, venmoUsername: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE users 
      SET venmo_username = ${venmoUsername}
      WHERE username = ${username}
    `
    
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Error updating user Venmo username:', error)
    return false
  }
}

// Delete user's Venmo username
export async function deleteUserVenmoUsername(username: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE users 
      SET venmo_username = NULL
      WHERE username = ${username}
    `
    
    return (result.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Error deleting user Venmo username:', error)
    return false
  }
}

// Delete trip and all related data
export async function deleteTrip(tripCode: number, username: string): Promise<boolean> {
  try {
    // Get trip and verify user is the creator
    const tripResult = await sql`
      SELECT t.id, t.created_by, u.id as user_id
      FROM trips t
      JOIN users u ON u.username = ${username}
      WHERE t.trip_code = ${tripCode} AND t.created_by = u.id
    `
    
    if (tripResult.rows.length === 0) {
      return false // Trip not found or user is not the creator
    }
    
    const tripId = tripResult.rows[0].id
    
    // Delete trip (CASCADE will handle related data)
    const deleteResult = await sql`
      DELETE FROM trips WHERE id = ${tripId}
    `
    
    return (deleteResult.rowCount ?? 0) > 0
  } catch (error) {
    console.error('Error deleting trip:', error)
    return false
  }
}

// Update expense and handle item assignments
export async function updateExpense(
  expenseId: string,
  updateData: {
    name?: string;
    description?: string;
    merchant_name?: string;
    total_amount?: number;
    currency?: string;
    expense_date?: string;
    paid_by_username?: string;
    split_mode?: 'even' | 'items';
    category?: string;
    summary?: string;
    emoji?: string;
    tax_amount?: number;
    tip_amount?: number;
    confidence?: number;
  },
  itemAssignments?: Array<{
    itemIndex: number;
    assignedTo: string[];
  }>
): Promise<boolean> {
  try {
    // Start a transaction
    await sql`BEGIN`

    // Update expense fields individually to avoid SQL injection issues
    // Always update the timestamp
    await sql`UPDATE expenses SET updated_at = NOW() WHERE id = ${expenseId}`
    
    if (updateData.name !== undefined) {
      await sql`UPDATE expenses SET name = ${updateData.name} WHERE id = ${expenseId}`
    }
    if (updateData.description !== undefined) {
      await sql`UPDATE expenses SET description = ${updateData.description} WHERE id = ${expenseId}`
    }
    if (updateData.merchant_name !== undefined) {
      await sql`UPDATE expenses SET merchant_name = ${updateData.merchant_name} WHERE id = ${expenseId}`
    }
    if (updateData.total_amount !== undefined) {
      await sql`UPDATE expenses SET total_amount = ${updateData.total_amount} WHERE id = ${expenseId}`
    }
    if (updateData.currency !== undefined) {
      await sql`UPDATE expenses SET currency = ${updateData.currency} WHERE id = ${expenseId}`
    }
    if (updateData.expense_date !== undefined) {
      await sql`UPDATE expenses SET expense_date = ${updateData.expense_date} WHERE id = ${expenseId}`
    }
    if (updateData.split_mode !== undefined) {
      await sql`UPDATE expenses SET split_mode = ${updateData.split_mode} WHERE id = ${expenseId}`
    }
    if (updateData.category !== undefined) {
      await sql`UPDATE expenses SET category = ${updateData.category} WHERE id = ${expenseId}`
    }
    if (updateData.summary !== undefined) {
      await sql`UPDATE expenses SET summary = ${updateData.summary} WHERE id = ${expenseId}`
    }
    if (updateData.emoji !== undefined) {
      await sql`UPDATE expenses SET emoji = ${updateData.emoji} WHERE id = ${expenseId}`
    }
    if (updateData.tax_amount !== undefined) {
      await sql`UPDATE expenses SET tax_amount = ${updateData.tax_amount} WHERE id = ${expenseId}`
    }
    if (updateData.tip_amount !== undefined) {
      await sql`UPDATE expenses SET tip_amount = ${updateData.tip_amount} WHERE id = ${expenseId}`
    }
    if (updateData.confidence !== undefined) {
      await sql`UPDATE expenses SET confidence = ${updateData.confidence} WHERE id = ${expenseId}`
    }
    
    // Handle paid_by username update
    if (updateData.paid_by_username) {
      const user = await getUserByUsername(updateData.paid_by_username)
      if (user) {
        await sql`UPDATE expenses SET paid_by = ${user.id} WHERE id = ${expenseId}`
      }
    }

    // Handle item assignments if provided
    if (itemAssignments && itemAssignments.length > 0) {
      // Get all expense items for this expense
      const itemsResult = await sql`
        SELECT id, item_order FROM expense_items 
        WHERE expense_id = ${expenseId}
        ORDER BY item_order
      `
      
      const expenseItems = itemsResult.rows
      
      // Clear all existing assignments for this expense
      await sql`
        DELETE FROM item_assignments 
        WHERE expense_item_id IN (
          SELECT id FROM expense_items WHERE expense_id = ${expenseId}
        )
      `
      
      // Add new assignments
      for (const assignment of itemAssignments) {
        const itemId = expenseItems[assignment.itemIndex]?.id
        
        if (itemId) {
          for (const username of assignment.assignedTo) {
            const user = await getUserByUsername(username)
            if (user) {
              await sql`
                INSERT INTO item_assignments (expense_item_id, user_id)
                VALUES (${itemId}, ${user.id})
                ON CONFLICT (expense_item_id, user_id) DO NOTHING
              `
            }
          }
        }
      }
    }

    // Commit the transaction
    await sql`COMMIT`
    return true
    
  } catch (error) {
    // Rollback on error
    await sql`ROLLBACK`
    console.error('Error updating expense:', error)
    return false
  }
}

// Update expense payment status (mark as paid/unpaid)
export async function updateExpensePaymentStatus(expenseId: string, isPaid: boolean, markedByUsername: string): Promise<boolean> {
  try {
    const user = await getUserByUsername(markedByUsername)
    if (!user) {
      return false
    }

    await sql`
      UPDATE expenses 
      SET 
        is_settled = ${isPaid},
        settled_at = ${isPaid ? new Date().toISOString() : null},
        settled_by_user_id = ${isPaid ? user.id : null},
        updated_at = NOW()
      WHERE id = ${expenseId}
    `
    
    return true
  } catch (error) {
    console.error('Error updating expense payment status:', error)
    return false
  }
}

// Test new database connection
export async function testNewDatabaseConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`
    console.log('✅ New database connection successful:', result.rows[0])
    return { success: true, data: result.rows[0] }
  } catch (error) {
    console.error('❌ New database connection failed:', error)
    return { success: false, error }
  }
}

// Passkey authentication functions
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, username, display_name, created_at, updated_at, avatar_url
      FROM users 
      WHERE id = ${userId}
    `
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
      avatar_url: row.avatar_url
    }
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

export async function getPasskeyCredentialsByUserId(userId: string): Promise<any[]> {
  try {
    const result = await sql`
      SELECT id, credential_id, public_key, counter, created_at
      FROM passkey_credentials 
      WHERE user_id = ${userId}
    `
    
    return result.rows.map(row => ({
      id: row.id,
      credentialId: row.credential_id,
      publicKey: row.public_key,
      counter: row.counter,
      createdAt: row.created_at
    }))
  } catch (error) {
    console.error('Error getting passkey credentials by user ID:', error)
    return []
  }
}

export async function getPasskeyCredentialByCredentialId(credentialId: string): Promise<any | null> {
  try {
    const result = await sql`
      SELECT id, user_id, credential_id, public_key, counter, created_at
      FROM passkey_credentials 
      WHERE credential_id = ${credentialId}
    `
    
    if (result.rows.length === 0) {
      return null
    }
    
    const row = result.rows[0]
    return {
      id: row.id,
      user_id: row.user_id,
      credential_id: row.credential_id,
      public_key: row.public_key,
      counter: row.counter,
      created_at: row.created_at
    }
  } catch (error) {
    console.error('Error getting passkey credential by credential ID:', error)
    return null
  }
}

export async function updatePasskeyCredentialCounter(credentialId: string, counter: number): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE passkey_credentials 
      SET counter = ${counter}, updated_at = NOW()
      WHERE credential_id = ${credentialId}
    `
    
    return result.rowCount > 0
  } catch (error) {
    console.error('Error updating passkey credential counter:', error)
    return false
  }
} 