"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Plus, ArrowRight, Menu, Loader2, Check, AlertCircle, Home, User, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { 
  getActiveTrip, 
  getRecentExpenses, 
  getUserBalance,
  getTrips,
  saveTrips,
  getCategoryColor,
  type Trip, 
  type Expense 
} from "@/lib/data"

interface ReceiptData {
  merchantName: string
  total: number
  currency: string
  transactionDate: string
  category?: string
  summary?: string
  emoji?: string
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
  const [terminalLogs, setTerminalLogs] = useState<Array<{text: string, type: 'info' | 'success' | 'warning' | 'data'}>>([])
  const [currentLogIndex, setCurrentLogIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'home' | 'camera' | 'profile'>('home')
  const [trips, setTrips] = useState<Trip[]>([])
  const [isTripsLoading, setIsTripsLoading] = useState(false)

  // Check for first-time user and redirect to onboarding
  useEffect(() => {
    const checkOnboarding = () => {
      const onboardingComplete = localStorage.getItem('snapTab_onboardingComplete')
      const hasUsername = localStorage.getItem('snapTab_username')
      
      // If onboarding is not complete and user doesn't have username, redirect to onboarding
      if (!onboardingComplete && !hasUsername) {
        window.location.href = '/onboarding'
        return
      }
      
      // If returning from onboarding, check if we have trip data
      if (onboardingComplete && hasUsername) {
        const tripCode = localStorage.getItem('snapTab_currentTripCode')
        if (tripCode) {
          // Load trip data from database
          loadTripFromDatabase(tripCode)
        } else {
          // No trip code, load from localStorage fallback
          loadFromLocalStorage()
        }
      } else {
        // No onboarding data, load from localStorage fallback
        loadFromLocalStorage()
      }
    }

    checkOnboarding()
  }, [])

  const loadTripFromDatabase = async (tripCode: string) => {
    try {
      setIsLoading(true)
      
      // Get trip data from database
      const response = await fetch(`/api/trips/${tripCode}`)
      if (!response.ok) {
        throw new Error('Failed to load trip data')
      }
      
      const tripData = await response.json()
      
      // Convert database trip to our Trip interface
      const trip: Trip = {
        id: tripData.trip.id,
        name: tripData.trip.name,
        members: tripData.members?.map((member: any) => member.display_name || member.username) || [],
        totalExpenses: tripData.expenses?.reduce((sum: number, expense: any) => sum + parseFloat(expense.total_amount || 0), 0) || 0,
        currency: tripData.trip.currency || 'USD',
        startDate: undefined,
        endDate: undefined,
        isActive: tripData.trip.is_active || false,
        createdAt: tripData.trip.created_at,
        expenses: tripData.expenses?.map((expense: any) => ({
          id: expense.id,
          tripId: expense.trip_id,
          description: expense.name,
          amount: parseFloat(expense.total_amount || 0),
          date: expense.expense_date,
          paidBy: expense.paid_by_username || "You",
          splitWith: expense.split_with || [],
          category: expense.category,
          summary: expense.summary,
          emoji: expense.emoji,
          createdAt: expense.created_at,
          items: expense.items || [],
          itemAssignments: expense.item_assignments || [],
          splitMode: expense.split_mode || 'even'
        })) || []
      }
      
      setActiveTrip(trip)
      
      // Get recent expenses
      const recentExpenses = trip.expenses.slice(-6).reverse()
      setRecentExpenses(recentExpenses)
      
      // Calculate user balance (simplified for now)
      const username = localStorage.getItem('snapTab_username') || "You"
      const userPaid = trip.expenses.filter(exp => exp.paidBy === username).reduce((sum, exp) => sum + exp.amount, 0)
      const userOwes = trip.expenses.length > 0 ? trip.totalExpenses / trip.members.length : 0
      setUserBalance(userPaid - userOwes)
      
    } catch (error) {
      console.error('Failed to load trip from database:', error)
      // Fallback to localStorage
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    // Load data from localStorage as fallback
    const trip = getActiveTrip()
    if (trip) {
      setActiveTrip(trip)
      
      // Get recent expenses for this trip
      const recent = getRecentExpenses(trip.id, 6)
      setRecentExpenses(recent)
      
      // Calculate user balance
      const balance = getUserBalance(trip.id, "You")
      setUserBalance(balance)
    }
    
    setIsLoading(false)
  }

  // Load trips when profile tab is active
  useEffect(() => {
    if (activeTab === 'profile') {
      loadUserTrips()
    }
  }, [activeTab])

  const loadUserTrips = async () => {
    setIsTripsLoading(true)
    try {
      const username = localStorage.getItem('snapTab_username')
      if (!username) {
        // No username, fallback to localStorage trips
        const localTrips = getTrips()
        setTrips(localTrips)
        return
      }

      // Try to load trips from database
      const response = await fetch(`/api/trips?username=${encodeURIComponent(username)}`)
      if (response.ok) {
        const data = await response.json()
        
        // Convert database trips to our Trip interface
        const dbTrips = data.trips.map((trip: any) => ({
          id: trip.id,
          name: trip.name,
          members: [], // We'll need member info if we want to show it
          totalExpenses: 0, // We'll need to calculate this
          currency: trip.currency,
          startDate: undefined,
          endDate: undefined,
          isActive: trip.is_active,
          createdAt: trip.created_at,
          expenses: [],
          tripCode: trip.trip_code // Include trip code for database trips
        }))
        
        setTrips(dbTrips)
      } else {
        // Database query failed, fallback to localStorage
        console.warn('Failed to load trips from database, using localStorage fallback')
        const localTrips = getTrips()
        setTrips(localTrips)
      }
    } catch (error) {
      console.error('Error loading user trips:', error)
      // Fallback to localStorage trips
      const localTrips = getTrips()
      setTrips(localTrips)
    } finally {
      setIsTripsLoading(false)
    }
  }

  const handleScanClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setError(null)
    setTerminalLogs([])
    setCurrentLogIndex(0)

    // Create realistic terminal logs
    const logs = [
      { text: 'API called, checking environment...', type: 'info' as const },
      { text: 'Processing form data...', type: 'info' as const },
      { text: `File received: ${file.name} ${file.type} ${file.size}`, type: 'success' as const },
      { text: 'OpenAI API key found, initializing client...', type: 'info' as const },
      { text: 'OpenAI client initialized successfully', type: 'success' as const },
      { text: 'Converting file to base64...', type: 'warning' as const },
      { text: 'File converted, calling OpenAI API...', type: 'info' as const },
      { text: 'Calling OpenAI API with timeout...', type: 'warning' as const },
      { text: 'OpenAI API response received', type: 'success' as const },
      { text: 'OpenAI response content: {', type: 'data' as const },
      { text: '  "merchantName": "...",', type: 'data' as const },
      { text: '  "total": 0.00,', type: 'data' as const },
      { text: '  "currency": "USD",', type: 'data' as const },
      { text: '  "category": "...",', type: 'data' as const },
      { text: '  "summary": "...",', type: 'data' as const },
      { text: '  "emoji": "...",', type: 'data' as const },
      { text: '  "items": [...],', type: 'data' as const },
      { text: '}', type: 'data' as const },
      { text: 'Successfully parsed receipt data', type: 'success' as const },
    ]

    // Simulate progressive log display
    const displayLogs = () => {
      for (let i = 0; i < logs.length; i++) {
        setTimeout(() => {
          setTerminalLogs(prev => [...prev, logs[i]])
          setCurrentLogIndex(i + 1)
        }, i * 200) // 200ms delay between each log
      }
    }

    displayLogs()

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
      // Add a small delay to show the final logs
      setTimeout(() => {
        setIsScanning(false)
      }, logs.length * 200 + 500)
      
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
      
      // Add category, summary and emoji if available
      if (scannedData.category) {
        params.set('category', scannedData.category)
      }
      if (scannedData.summary) {
        params.set('summary', scannedData.summary)
      }
      if (scannedData.emoji) {
        params.set('emoji', scannedData.emoji)
      }
      
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
    setTerminalLogs([])
    setCurrentLogIndex(0)
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

  // Updated function to navigate to expense details page
  const handleExpenseClick = (expense: Expense) => {
    window.location.href = `/expense-details/${expense.id}`
  }

  // Trip helper functions
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate && !endDate) return "No dates set"
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const startMonth = start.toLocaleDateString("en-US", { month: "short" })
      const endMonth = end.toLocaleDateString("en-US", { month: "short" })

      if (startMonth === endMonth) {
        return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
      }
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`
    }
    
    if (startDate) {
      const start = new Date(startDate)
      return `From ${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    }
    
    if (endDate) {
      const end = new Date(endDate)
      return `Until ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    }
    
    return "No dates set"
  }

  const handleTripSelect = (tripId: string) => {
    const selectedTrip = trips.find(trip => trip.id === tripId)
    
    if (selectedTrip?.tripCode) {
      // This is a database trip - set the trip code in localStorage
      localStorage.setItem('snapTab_currentTripCode', selectedTrip.tripCode.toString())
    } else {
      // This is a localStorage trip - use the old method
      const updatedTrips = trips.map(trip => ({
        ...trip,
        isActive: trip.id === tripId
      }))
      
      setTrips(updatedTrips)
      saveTrips(updatedTrips)
      
      // Clear any database trip code since we're using localStorage trip
      localStorage.removeItem('snapTab_currentTripCode')
    }
    
    // Switch to home tab and refresh data
    setActiveTab('home')
    window.location.reload()
  }

  const getTripStatus = (trip: Trip) => {
    if (trip.isActive) return "active"
    if (trip.endDate && new Date(trip.endDate) < new Date()) return "completed"
    return "upcoming"
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
            <h1 className="text-2xl font-medium text-foreground">Welcome</h1>
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
     {/* Full-screen loading overlay */}
      {isScanning && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
          {/* Terminal Background - Full Screen */}
          <div className="absolute inset-0 font-mono text-sm overflow-hidden blur-sm">
            <div className="bg-black/90 h-full overflow-y-auto p-6">
              <div className="text-green-400 mb-2 flex items-center">
                <span className="text-gray-500 mr-2">$</span>
                <span>snaptab-receipt-scanner</span>
              </div>
              {terminalLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 opacity-80 ${
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    log.type === 'data' ? 'text-blue-300' :
                    'text-gray-300'
                  }`}
                >
                  {log.text}
                </div>
              ))}
              {currentLogIndex < terminalLogs.length && (
                <div className="text-green-400 animate-pulse inline-block">█</div>
              )}
            </div>
          </div>
          
          {/* Loading indicator overlay */}
          <div className="relative z-10 text-center bg-background/90 backdrop-blur-sm rounded-lg p-8 border border-border shadow-2xl">
            <div className="text-center space-y-6">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Analyzing Receipt...</p>
                <p className="text-sm text-muted-foreground">AI is extracting receipt details</p>
              </div>
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
                {scannedData.summary && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Summary</span>
                    <span className="font-medium capitalize">{scannedData.summary}</span>
                  </div>
                )}
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

      {/* Clean Header - Only show on home tab */}
      {activeTab === 'home' && (
        <header className="p-6 pt-16 safe-area-top">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium text-foreground">{activeTrip.name}</h1>
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
      )}



      {/* Main Content */}
      <main className={`flex-1 px-6 pb-24 overflow-y-auto ${activeTab === 'profile' ? 'pt-4 safe-area-top' : ''}`}>
        {activeTab === 'home' && (
          <>
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
                  <div 
                    key={expense.id} 
                    className="cursor-pointer hover:opacity-80 transition-all duration-200 shadow-sm text-card-foreground rounded-lg border-2"
                    style={getCategoryColor(expense.category || 'food')}
                    onClick={() => handleExpenseClick(expense)}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground text-lg mb-1">
                            {expense.summary || expense.description}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {expense.paidBy} • {formatTimeAgo(expense.createdAt)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-medium">
                            {getCurrencySymbol(activeTrip.currency)}{expense.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Split {expense.splitWith.length} ways
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* User Profile Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="w-40 h-40 bg-muted/50 rounded-full flex flex-col items-center justify-center mx-auto">
                  <User className="h-16 w-16 text-muted-foreground/60 mb-2" />
                  <p className="text-muted-foreground text-xs">Add profile<br/>picture</p>
                </div>
                <div className="absolute bottom-3 right-3 w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium text-foreground">@test</h3>
            </div>

            {/* Your Trips Section */}
            <div>
              <h2 className="text-lg font-medium mb-4">Your Trips</h2>
              
              {isTripsLoading ? (
                <Card className="minimal-card">
                  <CardContent className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading trips...</p>
                  </CardContent>
                </Card>
              ) : trips.length === 0 ? (
                <Card className="minimal-card">
                  <CardContent className="p-6 text-center">
                    <div className="py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No trips yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first trip to start tracking expenses with friends
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => {
                    const userBalance = getUserBalance(trip.id, "You")
                    const status = getTripStatus(trip)
                    
                    return (
                      <Card
                        key={trip.id}
                        className={`minimal-card cursor-pointer transition-all duration-200 ${
                          trip.isActive ? "ring-2 ring-primary/30 bg-primary/5" : "hover:bg-card/80"
                        }`}
                        onClick={() => handleTripSelect(trip.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-medium">{trip.name}</h3>
                                {trip.isActive && (
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-xs text-green-400 font-medium">ACTIVE</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>{trip.members.length} members</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Total Spent</p>
                                  <p className="font-medium">
                                    {getCurrencySymbol(trip.currency)}{trip.totalExpenses.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Your Balance</p>
                                  <p className={`font-medium ${userBalance < 0 ? "text-red-400" : "text-green-400"}`}>
                                    {userBalance < 0 ? "-" : "+"}
                                    {getCurrencySymbol(trip.currency)}{Math.abs(userBalance).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                status === "active" ? "bg-green-400" : 
                                status === "completed" ? "bg-gray-400" : "bg-blue-400"
                              }`}></div>
                              <span className="text-sm text-muted-foreground capitalize">{status}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {trip.expenses.length > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  {trip.expenses.length} expense{trip.expenses.length > 1 ? 's' : ''}
                                </span>
                              )}
                              {!trip.isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleTripSelect(trip.id)
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Select
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
              
              {/* Add New Trip Button */}
              <div className="mt-6">
                <Button
                  onClick={() => (window.location.href = "/create-trip")}
                  className="w-full h-12 bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/95 hover:via-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Trip
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
        <div className="bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="flex items-center justify-around py-2 px-4">
            {/* Home Tab */}
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 p-3 h-auto ${
                activeTab === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('home')}
            >
              <Home className="h-6 w-6" />
              <span className="text-xs">Home</span>
            </Button>

            {/* Camera/Plus Tab - Larger circular button */}
            <Button
              className="h-16 w-16 bg-gradient-to-br from-primary via-primary to-primary/80 hover:from-primary/95 hover:via-primary/90 hover:to-primary/70 text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
              onClick={handleScanClick}
              disabled={isScanning}
            >
              <Plus className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
            </Button>

            {/* Profile Tab */}
            <Button
              variant="ghost"
              className={`flex flex-col items-center gap-1 p-3 h-auto ${
                activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="h-6 w-6" />
              <span className="text-xs">Profile</span>
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
