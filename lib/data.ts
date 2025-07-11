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
}

// Get all trips from localStorage
export function getTrips(): Trip[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem('snaptab-trips')
  if (!stored) {
    // Return default mock data if nothing stored
    return getDefaultTrips()
  }
  
  try {
    return JSON.parse(stored)
  } catch {
    return getDefaultTrips()
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

// Get default mock data
function getDefaultTrips(): Trip[] {
  return [
    {
      id: "1",
      name: "Tokyo Adventure",
      members: ["You", "Sarah", "Mike", "Emma"],
      totalExpenses: 0,
      currency: "USD",
      startDate: "2024-01-10",
      endDate: "2024-01-20",
      isActive: true,
      createdAt: new Date().toISOString(),
      expenses: []
    },
    {
      id: "2",
      name: "Paris Weekend",
      members: ["You", "Sarah", "Mike"],
      totalExpenses: 0,
      currency: "EUR",
      startDate: "2023-12-15",
      endDate: "2023-12-18",
      isActive: false,
      createdAt: new Date().toISOString(),
      expenses: []
    }
  ]
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
export function getCategoryColor(category?: string): string {
  const categoryColors: { [key: string]: string } = {
    food: 'bg-orange-500/20 border-orange-500/30',
    lodging: 'bg-blue-500/20 border-blue-500/30',
    transportation: 'bg-green-500/20 border-green-500/30',
    entertainment: 'bg-purple-500/20 border-purple-500/30',
    shopping: 'bg-pink-500/20 border-pink-500/30',
    health: 'bg-red-500/20 border-red-500/30',
    communication: 'bg-indigo-500/20 border-indigo-500/30',
    business: 'bg-gray-500/20 border-gray-500/30',
    miscellaneous: 'bg-yellow-500/20 border-yellow-500/30',
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