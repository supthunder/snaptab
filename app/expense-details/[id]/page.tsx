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
  type Expense 
} from "@/lib/data"

interface ExpenseDetailsPageProps {
  params: {
    id: string
  }
}

export default function ExpenseDetailsPage({ params }: ExpenseDetailsPageProps) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [expense, setExpense] = useState<Expense | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    paidBy: '',
    date: ''
  })

  useEffect(() => {
    // Load trip and find the specific expense
    const trip = getActiveTrip()
    if (trip) {
      setActiveTrip(trip)
      
      // Find the expense by ID
      const foundExpense = trip.expenses.find(exp => exp.id === params.id)
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
  }, [params.id])

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
          {/* Amount Card */}
          <Card className="minimal-card">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm mb-2">Total Amount</p>
              <p className="text-4xl font-light text-primary mb-2">
                {getCurrencySymbol(activeTrip.currency)}{expense.amount.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Your share: {getCurrencySymbol(activeTrip.currency)}{(expense.amount / expense.splitWith.length).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="minimal-card">
            <CardContent className="p-6 space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Expense description"
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                      placeholder="0.00"
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid By</Label>
                    <Input
                      id="paidBy"
                      value={editForm.paidBy}
                      onChange={(e) => setEditForm({...editForm, paidBy: e.target.value})}
                      placeholder="Who paid"
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                      className="h-12"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Description</span>
                    <span className="font-medium text-right">{expense.description}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Paid By</span>
                    <span className="font-medium">{expense.paidBy}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{new Date(expense.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Split With</span>
                    <div className="text-right">
                      <div className="font-medium">{expense.splitWith.join(", ")}</div>
                      <div className="text-sm text-muted-foreground">
                        {expense.splitWith.length} {expense.splitWith.length === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{formatTimeAgo(expense.createdAt)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Split Details Card */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <h3 className="font-medium mb-4">Split Details</h3>
              <div className="space-y-3">
                {expense.splitWith.map((person, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-foreground">{person}</span>
                    <span className="font-medium">
                      {getCurrencySymbol(activeTrip.currency)}{(expense.amount / expense.splitWith.length).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 