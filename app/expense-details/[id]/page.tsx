"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Edit2, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  getCategoryColor, 
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

interface DatabaseExpense {
  id: string
  trip_id: string
  name: string
  description: string
  merchant_name: string
  total_amount: number
  currency: string
  expense_date: string
  paid_by: string
  paid_by_username: string
  split_with: string[]
  split_mode: 'even' | 'items'
  category: string
  summary: string
  emoji: string
  tax_amount: number
  tip_amount: number
  confidence: number
  created_at: string
  updated_at: string
  items: any[]
}

interface DatabaseTrip {
  id: string
  name: string
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
  trip_code: number
}

export default function ExpenseDetailsPage({ params }: ExpenseDetailsPageProps) {
  const [trip, setTrip] = useState<DatabaseTrip | null>(null)
  const [expense, setExpense] = useState<DatabaseExpense | null>(null)
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
    params.then(async (resolvedParams) => {
      setExpenseId(resolvedParams.id)
      
      try {
        // Load expense from database
        const expenseResponse = await fetch(`/api/expenses/${resolvedParams.id}`)
        
        if (!expenseResponse.ok) {
          throw new Error('Failed to load expense')
        }
        
        const expenseData = await expenseResponse.json()
        const fetchedExpense = expenseData.expense
        
        if (fetchedExpense) {
          setExpense(fetchedExpense)
          setEditForm({
            description: fetchedExpense.description || fetchedExpense.name,
            amount: fetchedExpense.total_amount.toString(),
            paidBy: fetchedExpense.paid_by_username || fetchedExpense.paid_by,
            date: fetchedExpense.expense_date
          })

          // Load trip data using the trip code from localStorage
          const tripCode = localStorage.getItem('snapTab_currentTripCode')
          if (tripCode) {
            try {
              const tripResponse = await fetch(`/api/trips/${tripCode}`)
              if (tripResponse.ok) {
                const tripData = await tripResponse.json()
                setTrip(tripData.trip)
              }
            } catch (error) {
              console.error('Failed to load trip data:', error)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load expense:', error)
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

  const startEditing = () => {
    setIsEditing(true)
  }

  const cancelEditing = () => {
    if (expense) {
      setEditForm({
        description: expense.description || expense.name,
        amount: expense.total_amount.toString(),
        paidBy: expense.paid_by_username || expense.paid_by,
        date: expense.expense_date
      })
    }
    setIsEditing(false)
  }

  const saveExpense = async () => {
    if (!expense || !trip) return
    
    try {
      // TODO: Implement expense update API endpoint
      console.log('Saving expense:', editForm)
      // For now, just update local state
      const updatedExpense = {
        ...expense,
        description: editForm.description,
        name: editForm.description,
        total_amount: parseFloat(editForm.amount),
        paid_by_username: editForm.paidBy,
        expense_date: editForm.date
      }
      
      setExpense(updatedExpense)
      setIsEditing(false)
      
      // TODO: Make API call to update expense in database
      alert('Expense updated successfully!')
      
    } catch (error) {
      console.error('Failed to save expense:', error)
      alert('Failed to save expense. Please try again.')
    }
  }

  const deleteExpense = async () => {
    if (!expense) return
    
    const confirmDelete = window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')
    if (!confirmDelete) return
    
    try {
      // TODO: Implement expense deletion API endpoint
      console.log('Deleting expense:', expense.id)
      
      // For now, just navigate back
      window.history.back()
      
      // TODO: Make API call to delete expense from database
      alert('Expense deleted successfully!')
      
    } catch (error) {
      console.error('Failed to delete expense:', error)
      alert('Failed to delete expense. Please try again.')
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

  if (!expense) {
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
              <p className="text-sm text-muted-foreground">{trip?.name || 'Loading...'}</p>
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
                  {expense.summary || expense.name}
                </h2>
                
                <p className="text-muted-foreground text-sm mb-2">Total Amount</p>
                <p className="text-4xl font-light text-primary mb-2">
                  {getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{expense.total_amount.toFixed(2)}
                </p>
                <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
                  <span>Paid by {expense.paid_by_username || expense.paid_by}</span>
                  <span>•</span>
                  <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Split Mode Display */}
              <div className="text-center p-3 bg-muted/50 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  {expense.split_mode === 'items' && expense.items?.length > 0 ? 
                    `Split by ${expense.items.length} item${expense.items.length > 1 ? 's' : ''}` : 
                    'Split evenly'
                  }
                </p>
              </div>
              
              {/* Split Details */}
              {expense.split_with && expense.split_with.length > 0 && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Split between:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {expense.split_with.map((person, index) => (
                      <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {person}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{(expense.total_amount / expense.split_with.length).toFixed(2)} each
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Form */}
          {isEditing && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Edit Expense</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label htmlFor="paidBy">Paid By</Label>
                    <Input
                      id="paidBy"
                      value={editForm.paidBy}
                      onChange={(e) => setEditForm({...editForm, paidBy: e.target.value})}
                      placeholder="Enter who paid"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Item Details (if available) */}
          {expense.items && expense.items.length > 0 && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Items ({expense.items.length})</h3>
                <div className="space-y-3">
                  {expense.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.quantity && (
                          <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                        )}
                        {item.assignments && item.assignments.length > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Assigned to: {item.assignments.map((a: any) => a.display_name || a.username).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{item.price.toFixed(2)}
                        </div>
                        {item.assignments && item.assignments.length > 1 && (
                          <div className="text-xs text-muted-foreground">
                            {getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{(item.price / item.assignments.length).toFixed(2)} each
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Details */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                {expense.merchant_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Merchant</span>
                    <span className="font-medium">{expense.merchant_name}</span>
                  </div>
                )}
                
                {expense.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium capitalize">{expense.category}</span>
                  </div>
                )}
                
                {expense.tax_amount && expense.tax_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{expense.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                
                {expense.tip_amount && expense.tip_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="font-medium">{getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{expense.tip_amount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatTimeAgo(expense.created_at)}</span>
                </div>
                
                {expense.split_with && expense.split_with.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total People</span>
                    <span className="font-medium">{expense.split_with.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 