export interface TripMember {
  id: string
  name: string
  email: string
}

export interface Expense {
  id: string
  amount: number
  paidById: string
  splits: {
    userId: string
    amountOwed: number
  }[]
}

export interface Balance {
  userId: string
  amount: number // positive = owed money, negative = owes money
}

export interface Settlement {
  from: string // user who pays
  to: string   // user who receives
  amount: number
}

export interface SettlementResult {
  balances: Balance[]
  settlements: Settlement[]
  totalTransactions: number
}

/**
 * Calculate individual balances for each user in a trip
 */
export function calculateBalances(expenses: Expense[], members: TripMember[]): Balance[] {
  const balances: { [userId: string]: number } = {}
  
  // Initialize all members with 0 balance
  members.forEach(member => {
    balances[member.id] = 0
  })
  
  // Calculate balances from expenses
  expenses.forEach(expense => {
    // Add amount paid to payer's balance
    balances[expense.paidById] += expense.amount
    
    // Subtract amount owed from each split participant
    expense.splits.forEach(split => {
      balances[split.userId] -= split.amountOwed
    })
  })
  
  return Object.entries(balances).map(([userId, amount]) => ({
    userId,
    amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
  }))
}

/**
 * Optimize settlements to minimize number of transactions
 * Uses a greedy algorithm to match largest creditors with largest debtors
 */
export function optimizeSettlements(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = []
  
  // Filter out zero balances and separate creditors (positive) from debtors (negative)
  const creditors = balances
    .filter(b => b.amount > 0.01)
    .sort((a, b) => b.amount - a.amount) // Sort descending
    
  const debtors = balances
    .filter(b => b.amount < -0.01)
    .map(b => ({ ...b, amount: Math.abs(b.amount) }))
    .sort((a, b) => b.amount - a.amount) // Sort descending
  
  // Create working copies
  const workingCreditors = [...creditors]
  const workingDebtors = [...debtors]
  
  while (workingCreditors.length > 0 && workingDebtors.length > 0) {
    const creditor = workingCreditors[0]
    const debtor = workingDebtors[0]
    
    // Determine settlement amount (minimum of what's owed and what's due)
    const settlementAmount = Math.min(creditor.amount, debtor.amount)
    
    // Create settlement
    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(settlementAmount * 100) / 100
    })
    
    // Update balances
    creditor.amount -= settlementAmount
    debtor.amount -= settlementAmount
    
    // Remove if settled
    if (creditor.amount < 0.01) {
      workingCreditors.shift()
    }
    if (debtor.amount < 0.01) {
      workingDebtors.shift()
    }
  }
  
  return settlements
}

/**
 * Calculate complete settlement information for a trip
 */
export function calculateSettlement(expenses: Expense[], members: TripMember[]): SettlementResult {
  const balances = calculateBalances(expenses, members)
  const settlements = optimizeSettlements(balances)
  
  return {
    balances,
    settlements,
    totalTransactions: settlements.length
  }
}

/**
 * Get user's net balance (positive = owed money, negative = owes money)
 */
export function getUserBalance(userId: string, balances: Balance[]): number {
  const userBalance = balances.find(b => b.userId === userId)
  return userBalance?.amount || 0
}

/**
 * Get settlements involving a specific user
 */
export function getUserSettlements(userId: string, settlements: Settlement[]): {
  toPay: Settlement[]
  toReceive: Settlement[]
} {
  return {
    toPay: settlements.filter(s => s.from === userId),
    toReceive: settlements.filter(s => s.to === userId)
  }
}

/**
 * Format settlement amount with currency
 */
export function formatSettlementAmount(amount: number, currency: string): string {
  const symbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€", 
    GBP: "£",
    JPY: "¥"
  }
  
  const symbol = symbols[currency] || currency
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * Check if all balances are settled (close to zero)
 */
export function isFullySettled(balances: Balance[]): boolean {
  return balances.every(balance => Math.abs(balance.amount) < 0.01)
}

/**
 * Calculate total expenses for the trip
 */
export function calculateTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0)
}

/**
 * Get expense statistics
 */
export function getExpenseStats(expenses: Expense[], members: TripMember[]) {
  const totalAmount = calculateTotalExpenses(expenses)
  const averagePerPerson = totalAmount / members.length
  const balances = calculateBalances(expenses, members)
  
  const maxOwed = Math.max(...balances.map(b => b.amount))
  const maxOwes = Math.abs(Math.min(...balances.map(b => b.amount)))
  
  return {
    totalAmount,
    averagePerPerson,
    totalExpenses: expenses.length,
    maxOwed,
    maxOwes,
    isSettled: isFullySettled(balances)
  }
}