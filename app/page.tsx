"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Plus, ArrowRight, Menu, Loader2, Check, AlertCircle, X, Edit2, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  getActiveTrip, 
  getRecentExpenses, 
  getUserBalance, 
  getTripExpenses,
  addExpenseToTrip,
  saveTrips,
  getTrips,
  type Trip, 
  type Expense 
} from "@/lib/data"

interface ReceiptData {
  merchantName: string
  total: number
  currency: string
  transactionDate: string
  items?: Array<{
    name: string
    price: number
    quantity?: number
  }>
  tax?: number
  tip?: number
  confidence: number
}

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [userBalance, setUserBalance] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<ReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // New state for expense details modal
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    paidBy: '',
    date: ''
  })

  useEffect(() => {
    // Load real data from localStorage
    const trip = getActiveTrip()
    if (trip) {
      setActiveTrip(trip)
      
      // Get recent expenses for this trip
      const recent = getRecentExpenses(trip.id, 3)
      setRecentExpenses(recent)
      
      // Calculate user balance
      const balance = getUserBalance(trip.id, "You")
      setUserBalance(balance)
    }
    
    setIsLoading(false)
  }, [])

  const handleScanClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to scan receipt')
      }

      const receiptData = await response.json()
      setScannedData(receiptData)
    } catch (err) {
      console.error('Scanning error:', err)
      setError(err instanceof Error ? err.message : 'Failed to scan receipt')
    } finally {
      setIsScanning(false)
      // Reset the input so the same file can be selected again
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleConfirm = () => {
    if (scannedData) {
      const params = new URLSearchParams({
        amount: scannedData.total.toString(),
        merchant: scannedData.merchantName,
        date: scannedData.transactionDate || '',
        currency: scannedData.currency || 'USD',
      })
      
      // Add items data if available
      if (scannedData.items && scannedData.items.length > 0) {
        params.set('items', JSON.stringify(scannedData.items))
      }
      
      window.location.href = `/add-expense?${params.toString()}`
    }
  }

  const resetScan = () => {
    setScannedData(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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

  // New function to handle expense click
  const handleExpenseClick = (expense: Expense) => {
    setSelectedExpense(expense)
    setEditForm({
      description: expense.description,
      amount: expense.amount.toString(),
      paidBy: expense.paidBy,
      date: expense.date
    })
    setIsEditing(false)
  }

  // Function to close expense detail modal
  const closeExpenseModal = () => {
    setSelectedExpense(null)
    setIsEditing(false)
  }

  // Function to start editing
  const startEditing = () => {
    setIsEditing(true)
  }

  // Function to save edited expense
  const saveExpense = () => {
    if (!selectedExpense || !activeTrip) return
    
    const trips = getTrips()
    const tripIndex = trips.findIndex(trip => trip.id === activeTrip.id)
    
    if (tripIndex !== -1) {
      const expenseIndex = trips[tripIndex].expenses.findIndex(exp => exp.id === selectedExpense.id)
      
      if (expenseIndex !== -1) {
        // Update the expense
        const updatedExpense = {
          ...selectedExpense,
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
        setSelectedExpense(updatedExpense)
        setActiveTrip(trips[tripIndex])
        setIsEditing(false)
        
        // Refresh recent expenses and balance
        const recent = getRecentExpenses(activeTrip.id, 3)
        setRecentExpenses(recent)
        
        const balance = getUserBalance(activeTrip.id, "You")
        setUserBalance(balance)
      }
    }
  }

  // Function to delete expense
  const deleteExpense = () => {
    if (!selectedExpense || !activeTrip) return
    
    const trips = getTrips()
    const tripIndex = trips.findIndex(trip => trip.id === activeTrip.id)
    
    if (tripIndex !== -1) {
      // Remove the expense
      trips[tripIndex].expenses = trips[tripIndex].expenses.filter(exp => exp.id !== selectedExpense.id)
      
      // Recalculate trip total
      trips[tripIndex].totalExpenses = trips[tripIndex].expenses.reduce((sum, exp) => sum + exp.amount, 0)
      
      // Save to localStorage
      saveTrips(trips)
      
      // Update local state
      setActiveTrip(trips[tripIndex])
      closeExpenseModal()
      
      // Refresh recent expenses and balance
      const recent = getRecentExpenses(activeTrip.id, 3)
      setRecentExpenses(recent)
      
      const balance = getUserBalance(activeTrip.id, "You")
      setUserBalance(balance)
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

  if (!activeTrip) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="p-6 pt-16 safe-area-top">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-foreground mb-2">SnapTab</h1>
            <p className="text-muted-foreground text-sm">No active trip</p>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center px-6">
          <Card className="minimal-card w-full max-w-sm">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">You don't have an active trip yet.</p>
              <div className="space-y-3">
                <Button onClick={() => window.location.href = "/create-trip"} className="w-full">
                  Create New Trip
                </Button>
                <Button onClick={() => window.location.href = "/trips"} variant="secondary" className="w-full">
                  View Saved Trips
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Expense Detail Modal */}
      {selectedExpense && (
        <Dialog open={!!selectedExpense} onOpenChange={closeExpenseModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Expense Details</span>
                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={startEditing}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={saveExpense}>
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={deleteExpense} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Expense description"
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
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paidBy">Paid By</Label>
                    <Input
                      id="paidBy"
                      value={editForm.paidBy}
                      onChange={(e) => setEditForm({...editForm, paidBy: e.target.value})}
                      placeholder="Who paid"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description</span>
                      <span className="font-medium">{selectedExpense.description}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-xl font-medium text-primary">
                        {activeTrip && getCurrencySymbol(activeTrip.currency)}{selectedExpense.amount.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid By</span>
                      <span className="font-medium">{selectedExpense.paidBy}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Split With</span>
                      <span className="font-medium">{selectedExpense.splitWith.join(", ")}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Share</span>
                      <span className="font-medium text-primary">
                        {activeTrip && getCurrencySymbol(activeTrip.currency)}{(selectedExpense.amount / selectedExpense.splitWith.length).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{formatTimeAgo(selectedExpense.createdAt)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Full-screen loading overlay */}
      {isScanning && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Analyzing Receipt...</p>
              <p className="text-sm text-muted-foreground">AI is extracting receipt details</p>
            </div>
          </div>
        </div>
      )}

      {/* Receipt confirmation overlay */}
      {scannedData && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <Card className="minimal-card w-full max-w-sm">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Receipt Scanned</h3>
                {scannedData.confidence < 0.8 && (
                  <p className="text-xs text-yellow-400 mb-2">
                    Low confidence - please verify details
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant</span>
                  <span className="font-medium">{scannedData.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-xl font-medium text-primary">
                    {scannedData.currency} {scannedData.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{scannedData.transactionDate}</span>
                </div>
                {scannedData.tax && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{scannedData.currency} {scannedData.tax.toFixed(2)}</span>
                  </div>
                )}
                {scannedData.tip && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="font-medium">{scannedData.currency} {scannedData.tip.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <Button variant="secondary" className="flex-1 rounded-xl" onClick={resetScan}>
                  Retry
                </Button>
                <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90" onClick={handleConfirm}>
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <Card className="minimal-card w-full max-w-sm">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Scan Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
              </div>

              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90" onClick={resetScan}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Minimal Header */}
      <header className="p-6 pt-16 safe-area-top">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => (window.location.href = "/trips")}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-light text-foreground mb-2">SnapTab</h1>
            <p className="text-muted-foreground text-sm">{activeTrip.name}</p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Balance Card */}
        <Card className="minimal-card mb-6">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm mb-2">Your balance</p>
            <p className={`text-4xl font-light mb-4 ${userBalance < 0 ? "text-red-400" : "text-green-400"}`}>
              {userBalance < 0 ? "-" : "+"}
              {getCurrencySymbol(activeTrip.currency)}
              {Math.abs(userBalance).toFixed(2)}
            </p>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Total: {getCurrencySymbol(activeTrip.currency)}{activeTrip.totalExpenses.toFixed(2)}</span>
              <span>{activeTrip.members.length} members</span>
            </div>
          </CardContent>
        </Card>
      </header>

      {/* Recent Expenses */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => (window.location.href = "/expenses")}
          >
            View all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {recentExpenses.length === 0 ? (
          <Card className="minimal-card">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">No expenses yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first expense by scanning a receipt or entering manually
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <Card 
                key={expense.id} 
                className="minimal-card cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => handleExpenseClick(expense)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{expense.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {expense.paidBy} • {formatTimeAgo(expense.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium">
                        {getCurrencySymbol(activeTrip.currency)}{expense.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Split {expense.splitWith.length} ways
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
        <div className="p-6 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <Button
              className="h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl flex flex-col items-center justify-center space-y-1"
              onClick={handleScanClick}
              disabled={isScanning}
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm font-medium">Add Image</span>
            </Button>
            <Button
              variant="secondary"
              className="h-14 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-2xl flex flex-col items-center justify-center space-y-1"
              onClick={() => (window.location.href = "/add-expense")}
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input for native camera/photo options */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileUpload} 
      />
    </div>
  )
}
