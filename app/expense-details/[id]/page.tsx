"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Edit2, Save, Trash2, Calculator, Users, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  total_amount: any // Database may return string or number
  currency: string
  receipt_image_url?: string
  expense_date: string
  paid_by: string
  paid_by_username?: string
  paid_by_display_name?: string
  split_with: string[]
  split_with_users?: Array<{
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }>
  split_mode: 'even' | 'items'
  category: string
  summary: string
  emoji: string
  tax_amount: any // Database may return string or number
  tip_amount: any // Database may return string or number
  confidence: number
  created_at: string
  updated_at: string
  is_settled?: boolean
  settled_at?: string
  settled_by_user_id?: string
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
  const [splitMode, setSplitMode] = useState<'even' | 'items'>('even')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [tripMembers, setTripMembers] = useState<string[]>([])
  const [receiptItems, setReceiptItems] = useState<any[]>([])
  const [itemAssignments, setItemAssignments] = useState<any[]>([])
  
  // Item assignment flow state
  const [showItemFlow, setShowItemFlow] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0: select items, 1: assign person
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [availableItems, setAvailableItems] = useState<number[]>([])
  const [isSettled, setIsSettled] = useState(false)

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
          
          // Set split mode and members
          setSplitMode(fetchedExpense.split_mode || 'even')
          setSelectedMembers(fetchedExpense.split_with_users?.map((u: any) => u.username) || [])
          setReceiptItems(fetchedExpense.items || [])
          setAvailableItems((fetchedExpense.items || []).map((_: any, index: number) => index))
          setIsSettled(fetchedExpense.is_settled || false)

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

  const handleSplitModeChange = (mode: 'even' | 'items') => {
    setSplitMode(mode)
  }

  const handleMemberToggle = (member: string) => {
    setSelectedMembers(prev => 
      prev.includes(member) 
        ? prev.filter(m => m !== member)
        : [...prev, member]
    )
  }

  const splitAmount = selectedMembers.length > 0 ? parseFloat(editForm.amount || '0') / selectedMembers.length : 0
  
  // Item assignment functions
  const startItemAssignment = () => {
    setShowItemFlow(true)
    setCurrentStep(0)
    setSelectedItems([])
  }

  const handleItemSelection = (itemIndex: number) => {
    setSelectedItems(prev => 
      prev.includes(itemIndex) 
        ? prev.filter(i => i !== itemIndex)
        : [...prev, itemIndex]
    )
  }

  const handlePersonSelection = (person: string) => {
    setSelectedPeople(prev => 
      prev.includes(person) 
        ? prev.filter(p => p !== person)
        : [...prev, person]
    )
  }

  const proceedToPersonSelection = () => {
    if (selectedItems.length > 0) {
      setCurrentStep(1)
      setSelectedPeople([]) // Reset person selection
    }
  }

  const assignItemsToSelectedPeople = () => {
    if (selectedPeople.length === 0) return

    setItemAssignments(prev => {
      const updatedAssignments = [...prev]
      
      selectedItems.forEach(itemIndex => {
        // Check if this item already has an assignment
        const existingAssignmentIndex = updatedAssignments.findIndex(
          assignment => assignment.itemIndex === itemIndex
        )
        
        if (existingAssignmentIndex !== -1) {
          // Item already assigned - add selected people to existing assignment (avoid duplicates)
          const existingAssignment = updatedAssignments[existingAssignmentIndex]
          const newPeople = selectedPeople.filter(person => !existingAssignment.assignedTo.includes(person))
          if (newPeople.length > 0) {
            updatedAssignments[existingAssignmentIndex] = {
              ...existingAssignment,
              assignedTo: [...existingAssignment.assignedTo, ...newPeople]
            }
          }
        } else {
          // Item not assigned yet - create new assignment
          updatedAssignments.push({
            itemIndex,
            assignedTo: [...selectedPeople]
          })
        }
      })
      
      return updatedAssignments
    })

    // Reset selections and go back to item selection
    setSelectedItems([])
    setSelectedPeople([])
    setCurrentStep(0)
  }

  const getPersonAssignments = (person: string) => {
    return itemAssignments
      .filter(assignment => assignment.assignedTo.includes(person))
      .map(assignment => ({
        item: receiptItems[assignment.itemIndex],
        cost: receiptItems[assignment.itemIndex].price / assignment.assignedTo.length,
        shared: assignment.assignedTo.length > 1
      }))
  }

  const finishItemAssignment = () => {
    setShowItemFlow(false)
    setCurrentStep(0)
    setSelectedItems([])
    setSelectedPeople([])
  }

  const selectRemainingItems = () => {
    // Get all unassigned item indices
    const unassignedItems = receiptItems
      .map((_, index) => index)
      .filter(itemIndex => !itemAssignments.find(a => a.itemIndex === itemIndex))
    
    // Add unassigned items to selection (avoid duplicates)
    setSelectedItems(prev => {
      const combined = [...prev, ...unassignedItems]
      return Array.from(new Set(combined))
    })
  }

  const calculateItemBasedSplit = () => {
    const memberTotals: { [key: string]: number } = {}
    
    // Initialize all members with 0
    selectedMembers.forEach(member => {
      memberTotals[member] = 0
    })

    // Calculate totals based on item assignments
    itemAssignments.forEach(assignment => {
      const item = receiptItems[assignment.itemIndex]
      const splitAmount = item.price / assignment.assignedTo.length
      
      assignment.assignedTo.forEach((person: string) => {
        if (memberTotals[person] !== undefined) {
          memberTotals[person] += splitAmount
        }
      })
    })

    return memberTotals
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
      const updateData = {
        name: editForm.description,
        description: editForm.description,
        merchant_name: expense.merchant_name, // Keep existing merchant name
        total_amount: parseFloat(editForm.amount),
        currency: expense.currency, // Keep existing currency
        expense_date: editForm.date,
        paid_by_username: editForm.paidBy,
        split_mode: splitMode,
        category: expense.category,
        summary: expense.summary,
        emoji: expense.emoji,
        tax_amount: expense.tax_amount,
        tip_amount: expense.tip_amount,
        confidence: expense.confidence,
        item_assignments: splitMode === 'items' ? itemAssignments : undefined
      }
      
      console.log('Saving expense with data:', updateData)
      
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update expense')
      }
      
      const result = await response.json()
      
      // Update local state with the updated expense
      if (result.expense) {
        setExpense(result.expense)
      }
      
      setIsEditing(false)
      
      // Refresh the page to show updated data
      window.location.reload()
      
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
      // Call the API to delete the expense
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete expense')
      }

      // Successfully deleted - navigate back to home
      window.location.href = "/"
      
    } catch (error) {
      console.error('Failed to delete expense:', error)
      alert('Failed to delete expense. Please try again.')
    }
  }

  const handlePaymentStatusChange = async (isPaid: boolean) => {
    if (!expense) return
    
    try {
      const currentUsername = localStorage.getItem('snapTab_currentUsername')
      if (!currentUsername) {
        alert('Please log in to update payment status')
        return
      }

      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPaid,
          markedByUsername: currentUsername
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update payment status')
      }
      
      const result = await response.json()
      
      // Update local state
      setIsSettled(isPaid)
      
      // Update expense data if returned
      if (result.expense) {
        setExpense(result.expense)
      }
      
      // Show success message
      alert(`Expense marked as ${isPaid ? 'paid' : 'unpaid'}`)
      
    } catch (error) {
      console.error('Failed to update payment status:', error)
      alert('Failed to update payment status. Please try again.')
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

  // Item assignment flow overlay
  if (showItemFlow) {
    const handleBackFromItemFlow = () => {
      if (currentStep === 1) {
        // Go back to item selection step
        setCurrentStep(0)
        setSelectedItems([])
        setSelectedPeople([])
      } else {
        // Go back to main form
        setShowItemFlow(false)
        setCurrentStep(0)
        setSelectedItems([])
        setSelectedPeople([])
      }
    }

    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="p-6 pt-16 safe-area-top flex items-center">
          <Button variant="ghost" size="icon" className="mr-4" onClick={handleBackFromItemFlow}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-medium">
              {currentStep === 0 ? 'Select Items' : 'Assign To'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentStep === 0 ? 'Choose items to assign' : 'Who got these items?'}
            </p>
          </div>
        </header>

        <main className="flex-1 px-6 pb-32 overflow-y-auto">
          {currentStep === 0 && (
            <div className="space-y-4">
              {/* All Items - with assigned items grayed out */}
              <Card className="minimal-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Items</h3>
                    {receiptItems.some((_, index) => !itemAssignments.find(a => a.itemIndex === index)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectRemainingItems}
                        className="text-xs"
                      >
                        Select Remaining
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {receiptItems.map((item, itemIndex) => {
                      const assignment = itemAssignments.find(a => a.itemIndex === itemIndex)
                      const isAssigned = !!assignment
                      return (
                        <div
                          key={itemIndex}
                          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                            selectedItems.includes(itemIndex)
                              ? "bg-primary/10 border border-primary/20"
                              : "bg-background border border-border"
                          } ${isAssigned ? "opacity-60" : ""}`}
                          onClick={() => handleItemSelection(itemIndex)}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedItems.includes(itemIndex) ? "border-primary bg-primary" : "border-muted-foreground"
                              }`}
                            >
                              {selectedItems.includes(itemIndex) && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div>
                              <span className={`font-medium ${isAssigned ? "text-muted-foreground" : ""}`}>
                                {item.name}
                              </span>
                              {item.quantity && (
                                <span className="text-sm text-muted-foreground ml-2">×{item.quantity}</span>
                              )}
                              {isAssigned && assignment && (
                                <div className="text-xs text-muted-foreground">
                                  Assigned to: {assignment.assignedTo.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-medium ${isAssigned ? "text-muted-foreground" : "text-primary"}`}>
                              {trip?.currency} {Number(item.price || 0).toFixed(2)}
                            </span>
                            {isAssigned && assignment && assignment.assignedTo.length > 1 && (
                              <div className="text-xs text-muted-foreground">
                                {trip?.currency} {(Number(item.price || 0) / assignment.assignedTo.length).toFixed(2)} each
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 1 && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Select People</h3>
                <div className="space-y-4">
                  {selectedMembers.map((member) => {
                    const assignments = getPersonAssignments(member)
                    const totalCost = assignments.reduce((sum, a) => sum + a.cost, 0)
                    
                    return (
                      <div
                        key={member}
                        className={`p-4 rounded-xl cursor-pointer transition-colors border ${
                          selectedPeople.includes(member)
                            ? "bg-primary/10 border-primary/20"
                            : "bg-background border-border hover:bg-primary/5"
                        }`}
                        onClick={() => handlePersonSelection(member)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedPeople.includes(member) ? "border-primary bg-primary" : "border-muted-foreground"
                              }`}
                            >
                              {selectedPeople.includes(member) && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div>
                              <span className="font-medium">{member}</span>
                              {assignments.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {assignments.length} item{assignments.length > 1 ? 's' : ''} • {trip?.currency}{Number(totalCost || 0).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Compact assignment summary */}
                        {assignments.length > 0 && (
                          <div className="mt-3 pl-8">
                            <div className="flex flex-wrap gap-1">
                              {assignments.map((assignment, index) => (
                                <span
                                  key={index}
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                    assignment.shared 
                                      ? "bg-orange-100 text-orange-700 border border-orange-200" 
                                      : "bg-blue-100 text-blue-700 border border-blue-200"
                                  }`}
                                >
                                  {assignment.item.name} {trip?.currency}{Number(assignment.cost || 0).toFixed(2)}
                                  {assignment.shared && (
                                    <Users className="h-3 w-3 ml-1" />
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
          <div className="p-8 bg-gradient-to-t from-background via-background/98 to-background/80 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              {currentStep === 0 && (
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={finishItemAssignment}
                  >
                    Done
                  </Button>
                  <Button
                    className="flex-1 h-16 bg-primary hover:bg-primary/90 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={selectedItems.length === 0}
                    onClick={proceedToPersonSelection}
                  >
                    Assign ({selectedItems.length})
                  </Button>
                </div>
              )}
              {currentStep === 1 && (
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setCurrentStep(0)}
                  >
                    Back to Items
                  </Button>
                  <Button
                    className="flex-1 h-16 bg-primary hover:bg-primary/90 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={selectedPeople.length === 0}
                    onClick={assignItemsToSelectedPeople}
                  >
                    Assign to {selectedPeople.length || 0}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
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
                  {getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{Number(expense.total_amount || 0).toFixed(2)}
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
                  {(isEditing ? splitMode : expense.split_mode) === 'items' && receiptItems.length > 0 ? 
                    `Split by ${receiptItems.length} item${receiptItems.length > 1 ? 's' : ''}` : 
                    'Split evenly'
                  }
                </p>
              </div>
              
              {/* Split Details */}
              {(expense.split_with_users && expense.split_with_users.length > 0) || (expense.split_with && expense.split_with.length > 0) && (
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Split between:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {expense.split_with_users ? expense.split_with_users.map((user, index) => (
                      <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {user.username}
                      </span>
                    )) : expense.split_with.map((person, index) => (
                      <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                        {person}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{(Number(expense.total_amount || 0) / (expense.split_with_users?.length || expense.split_with.length)).toFixed(2)} each
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
                    <Label htmlFor="paidBy" className="text-muted-foreground text-sm">
                      Paid by
                    </Label>
                    <select
                      id="paidBy"
                      value={editForm.paidBy}
                      onChange={(e) => setEditForm({...editForm, paidBy: e.target.value})}
                      className="mt-2 w-full bg-background border border-border rounded-xl h-12 px-4"
                      required
                    >
                      {expense.split_with_users?.map((user: any, index: number) => (
                        <option key={`${user.username}-${index}`} value={user.username}>
                          {user.username}
                        </option>
                      ))}
                    </select>
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

          {/* Split Mode Edit - Only show when editing */}
          {isEditing && (
            <>
              {/* Split Method Toggle */}
              {receiptItems.length > 0 && (
                <Card className="minimal-card">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4">Split Method</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={splitMode === 'even' ? 'default' : 'outline'}
                        className="h-12 rounded-xl flex items-center justify-center space-x-2"
                        onClick={() => handleSplitModeChange('even')}
                      >
                        <Calculator className="h-4 w-4" />
                        <span>Split Evenly</span>
                      </Button>
                      <Button
                        type="button"
                        variant={splitMode === 'items' ? 'default' : 'outline'}
                        className="h-12 rounded-xl flex items-center justify-center space-x-2"
                        onClick={() => handleSplitModeChange('items')}
                      >
                        <Users className="h-4 w-4" />
                        <span>Split by Items</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Split Between - Even Mode */}
              {splitMode === 'even' && trip && (
                <Card className="minimal-card">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4">Split between</h3>
                    <div className="space-y-3">
                      {expense.split_with_users?.map((user: any, index: number) => (
                        <div
                          key={`${user.username}-${index}`}
                          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                            selectedMembers.includes(user.username)
                              ? "bg-primary/10 border border-primary/20"
                              : "bg-background border border-border"
                          }`}
                          onClick={() => handleMemberToggle(user.username)}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedMembers.includes(user.username) ? "border-primary bg-primary" : "border-muted-foreground"
                              }`}
                            >
                              {selectedMembers.includes(user.username) && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span className="font-medium">{user.username}</span>
                          </div>
                          {selectedMembers.includes(user.username) && editForm.amount && (
                            <span className="text-primary font-medium">{trip.currency} {splitAmount.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {editForm.amount && (
                      <div className="mt-4 p-4 bg-background rounded-xl border border-border">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Total amount</span>
                          <span className="font-medium">{trip.currency} {parseFloat(editForm.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Split {selectedMembers.length} ways</span>
                          <span className="font-medium text-primary">{trip.currency} {splitAmount.toFixed(2)} each</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Split by Items Mode */}
              {splitMode === 'items' && receiptItems.length > 0 && (
                <Card className="minimal-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Split by Items</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startItemAssignment}
                        className="rounded-xl"
                      >
                        Assign Items
                      </Button>
                    </div>

                    {/* Show current assignments */}
                    {itemAssignments.length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(calculateItemBasedSplit()).map(([member, total]) => (
                          <div
                            key={member}
                            className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20"
                          >
                            <span className="font-medium">{member}</span>
                            <span className="text-primary font-medium">{trip?.currency} {Number(total).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-2">No items assigned yet</p>
                        <p className="text-sm">Tap "Assign Items" to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Item Assignments (if available) */}
          {expense.items && expense.items.length > 0 && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">
                  {(isEditing ? splitMode : expense.split_mode) === 'even' ? 'Split Evenly' : 'Item Assignments'}
                </h3>
                <div className="space-y-4">
                  {(() => {
                    const assignmentsByPerson: Record<string, Array<{item: any, cost: number, shared: boolean}>> = {}
                    
                    if ((isEditing ? splitMode : expense.split_mode) === 'even') {
                      // Even split: divide all items equally among split_with users
                      const splitUsers = expense.split_with_users || []
                      const numPeople = splitUsers.length
                      
                      if (numPeople > 0) {
                        splitUsers.forEach((user: any) => {
                          const personName = user.username
                          assignmentsByPerson[personName] = []
                          
                          expense.items.forEach((item: any) => {
                            const itemCost = Number(item.price || 0) / numPeople
                            assignmentsByPerson[personName].push({
                              item: { ...item, originalPrice: Number(item.price || 0) },
                              cost: itemCost,
                              shared: numPeople > 1
                            })
                          })
                        })
                      }
                    } else {
                      // Items mode: use current item assignments when editing, otherwise use database data
                      if (isEditing && itemAssignments.length > 0) {
                        // Use current editing state
                        receiptItems.forEach((item: any, itemIndex: number) => {
                          const assignment = itemAssignments.find(a => a.itemIndex === itemIndex)
                          
                          if (assignment && assignment.assignedTo.length > 0) {
                            assignment.assignedTo.forEach((personName: string) => {
                              const itemCost = Number(item.price || 0) / assignment.assignedTo.length
                              const isShared = assignment.assignedTo.length > 1
                              
                              if (!assignmentsByPerson[personName]) {
                                assignmentsByPerson[personName] = []
                              }
                              
                              assignmentsByPerson[personName].push({
                                item: { ...item, originalPrice: Number(item.price || 0) },
                                cost: itemCost,
                                shared: isShared
                              })
                            })
                          } else {
                            // Unassigned items in edit mode
                            if (!assignmentsByPerson['Unassigned']) {
                              assignmentsByPerson['Unassigned'] = []
                            }
                            assignmentsByPerson['Unassigned'].push({
                              item: { ...item, originalPrice: Number(item.price || 0) },
                              cost: Number(item.price || 0),
                              shared: false
                            })
                          }
                        })
                      } else {
                        // Use database data for saved assignments
                        expense.items.forEach((item: any) => {
                          if (item.assignments && item.assignments.length > 0) {
                            item.assignments.forEach((assignee: any) => {
                              const personName = assignee.username
                              const itemCost = Number(item.price || 0) / item.assignments.length
                              const isShared = item.assignments.length > 1
                              
                              if (!assignmentsByPerson[personName]) {
                                assignmentsByPerson[personName] = []
                              }
                              
                              assignmentsByPerson[personName].push({
                                item: { ...item, originalPrice: Number(item.price || 0) },
                                cost: itemCost,
                                shared: isShared
                              })
                            })
                          } else {
                            // Unassigned items from database
                            if (!assignmentsByPerson['Unassigned']) {
                              assignmentsByPerson['Unassigned'] = []
                            }
                            assignmentsByPerson['Unassigned'].push({
                              item: { ...item, originalPrice: Number(item.price || 0) },
                              cost: Number(item.price || 0),
                              shared: false
                            })
                          }
                        })
                      }
                    }

                    // Show split mode description for even split
                    const currentSplitMode = isEditing ? splitMode : expense.split_mode
                    const splitDescription = currentSplitMode === 'even' && expense.split_with_users 
                      ? `${expense.split_with_users.length}-way split` 
                      : null

                    return (
                      <>
                        {splitDescription && (
                          <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg text-center">
                            {splitDescription} • Each person pays an equal share of all items
                          </div>
                        )}
                        
                        {Object.entries(assignmentsByPerson).map(([personName, assignments]) => {
                          const totalCost = assignments.reduce((sum, assignment) => sum + assignment.cost, 0)
                          
                          return (
                            <div 
                              key={personName}
                              className="p-4 rounded-xl border border-border bg-background"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <span className="font-medium">{personName}</span>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {assignments.length} item{assignments.length > 1 ? 's' : ''} • {getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{totalCost.toFixed(2)}
                      </div>
                        </div>
                          </div>
                              
                              {/* Item pills */}
                              <div className="flex flex-wrap gap-1">
                                {assignments.map((assignment, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                      assignment.shared 
                                        ? "bg-orange-100 text-orange-700 border border-orange-200" 
                                        : "bg-blue-100 text-blue-700 border border-blue-200"
                                    }`}
                                  >
                                    {assignment.item.name} {getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{assignment.cost.toFixed(2)}
                                    {assignment.shared && (
                                      <span className="ml-1 text-orange-500">👥</span>
                                    )}
                                  </span>
                                ))}
                      </div>
                    </div>
                          )
                        })}
                      </>
                    )
                  })()}
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
                
                {expense.tax_amount && Number(expense.tax_amount) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{Number(expense.tax_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                
                {expense.tip_amount && Number(expense.tip_amount) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="font-medium">{getCurrencySymbol(expense.currency || trip?.currency || 'USD')}{Number(expense.tip_amount || 0).toFixed(2)}</span>
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

          {/* Payment Status */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Payment Status</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isSettled ? 'This expense has been marked as paid' : 'Mark this expense as paid when settled'}
                  </p>
                </div>
                <Switch
                  checked={isSettled}
                  onCheckedChange={handlePaymentStatusChange}
                />
              </div>
              {isSettled && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✅ This expense is marked as settled and won't appear in balance calculations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipt Image */}
          {expense.receipt_image_url && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Receipt</h3>
                <div className="w-full">
                  <img 
                    src={expense.receipt_image_url} 
                    alt="Receipt" 
                    className="w-full h-auto rounded-lg border border-border shadow-sm"
                    style={{ maxHeight: '600px', objectFit: 'contain' }}
                    onLoad={(e) => {
                      console.log('Receipt image loaded successfully')
                    }}
                    onError={(e) => {
                      console.error('Failed to load receipt image:', expense.receipt_image_url)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 