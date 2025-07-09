"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getActiveTrip, getTripExpenses, type Trip, type Expense } from "@/lib/data"

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load real data from localStorage
    const trip = getActiveTrip()
    if (trip) {
      setActiveTrip(trip)
      
      // Get all expenses for this trip
      const tripExpenses = getTripExpenses(trip.id)
      setExpenses(tripExpenses)
    }
    
    setIsLoading(false)
  }, [])

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.paidBy.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const yourTotal = expenses.reduce((sum, expense) => {
    if (expense.splitWith.includes("You")) {
      return sum + (expense.amount / expense.splitWith.length)
    }
    return sum
  }, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric"
    })
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

  if (!activeTrip) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="p-6 pt-16">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-medium">All Expenses</h1>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center px-6">
          <Card className="minimal-card w-full max-w-sm">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No active trip found.</p>
              <Button onClick={() => window.location.href = "/trips"} className="w-full">
                Select a Trip
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
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-medium">All Expenses</h1>
            <p className="text-sm text-muted-foreground">{activeTrip.name}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-card border-border rounded-2xl"
          />
        </div>

        {/* Summary */}
        <Card className="minimal-card mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Spent</p>
                <p className="text-2xl font-light">
                  {getCurrencySymbol(activeTrip.currency)}{totalAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Your Share</p>
                <p className="text-2xl font-light text-primary">
                  {getCurrencySymbol(activeTrip.currency)}{yourTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Results */}
        {searchTerm && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.length} of {expenses.length} expenses
            </p>
          </div>
        )}
      </header>

      {/* Expenses List */}
      <main className="flex-1 px-6 pb-6 overflow-y-auto">
        {filteredExpenses.length === 0 ? (
          <Card className="minimal-card">
            <CardContent className="p-6 text-center">
              {searchTerm ? (
                <>
                  <p className="text-muted-foreground mb-2">No expenses found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">No expenses yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first expense by scanning a receipt or entering manually
                  </p>
                  <Button onClick={() => window.location.href = "/add-expense"} className="w-full">
                    Add Expense
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} className="minimal-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{expense.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        {expense.paidBy} • {formatDate(expense.date)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Split between {expense.splitWith.length} member{expense.splitWith.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-lg">
                        {getCurrencySymbol(activeTrip.currency)}{expense.amount.toFixed(2)}
                      </p>
                      {expense.splitWith.includes("You") && (
                        <p className="text-sm text-primary">
                          Your share: {getCurrencySymbol(activeTrip.currency)}{(expense.amount / expense.splitWith.length).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
