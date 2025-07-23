"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Plus, ArrowRight, Menu, Loader2, Check, AlertCircle, Home, User, Users, Calendar, Trash2, ChevronUp, ChevronDown, Edit3 } from "lucide-react"
import { MembersList, MembersModal } from "@/components/ui/members-list"
import { PullToRefresh } from "@/components/ui/pull-to-refresh"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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
  transactionTime?: string
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
  receiptImageUrl?: string
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
  const [tripsLoaded, setTripsLoaded] = useState(false) // Track if trips have been loaded
  const [userProfile, setUserProfile] = useState<{
    id: string
    username: string
    displayName: string
    avatarUrl?: string
  } | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false) // Track if profile has been loaded
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [tripMembers, setTripMembers] = useState<Array<{
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }>>([])
  const [currentTripCode, setCurrentTripCode] = useState<string | null>(null)
  
  // Balance card expansion state
  const [isBalanceExpanded, setIsBalanceExpanded] = useState(false)
  const [settlementData, setSettlementData] = useState<{
    balances: Array<{
      user_id: string
      username: string 
      display_name?: string
      total_paid: number
      total_owed: number
      net_balance: number
    }>
    transactions: Array<{
      from_user_id: string
      from_username: string
      to_user_id: string
      to_username: string
      amount: number
    }>
  } | null>(null)
  const [isLoadingSettlement, setIsLoadingSettlement] = useState(false)
  const [paidSettlements, setPaidSettlements] = useState<Set<string>>(new Set())
  
  // Venmo username state
  const [venmoUsername, setVenmoUsername] = useState<string | null>(null)
  const [isVenmoDialogOpen, setIsVenmoDialogOpen] = useState(false)
  const [venmoEditValue, setVenmoEditValue] = useState('')
  const [isLoadingVenmo, setIsLoadingVenmo] = useState(false)

  // Load settlement data for balance expansion
  const loadSettlementData = async () => {
    const tripCode = localStorage.getItem('snapTab_currentTripCode')
    if (!tripCode) return

    setIsLoadingSettlement(true)
    try {
      const response = await fetch(`/api/trips/${tripCode}/settlement`)
      if (response.ok) {
        const data = await response.json()
        setSettlementData(data)
      } else {
        console.error('Failed to load settlement data')
      }
    } catch (error) {
      console.error('Error loading settlement data:', error)
    } finally {
      setIsLoadingSettlement(false)
    }
  }

  // Load user's Venmo username
  const loadVenmoUsername = async () => {
    const username = localStorage.getItem('snapTab_username')
    if (!username) return

    try {
      const response = await fetch(`/api/users/venmo?username=${username}`)
      if (response.ok) {
        const data = await response.json()
        setVenmoUsername(data.venmoUsername)
      }
    } catch (error) {
      console.error('Failed to load Venmo username:', error)
    }
  }

  // Handle balance card expansion
  const handleBalanceCardClick = async () => {
    if (!isBalanceExpanded) {
      // Expanding - load settlement data and Venmo username
      await Promise.all([loadSettlementData(), loadVenmoUsername()])
    }
    setIsBalanceExpanded(!isBalanceExpanded)
  }

  // Handle Venmo username save
  const handleSaveVenmoUsername = async () => {
    const username = localStorage.getItem('snapTab_username')
    if (!username) return

    setIsLoadingVenmo(true)
    try {
      const response = await fetch('/api/users/venmo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, venmoUsername: venmoEditValue })
      })

      if (response.ok) {
        const data = await response.json()
        setVenmoUsername(data.venmoUsername)
        setIsVenmoDialogOpen(false)
        setVenmoEditValue('')
      } else {
        console.error('Failed to save Venmo username')
      }
    } catch (error) {
      console.error('Error saving Venmo username:', error)
    } finally {
      setIsLoadingVenmo(false)
    }
  }

  // Handle Venmo username removal
  const handleRemoveVenmoUsername = async () => {
    const username = localStorage.getItem('snapTab_username')
    if (!username) return

    setIsLoadingVenmo(true)
    try {
      const response = await fetch('/api/users/venmo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      if (response.ok) {
        setVenmoUsername(null)
        setIsVenmoDialogOpen(false)
        setVenmoEditValue('')
      } else {
        console.error('Failed to remove Venmo username')
      }
    } catch (error) {
      console.error('Error removing Venmo username:', error)
    } finally {
      setIsLoadingVenmo(false)
    }
  }

  // Handle toggling payment as paid/unpaid
  const handleTogglePaymentPaid = (transactionKey: string) => {
    setPaidSettlements(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionKey)) {
        // If already paid, mark as unpaid
        newSet.delete(transactionKey)
      } else {
        // If not paid, mark as paid
        newSet.add(transactionKey)
      }
      return newSet
    })
    // Here you would also update the backend to track the payment
    // For now, we'll just update the local state
  }

  // Get current user's debts (who they owe money to)
  const getCurrentUserDebts = () => {
    if (!settlementData) return []
    const currentUsername = localStorage.getItem('snapTab_username')
    
    return settlementData.transactions.filter(transaction => 
      transaction.from_username === currentUsername
    ).map(transaction => ({
      to_username: transaction.to_username,
      amount: transaction.amount,
      isPaid: paidSettlements.has(`${transaction.from_username}-${transaction.to_username}-${transaction.amount}`)
    }))
  }

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    try {
      // Reload current trip data without showing loading overlay
      const tripCode = localStorage.getItem('snapTab_currentTripCode')
      if (tripCode) {
        await loadTripFromDatabase(tripCode, true) // Pass true to skip loading overlay
      } else {
        await loadUserTripsAndSetActive(true) // Pass true to skip loading overlay
      }
      
      // Refresh user profile and trips data without resetting loading states
      if (activeTab === 'profile') {
        // Refresh data in background without showing loading indicators
        await loadUserTrips(true) // Pass true to force refresh
        await loadUserProfile(true) // Pass true to force refresh
      }
    } catch (error) {
      console.error('Refresh failed:', error)
    }
  }

  // Check if session is expired (30 days)
  const isSessionExpired = (): boolean => {
    const lastAuth = localStorage.getItem('snapTab_lastAuth')
    if (!lastAuth) return true
    
    const lastAuthTime = parseInt(lastAuth)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    
    return Date.now() - lastAuthTime > thirtyDaysMs
  }

  // Check for first-time user and redirect to onboarding
  useEffect(() => {
    const checkOnboarding = () => {
      const onboardingComplete = localStorage.getItem('snapTab_onboardingComplete')
      const hasUsername = localStorage.getItem('snapTab_username')
      
      // Check if session is expired
      if (hasUsername && onboardingComplete && isSessionExpired()) {
        console.log('🕒 Session expired (30+ days), clearing auth data...')
        // Clear expired session data
        localStorage.removeItem('snapTab_onboardingComplete')
        localStorage.removeItem('snapTab_username')
        localStorage.removeItem('snapTab_displayName')
        localStorage.removeItem('snapTab_currentTripCode')
        localStorage.removeItem('snapTab_currentTripId')
        localStorage.removeItem('snapTab_lastAuth')
        
        // Redirect to onboarding
        window.location.href = '/onboarding'
        return
      }
      
      // If onboarding is not complete and user doesn't have username, redirect to onboarding
      if (!onboardingComplete && !hasUsername) {
        window.location.href = '/onboarding'
        return
      }
      
      // If returning from onboarding, check if we have trip data
      if (onboardingComplete && hasUsername) {
        const tripCode = localStorage.getItem('snapTab_currentTripCode')
        if (tripCode) {
          setCurrentTripCode(tripCode)
          // Load specific trip data from database and user profile
          Promise.all([
            loadTripFromDatabase(tripCode),
            loadUserProfile()
          ])
        } else {
          // No specific trip code, load user's trips and set most recent as active
          loadUserTripsAndSetActive()
        }
      } else {
        // No onboarding data, load from localStorage fallback
        loadFromLocalStorage()
      }
    }

    checkOnboarding()
  }, [])

  const loadUserTripsAndSetActive = async (skipLoadingIndicator = false) => {
    try {
      if (!skipLoadingIndicator) {
        setIsLoading(true)
      }
      const username = localStorage.getItem('snapTab_username')
      if (!username) {
        console.warn('No username found, falling back to localStorage')
        loadFromLocalStorage()
        return
      }

      // Load all user trips from database
      const response = await fetch(`/api/trips?username=${encodeURIComponent(username)}`)
      if (!response.ok) {
        console.warn('Failed to load trips from database, using localStorage fallback')
        loadFromLocalStorage()
        return
      }

      const data = await response.json()
      if (!data.trips || data.trips.length === 0) {
        console.log('No trips found for user, using localStorage fallback')
        loadFromLocalStorage()
        return
      }

      // Find the most recent trip (we'll determine active status based on expenses when loaded)
      const sortedTrips = data.trips.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const activeTrip = sortedTrips[0] // Just use the most recent trip
      
      if (activeTrip) {
        // Set as current trip and save to localStorage for future use
        localStorage.setItem('snapTab_currentTripCode', activeTrip.trip_code.toString())
        setCurrentTripCode(activeTrip.trip_code.toString())
        
        // Load full trip data and user profile in parallel
        await Promise.all([
          loadTripFromDatabase(activeTrip.trip_code.toString(), skipLoadingIndicator),
          loadUserProfile()
        ])
      } else {
        console.warn('No active trip found, falling back to localStorage')
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Error loading user trips:', error)
      loadFromLocalStorage()
    }
  }

  const loadTripFromDatabase = async (tripCode: string, skipLoadingIndicator = false) => {
    try {
      if (!skipLoadingIndicator) {
        setIsLoading(true)
      }
      
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
        members: tripData.members?.map((member: any) => member.username) || [],
        totalExpenses: tripData.expenses?.reduce((sum: number, expense: any) => sum + parseFloat(expense.total_amount || 0), 0) || 0,
        currency: tripData.trip.currency || 'USD',
        startDate: undefined,
        endDate: undefined,
        isActive: (tripData.expenses && tripData.expenses.length > 0) || false, // Only active if has expenses
        createdAt: tripData.trip.created_at,
        expenses: tripData.expenses?.map((expense: any) => ({
          id: expense.id,
          tripId: expense.trip_id,
          description: expense.name,
          merchantName: expense.merchant_name,
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
        })) || [],
        tripCode: parseInt(tripCode),
        createdBy: tripData.trip.created_by // Include creator ID
      }
      
      setActiveTrip(trip)
      
      // Set trip members for the members list component
      setTripMembers(tripData.members || [])
      
      // Get recent expenses - sort by created date descending (newest first)
      const sortedExpenses = trip.expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      const recentExpenses = sortedExpenses.slice(0, 6) // Take first 6 (newest)
      setRecentExpenses(recentExpenses)
      
      // Calculate user balance using API endpoint
      const username = localStorage.getItem('snapTab_username') || "You"
      
      // Use database-aware balance calculation if we have a trip code
      if (tripData.trip.trip_code) {
        try {
          const balanceResponse = await fetch(`/api/trips/${tripData.trip.trip_code}/balance?username=${encodeURIComponent(username)}`)
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json()
            setUserBalance(balanceData.balance)
          } else {
            throw new Error('Failed to fetch balance from API')
          }
        } catch (error) {
          console.error('API balance calculation failed, using fallback:', error)
          // Fallback to simple calculation
          const userPaid = trip.expenses.filter(exp => exp.paidBy === username).reduce((sum, exp) => sum + exp.amount, 0)
          const userOwes = trip.expenses.length > 0 ? (trip.totalExpenses / (tripData.members?.length || 1)) : 0
          setUserBalance(userPaid - userOwes)
        }
      } else {
        // Fallback to simple calculation for trips without codes
        setUserBalance(0)
      }
      
    } catch (error) {
      console.error('Failed to load trip from database:', error)
      // Fallback to localStorage
      loadFromLocalStorage()
    } finally {
      if (!skipLoadingIndicator) {
        setIsLoading(false)
      }
    }
  }

  const loadFromLocalStorage = () => {
    // Load data from localStorage as fallback
    const trip = getActiveTrip()
    if (trip) {
      setActiveTrip(trip)
      
      // Get recent expenses for this trip - sorted by newest first
      const allExpenses = getRecentExpenses(trip.id, 1000) // Get all expenses first
      const sortedExpenses = allExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      const recent = sortedExpenses.slice(0, 6) // Take first 6 (newest)
      setRecentExpenses(recent)
      
      // Calculate user balance
              const username = localStorage.getItem('snapTab_username') || "You"
        
        // Check if this is a database trip (has tripCode) or localStorage trip
        if (trip.tripCode) {
          // Database trip - use API balance calculation with fallback
          fetch(`/api/trips/${trip.tripCode}/balance?username=${encodeURIComponent(username)}`)
            .then(response => response.json())
            .then(data => {
              setUserBalance(data.balance)
            })
            .catch(error => {
              console.error('Failed to calculate API balance, using localStorage fallback:', error)
              // Fallback to localStorage calculation
              const balance = getUserBalance(trip.id, username)
              setUserBalance(balance)
            })
        } else {
          // localStorage trip - use localStorage balance calculation
          const balance = getUserBalance(trip.id, username)
          setUserBalance(balance)
        }
    }
    
    setIsLoading(false)
  }

  // Load trips when profile tab is active - only if not already loaded
  useEffect(() => {
    if (activeTab === 'profile') {
      if (!tripsLoaded) {
        loadUserTrips()
      }
      if (!profileLoaded) {
        loadUserProfile()
      }
    }
  }, [activeTab, tripsLoaded, profileLoaded])

  const loadUserTrips = async (forceRefresh = false) => {
    // Only show loading indicator if this is not a refresh (to prevent blinking)
    if (!forceRefresh) {
      setIsTripsLoading(true)
    }
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
        
        // Fetch full details for each trip including members and expenses
        const dbTripsWithDetails = await Promise.all(data.trips.map(async (trip: any) => {
          try {
            const tripResponse = await fetch(`/api/trips/${trip.trip_code}`)
            if (tripResponse.ok) {
              const tripDetails = await tripResponse.json()
              
              // Calculate total expenses
              const totalExpenses = tripDetails.expenses?.reduce((sum: number, expense: any) => 
                sum + parseFloat(expense.total_amount || 0), 0) || 0
              
              // Check if trip has expenses (active status)
              const hasExpenses = tripDetails.expenses && tripDetails.expenses.length > 0
              
              return {
                id: trip.id,
                name: trip.name,
                members: tripDetails.members?.map((member: any) => member.username) || [],
                totalExpenses,
                currency: trip.currency,
                startDate: undefined,
                endDate: undefined,
                isActive: hasExpenses,
                createdAt: trip.created_at,
                expenses: tripDetails.expenses?.map((expense: any) => ({
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
                })) || [],
                tripCode: trip.trip_code,
                createdBy: tripDetails.trip?.created_by // Include creator ID
              }
            } else {
              // Fallback to basic trip info if detailed fetch fails
              return {
                id: trip.id,
                name: trip.name,
                members: [],
                totalExpenses: 0,
                currency: trip.currency,
                startDate: undefined,
                endDate: undefined,
                isActive: false,
                createdAt: trip.created_at,
                expenses: [],
                tripCode: trip.trip_code
              }
            }
          } catch (error) {
            console.error(`Error fetching details for trip ${trip.trip_code}:`, error)
            // Return basic trip info on error
            return {
              id: trip.id,
              name: trip.name,
              members: [],
              totalExpenses: 0,
              currency: trip.currency,
              startDate: undefined,
              endDate: undefined,
              isActive: false,
              createdAt: trip.created_at,
              expenses: [],
              tripCode: trip.trip_code
            }
          }
        }))
        
        setTrips(dbTripsWithDetails)
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
      // Only update loading state if we showed the loading indicator
      if (!forceRefresh) {
        setIsTripsLoading(false)
      }
      setTripsLoaded(true) // Mark as loaded
    }
  }

  const loadUserProfile = async (forceRefresh = false) => {
    try {
      const username = localStorage.getItem('snapTab_username')
      const displayName = localStorage.getItem('snapTab_displayName')
      
      if (!username) return

      // Try to load user data from database to get avatar URL
      try {
        const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`)
        
        if (response.ok) {
          const data = await response.json()
          setUserProfile({
            id: data.user?.id,
            username,
            displayName: displayName || username,
            avatarUrl: data.user?.avatar_url
          })
        } else {
          // Fallback: we don't have user ID, so create a temporary one
          setUserProfile({
            id: '', // Empty ID means we can't check ownership
            username,
            displayName: displayName || username
          })
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
        // Fallback: we don't have user ID, so create a temporary one
        setUserProfile({
          id: '', // Empty ID means we can't check ownership
          username,
          displayName: displayName || username
        })
      }
      
      // Mark as loaded
      setProfileLoaded(true)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleAvatarClick = () => {
    profileInputRef.current?.click()
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userProfile?.username) return

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('username', userProfile.username)

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(prev => prev ? {
          ...prev,
          avatarUrl: data.avatarUrl
        } : null)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to upload profile picture')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload profile picture')
    } finally {
      setIsUploadingAvatar(false)
      // Clear the input so the same file can be selected again
      if (profileInputRef.current) {
        profileInputRef.current.value = ''
      }
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
      
      // Add receipt image URL if available  
      if (scannedData.receiptImageUrl) {
        params.set('receiptImageUrl', scannedData.receiptImageUrl)
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

  const formatReceiptTime = (expenseDate: string, createdAt: string) => {
    const now = new Date()
    const creationDate = new Date(createdAt)
    
    // Calculate days difference based on when it was SCANNED (createdAt), not receipt date
    const daysDiff = Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Get time string (for when it was scanned)
    const timeString = creationDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }).toLowerCase()
    
    if (daysDiff === 0) {
      // Today - show "today • 1:15pm"
      return `today • ${timeString}`
    } else if (daysDiff <= 7) {
      // Within a week - show day name and time "monday • 1:15pm"
      const dayName = creationDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      return `${dayName} • ${timeString}`
    } else {
      // Beyond a week - show date (no year) and time "7/11 • 1:15pm"
      const dateString = creationDate.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric'
      })
      return `${dateString} • ${timeString}`
    }
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
    // Trip is only active if it has expenses
    const hasExpenses = trip.expenses && trip.expenses.length > 0
    if (hasExpenses) return "active"
    if (trip.endDate && new Date(trip.endDate) < new Date()) return "completed"
    return "upcoming"
  }

  const handleDeleteTrip = async (trip: Trip, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card selection
    
    const username = localStorage.getItem('snapTab_username')
    if (!username) {
      alert('You must be logged in to delete trips')
      return
    }

    // Check if user is the creator (we'll let the API handle this check)
    // The API will verify the user is the creator by comparing user IDs

    // The API will check if trip has expenses and authorization

    // Confirm deletion
    const confirmed = confirm(`Are you sure you want to delete "${trip.name}"? This action cannot be undone.`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/trips/${trip.tripCode}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      if (response.ok) {
        // Remove trip from local state
        const updatedTrips = trips.filter(t => t.id !== trip.id)
        setTrips(updatedTrips)
        
        // Show success message
        console.log(`✅ Trip "${trip.name}" deleted successfully`)
        
        // If this was the active trip, switch to home tab
        if (activeTrip?.id === trip.id) {
          setActiveTab('home')
          window.location.reload()
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete trip')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip. Please try again.')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTrip) return
    
    // Safety check: prevent removal if trip has expenses
    if (activeTrip.expenses && activeTrip.expenses.length > 0) {
      alert('Cannot remove members from trips with expenses. Members involved in expense splitting cannot be removed to maintain data integrity.')
      return
    }
    
    // Find the member to show confirmation with their name
    const member = tripMembers.find(m => m.id === memberId)
          const memberName = member?.username || 'this member'
    
    // Confirm removal
    const confirmed = window.confirm(`Are you sure you want to remove ${memberName} from this trip? This cannot be undone.`)
    if (!confirmed) return

    try {
      // Get current trip code from localStorage
      const tripCode = localStorage.getItem('snapTab_currentTripCode')
      if (!tripCode) {
        alert('Error: Could not find trip information')
        return
      }

      const response = await fetch(`/api/trips/${tripCode}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: memberId }),
      })

      if (response.ok) {
        // Update local state by removing the member
        setTripMembers(prev => prev.filter(m => m.id !== memberId))
        
        // Update active trip members count
        if (activeTrip) {
          setActiveTrip(prev => prev ? {
            ...prev,
            members: prev.members.filter(name => {
              const memberToRemove = tripMembers.find(m => m.id === memberId)
              return name !== memberToRemove?.username
            })
          } : null)
        }
        
        alert(`${memberName} has been removed from the trip`)
      } else {
        const errorData = await response.json()
        alert(`Failed to remove member: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member. Please try again.')
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
      <PullToRefresh onRefresh={handleRefresh}>
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
                                  <Button onClick={() => window.location.href = "/add-trip"} className="w-full">
                  Add New Trip
                  </Button>
                  <Button onClick={() => window.location.href = "/trips"} variant="secondary" className="w-full">
                    View Saved Trips
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </PullToRefresh>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
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

      {/* Trip Code in top right corner - positioned absolutely */}
      {activeTab === 'home' && currentTripCode && (
        <div className="absolute top-6 right-6 z-10" style={{paddingTop: 'env(safe-area-inset-top)'}}>
          <div className="text-sm text-muted-foreground">
            Trip #{currentTripCode}
          </div>
        </div>
      )}

      {/* Clean Header - Only show on home tab */}
      {activeTab === 'home' && (
        <header className="p-6 pt-16 safe-area-top">
          <div className="flex justify-center items-center mb-8 w-full">
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl font-medium text-foreground">{activeTrip.name}</h1>
            </div>
          </div>

          {/* Balance Card - Animated Expansion */}
          <Card 
            className={`minimal-card mb-6 transition-all duration-300 ease-out ${
              isBalanceExpanded ? 'shadow-lg' : 'hover:shadow-md'
            }`}
          >
            <CardContent className="p-6">
              {/* Balance Section - Clickable Header */}
              <div 
                className="text-center mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleBalanceCardClick}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <p className="text-muted-foreground text-sm">Your balance to pay</p>
                  {isBalanceExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="text-4xl font-bold">
                  <span className={userBalance < 0 ? "text-red-400" : "text-muted-foreground"}>
                    {getCurrencySymbol(activeTrip.currency)}
                    {userBalance < 0 ? Math.abs(Number(userBalance || 0)).toFixed(2) : "0.00"}
                  </span>
                </div>
              </div>

              {/* Expanded Settlement Details */}
              <div 
                className={`transition-all duration-300 ease-out overflow-hidden ${
                  isBalanceExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {isLoadingSettlement ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Loading settlement details...</p>
                  </div>
                ) : (
                  <div className="border-t border-border pt-6 mt-6">
                    {/* Venmo Username Section */}
                    <div className="flex items-center justify-center gap-2 mb-6 pb-4 border-b border-border">
                      <div className="flex items-center gap-2">
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 48 48" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z" 
                            fill="#3D95CE"
                            stroke="#3D95CE"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-foreground font-medium">
                          {venmoUsername || localStorage.getItem('snapTab_username')}
                        </span>
                      </div>
                      
                      <Dialog open={isVenmoDialogOpen} onOpenChange={setIsVenmoDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-primary/10"
                            onClick={() => {
                              setVenmoEditValue(venmoUsername || '')
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Set Venmo Username</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Venmo Username</label>
                              <Input
                                value={venmoEditValue}
                                onChange={(e) => setVenmoEditValue(e.target.value)}
                                placeholder="Enter your Venmo username"
                                className="mt-1"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                This will be used for payment requests. Leave empty to use your main username.
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={handleSaveVenmoUsername}
                                disabled={isLoadingVenmo}
                                className="flex-1"
                              >
                                {isLoadingVenmo ? 'Saving...' : 'Save'}
                              </Button>
                              {venmoUsername && (
                                <Button
                                  variant="outline"
                                  onClick={handleRemoveVenmoUsername}
                                  disabled={isLoadingVenmo}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <h3 className="font-medium text-lg mb-4 text-center">Settlement Details</h3>
                    
                    {getCurrentUserDebts().length === 0 ? (
                      <div className="text-center py-4">
                        <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">You're all settled up! 🎉</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getCurrentUserDebts().map((debt, index) => {
                          const transactionKey = `${localStorage.getItem('snapTab_username')}-${debt.to_username}-${debt.amount}`
                          const currentUsername = localStorage.getItem('snapTab_username') || 'user'
                          
                          // Create Venmo deeplink - pay to the person they owe
                          const venmoNote = `${activeTrip.name} - paid with SnapTab`
                          const venmoLink = `venmo://paycharge?txn=pay&recipients=${debt.to_username}&note=${encodeURIComponent(venmoNote)}&amount=${debt.amount.toFixed(2)}`
                          
                          return (
                            <div 
                              key={transactionKey}
                              className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                debt.isPaid 
                                  ? 'bg-green-900/20 border-green-700/30 opacity-75' 
                                  : 'bg-card border-border hover:bg-card/80'
                              }`}
                              style={{
                                animationDelay: `${index * 50}ms`
                              }}
                              onClick={() => handleTogglePaymentPaid(transactionKey)}
                            >
                              <div className="flex items-center space-x-3">
                                {/* Avatar placeholder */}
                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-primary">
                                    {debt.to_username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                
                                <div>
                                  <p className={`font-medium ${debt.isPaid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    Pay {debt.to_username}
                                  </p>
                                  {debt.isPaid && (
                                    <p className="text-sm text-muted-foreground">
                                      Marked as paid
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <p className={`text-lg font-semibold ${
                                    debt.isPaid ? 'line-through text-muted-foreground' : 'text-red-400'
                                  }`}>
                                    {getCurrencySymbol(activeTrip.currency)}{debt.amount.toFixed(2)}
                                  </p>
                                </div>
                                
                                {debt.isPaid ? (
                                  <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                ) : (
                                  <a
                                    href={venmoLink}
                                    className="flex items-center justify-center w-8 h-8 bg-[#3D95CE] hover:bg-[#2d7bb8] rounded-lg transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                    }}
                                  >
                                    <svg 
                                      width="20" 
                                      height="20" 
                                      viewBox="0 0 48 48" 
                                      fill="none" 
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path 
                                        d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z" 
                                        fill="white"
                                        stroke="white"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row: Total + Members + Edit - Only show when collapsed */}
              <div className={`transition-all duration-300 ${
                isBalanceExpanded ? 'opacity-0 max-h-0 overflow-hidden' : 'opacity-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground text-lg">Total: {getCurrencySymbol(activeTrip.currency)}{Number(activeTrip.totalExpenses || 0).toFixed(2)}</p>
                  </div>

                  <MembersList 
                    members={tripMembers}
                    maxVisible={3}
                    onEditClick={(e) => {
                      e?.stopPropagation()
                      setIsMembersModalOpen(true)
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </div>
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
                            {(expense as any).merchantName || expense.summary || expense.description}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {expense.paidBy} • {formatReceiptTime(expense.date, expense.createdAt)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-medium">
                            {getCurrencySymbol(activeTrip.currency)}{Number(expense.amount || 0).toFixed(2)}
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
            {/* Logout Button - Top Right */}
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log('🚪 Manual logout - clearing all auth data...')
                  // Clear all authentication data
                  localStorage.removeItem('snapTab_onboardingComplete')
                  localStorage.removeItem('snapTab_username')
                  localStorage.removeItem('snapTab_displayName')
                  localStorage.removeItem('snapTab_currentTripCode')
                  localStorage.removeItem('snapTab_currentTripId')
                  localStorage.removeItem('snapTab_lastAuth')
                  
                  // Redirect to onboarding
                  window.location.href = '/onboarding'
                }}
                className="text-muted-foreground hover:text-red-500 transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </div>
            {/* User Profile Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="w-40 h-40 bg-muted/50 rounded-full flex flex-col items-center justify-center mx-auto overflow-hidden group hover:bg-muted/70 transition-colors"
                >
                  {userProfile?.avatarUrl ? (
                    <img 
                      src={userProfile.avatarUrl} 
                      alt="Profile picture" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <User className="h-16 w-16 text-muted-foreground/60 mb-2" />
                      <p className="text-muted-foreground text-xs">Add profile<br/>picture</p>
                    </>
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </button>
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-3 right-3 w-8 h-8 bg-foreground rounded-full flex items-center justify-center hover:bg-foreground/90 transition-colors"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-4 w-4 text-background animate-spin" />
                  ) : (
                    <svg className="h-4 w-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  )}
                </button>
              </div>
              <h3 className="text-xl font-medium text-foreground">
                @{userProfile?.username || 'loading...'}
              </h3>
            </div>

            {/* Your Trips Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Your Trips</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/add-trip")}
                  className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
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
                        Create or join a trip to start tracking expenses with friends
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip) => {
                    const userBalance = getUserBalance(trip.id, "You")
                    const status = getTripStatus(trip)
                    const hasExpenses = trip.expenses && trip.expenses.length > 0
                    
                    return (
                      <Card
                        key={trip.id}
                        className={`minimal-card cursor-pointer transition-all duration-200 relative ${
                          hasExpenses ? "ring-2 ring-primary/30 bg-primary/5" : "hover:bg-card/80"
                        }`}
                        onClick={() => handleTripSelect(trip.id)}
                      >
                        {/* Delete Icon - Only show for trips created by current user */}
                        {trip.tripCode && trip.createdBy && userProfile?.id && trip.createdBy === userProfile.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/20 z-10"
                            onClick={(e) => handleDeleteTrip(trip, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-medium">{trip.name}</h3>
                                {hasExpenses && (
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
                                    {getCurrencySymbol(trip.currency)}{Number(trip.totalExpenses || 0).toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Balance to Pay</p>
                                  <p className={`font-medium ${userBalance < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                                    {getCurrencySymbol(trip.currency)}
                                    {userBalance < 0 ? Math.abs(Number(userBalance || 0)).toFixed(2) : "0.00"}
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
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

      {/* Hidden file input for profile picture upload */}
      <input 
        ref={profileInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleAvatarUpload} 
      />

      {/* Members Modal */}
      <MembersModal
        members={tripMembers}
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        canEdit={true}
        onRemoveMember={handleRemoveMember}
        hasExpenses={(activeTrip?.expenses?.length ?? 0) > 0}
        expenseCount={activeTrip?.expenses?.length ?? 0}
      />
    </div>
    </PullToRefresh>
  )
}
