"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Edit2, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  getActiveTrip, 
  getTripExpenses, 
  saveTrips,
  getTrips,
  type Trip, 
  type Expense,
  type ReceiptItem,
  type ItemAssignment
} from "@/lib/data"

interface ExpenseDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ExpenseDetailsPage({ params }: ExpenseDetailsPageProps) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [expense, setExpense] = useState<Expense | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [expenseId, setExpenseId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    paidBy: '',
    date: ''
  })

  useEffect(() => {
    // First get the params
    params.then((resolvedParams) => {
      setExpenseId(resolvedParams.id)
      
      // Load trip and find the specific expense
      const trip = getActiveTrip()
      if (trip) {
        setActiveTrip(trip)
        
        // Find the expense by ID
        const foundExpense = trip.expenses.find(exp => exp.id === resolvedParams.id)
        if (foundExpense) {
          setExpense(foundExpense)
          setEditForm({
            description: foundExpense.description,
            amount: foundExpense.amount.toString(),
            paidBy: foundExpense.paidBy,
            date: foundExpense.date
          })
        }
      }
      
      setIsLoading(false)
    })
  }, [params])

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const expenseDate = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - expenseDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "1 day ago"
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return expenseDate.toLocaleDateString()
  }

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥"
    }
    return symbols[currency] || currency
  }

  // Calculate item-based split details
  const getItemBasedSplitDetails = () => {
    if (!expense?.items || !expense?.itemAssignments) return null
    
    const memberTotals: { [key: string]: number } = {}
    const memberItems: { [key: string]: Array<{ name: string; price: number; shared: boolean; sharedWith: string[] }> } = {}
    
    // Initialize all members
    expense.splitWith.forEach(member => {
      memberTotals[member] = 0
      memberItems[member] = []
    })

    // Calculate totals and items for each member
    expense.itemAssignments.forEach(assignment => {
      const item = expense.items![assignment.itemIndex]
      const splitAmount = item.price / assignment.assignedTo.length
      const isShared = assignment.assignedTo.length > 1
      
      assignment.assignedTo.forEach(person => {
        if (memberTotals[person] !== undefined) {
          memberTotals[person] += splitAmount
          memberItems[person].push({
            name: item.name,
            price: splitAmount,
            shared: isShared,
            sharedWith: assignment.assignedTo
          })
        }
      })
    })

    return { memberTotals, memberItems }
  }

  // Get expense breakdown
  const getExpenseBreakdown = () => {
    if (expense?.splitMode === 'items') {
      return getItemBasedSplitDetails()
    }
    
    // Even split
    const splitAmount = expense!.amount / expense!.splitWith.length
    const memberTotals: { [key: string]: number } = {}
    
    expense!.splitWith.forEach(member => {
      memberTotals[member] = splitAmount
    })
    
    return { memberTotals, memberItems: {} }
  }

  const startEditing = () => {
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (expense) {
      setEditForm({
        description: expense.description,
        amount: expense.amount.toString(),
        paidBy: expense.paidBy,
        date: expense.date
      })
    }
    setIsEditing(false)
  }

  const saveExpense = () => {
    if (!expense || !activeTrip) return
    
    const trips = getTrips()
    const tripIndex = trips.findIndex(trip => trip.id === activeTrip.id)
    
    if (tripIndex !== -1) {
      const expenseIndex = trips[tripIndex].expenses.findIndex(exp => exp.id === expense.id)
      
      if (expenseIndex !== -1) {
        // Update the expense
        const updatedExpense = {
          ...expense,
          description: editForm.description,
          amount: parseFloat(editForm.amount),
          paidBy: editForm.paidBy,
          date: editForm.date
        }
        
        trips[tripIndex].expenses[expenseIndex] = updatedExpense
        
        // Recalculate trip total
        trips[tripIndex].totalExpenses = trips[tripIndex].expenses.reduce((sum, exp) => sum + exp.amount, 0)
        
        // Save to localStorage
        saveTrips(trips)
        
        // Update local state
        setExpense(updatedExpense)
        setActiveTrip(trips[tripIndex])
        setIsEditing(false)
      }
    }
  }

  const deleteExpense = () => {
    if (!expense || !activeTrip) return
    
    const trips = getTrips()
    const tripIndex = trips.findIndex(trip => trip.id === activeTrip.id)
    
    if (tripIndex !== -1) {
      // Remove the expense
      trips[tripIndex].expenses = trips[tripIndex].expenses.filter(exp => exp.id !== expense.id)
      
      // Recalculate trip total
      trips[tripIndex].totalExpenses = trips[tripIndex].expenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      // Save to localStorage
      saveTrips(trips)
      
      // Navigate back to previous page
      window.history.back()
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!expense || !activeTrip) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="p-6 pt-16">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-medium">Expense Details</h1>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center px-6">
          <Card className="minimal-card w-full max-w-sm">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Expense not found.</p>
              <Button onClick={() => window.history.back()} className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-6 pt-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-medium">Expense Details</h1>
              <p className="text-sm text-muted-foreground">{activeTrip.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={startEditing}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button variant="ghost" size="sm" onClick={saveExpense}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={deleteExpense} className="text-red-500">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Amount Summary Card */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-medium text-foreground mb-4">
                  {expense.summary || expense.description}
                </h2>
                
                <p className="text-muted-foreground text-sm mb-2">Total Amount</p>
                <p className="text-4xl font-light text-primary mb-2">
                  {getCurrencySymbol(activeTrip.currency)}{expense.amount.toFixed(2)}
                </p>
                <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
                  <span>Paid by {expense.paidBy}</span>
                  <span>•</span>
                  <span>{new Date(expense.date).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Split Mode Display */}
              <div className="text-center p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  {expense.splitMode === 'items' && expense.items ? 
                    `Split by ${expense.items.length} item${expense.items.length > 1 ? 's' : ''}` : 
                    'Split evenly'
                  }
                </p>
              </div>
              
              {/* Your Share Highlight */}
              {(() => {
                const breakdown = getExpenseBreakdown()
                const yourShare = breakdown?.memberTotals['You'] || 0
                return (
                  <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Your Share</p>
                    <p className="text-2xl font-medium text-primary">
                      {getCurrencySymbol(activeTrip.currency)}{yourShare.toFixed(2)}
                    </p>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          {(() => {
            const breakdown = getExpenseBreakdown()
            if (!breakdown) return null
            
            const { memberTotals, memberItems } = breakdown
            
            return (
              <Card className="minimal-card">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Expense Breakdown</h3>
                  
                  <div className="space-y-4">
                    {Object.entries(memberTotals).map(([member, total]) => (
                      <div key={member} className="p-4 rounded-lg border border-border bg-card/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-lg">{member}</span>
                          <span className="text-lg font-medium text-primary">
                            {getCurrencySymbol(activeTrip.currency)}{total.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Item details for this member */}
                        {memberItems[member] && memberItems[member].length > 0 && (
                          <div className="space-y-2 mt-3">
                            {memberItems[member].map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">{item.name}</span>
                                  {item.shared && (
                                    <span className="text-xs bg-muted px-2 py-1 rounded">
                                      shared with {item.sharedWith.filter(p => p !== member).join(', ')}
                                    </span>
                                  )}
                                </div>
                                <span className="text-muted-foreground">
                                  {getCurrencySymbol(activeTrip.currency)}{item.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Item Details (if available) */}
          {expense.items && expense.items.length > 0 && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Items ({expense.items.length})</h3>
                <div className="space-y-3">
                  {expense.items.map((item, index) => {
                    const assignment = expense.itemAssignments?.find(a => a.itemIndex === index)
                    return (
                      <div key={index} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          {item.quantity && (
                            <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                          )}
                          {assignment && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Assigned to: {assignment.assignedTo.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {getCurrencySymbol(activeTrip.currency)}{item.price.toFixed(2)}
                          </div>
                          {assignment && assignment.assignedTo.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              {getCurrencySymbol(activeTrip.currency)}{(item.price / assignment.assignedTo.length).toFixed(2)} each
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total People</span>
                  <span className="font-medium">{expense.splitWith.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatTimeAgo(expense.createdAt)}</span>
                </div>
                
                {/* All participants */}
                <div>
                  <div className="text-muted-foreground mb-2">Participants</div>
                  <div className="flex flex-wrap gap-2">
                    {expense.splitWith.map((person, index) => (
                      <span key={index} className="px-3 py-1 bg-muted rounded-full text-sm">
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 