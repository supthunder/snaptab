export interface ReceiptItem {
  name: string
  price: number
  quantity?: number
}

export interface ItemAssignment {
  itemIndex: number
  assignedTo: string[]
}

export interface Expense {
  id: string
  description: string
  amount: number
  date: string
  paidBy: string
  splitWith: string[]
  tripId: string
  createdAt: string
  // Category and visual
  category?: string
  summary?: string
  emoji?: string
  // Item-level details
  items?: ReceiptItem[]
  itemAssignments?: ItemAssignment[]
  splitMode?: 'even' | 'items'
}

export interface Trip {
  id: string
  name: string
  members: string[]
  totalExpenses: number
  currency: string
  startDate?: string
  endDate?: string
  isActive: boolean
  createdAt: string
  expenses: Expense[]
  tripCode?: number // For database trips with 3-digit codes
}

// Get all trips from localStorage
export function getTrips(): Trip[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem('snaptab-trips')
  if (!stored) {
    // Return empty array instead of mock data
    return []
  }
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Save trips to localStorage
export function saveTrips(trips: Trip[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('snaptab-trips', JSON.stringify(trips))
}

// Get active trip
export function getActiveTrip(): Trip | null {
  const trips = getTrips()
  return trips.find(trip => trip.isActive) || null
}

// Add expense to a trip
export function addExpenseToTrip(tripId: string, expenseData: Omit<Expense, 'id' | 'createdAt' | 'tripId'>): Expense {
  const trips = getTrips()
  const tripIndex = trips.findIndex(trip => trip.id === tripId)
  
  if (tripIndex === -1) {
    throw new Error('Trip not found')
  }
  
  const expense: Expense = {
    ...expenseData,
    id: generateId(),
    tripId,
    createdAt: new Date().toISOString()
  }
  
  trips[tripIndex].expenses.push(expense)
  trips[tripIndex].totalExpenses += expenseData.amount
  
  saveTrips(trips)
  return expense
}

// Get expenses for a trip
export function getTripExpenses(tripId: string): Expense[] {
  const trips = getTrips()
  const trip = trips.find(t => t.id === tripId)
  return trip?.expenses || []
}

// Get recent expenses across all trips (or specific trip)
export function getRecentExpenses(tripId?: string, limit: number = 5): Expense[] {
  const trips = getTrips()
  let allExpenses: Expense[] = []
  
  if (tripId) {
    const trip = trips.find(t => t.id === tripId)
    allExpenses = trip?.expenses || []
  } else {
    allExpenses = trips.flatMap(trip => trip.expenses)
  }
  
  return allExpenses
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Calculate user balance for a trip
export function getUserBalance(tripId: string, userName: string = "You"): number {
  const expenses = getTripExpenses(tripId)
  let balance = 0
  
  expenses.forEach(expense => {
    if (expense.paidBy === userName) {
      // User paid for this expense
      balance += expense.amount
    }
    
    if (expense.splitWith.includes(userName)) {
      // User owes their share
      balance -= expense.amount / expense.splitWith.length
    }
  })
  
  return balance
}

// Calculate total expenses for a trip
export function recalculateTripTotal(tripId: string): number {
  const expenses = getTripExpenses(tripId)
  return expenses.reduce((total, expense) => total + expense.amount, 0)
}

// Get category color for expense cards
export function getCategoryColor(category?: string): { backgroundColor: string; borderColor: string } {
  const categoryColors: { [key: string]: { backgroundColor: string; borderColor: string } } = {
    food: { backgroundColor: 'rgba(255, 165, 0, 0.2)', borderColor: 'rgba(255, 165, 0, 0.5)' },
    lodging: { backgroundColor: 'rgba(0, 123, 255, 0.2)', borderColor: 'rgba(0, 123, 255, 0.5)' },
    transportation: { backgroundColor: 'rgba(40, 167, 69, 0.2)', borderColor: 'rgba(40, 167, 69, 0.5)' },
    entertainment: { backgroundColor: 'rgba(138, 43, 226, 0.2)', borderColor: 'rgba(138, 43, 226, 0.5)' },
    shopping: { backgroundColor: 'rgba(255, 192, 203, 0.2)', borderColor: 'rgba(255, 192, 203, 0.5)' },
    health: { backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: 'rgba(220, 53, 69, 0.5)' },
    communication: { backgroundColor: 'rgba(102, 16, 242, 0.2)', borderColor: 'rgba(102, 16, 242, 0.5)' },
    business: { backgroundColor: 'rgba(108, 117, 125, 0.2)', borderColor: 'rgba(108, 117, 125, 0.5)' },
    miscellaneous: { backgroundColor: 'rgba(255, 193, 7, 0.2)', borderColor: 'rgba(255, 193, 7, 0.5)' },
  }
  
  return categoryColors[category || 'miscellaneous'] || categoryColors.miscellaneous
}

// Update trip total expenses
export function updateTripTotal(tripId: string): void {
  const trips = getTrips()
  const tripIndex = trips.findIndex(trip => trip.id === tripId)
  
  if (tripIndex !== -1) {
    trips[tripIndex].totalExpenses = recalculateTripTotal(tripId)
    saveTrips(trips)
  }
} 