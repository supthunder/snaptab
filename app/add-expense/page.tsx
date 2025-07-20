"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Check, ChevronRight, Users, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getActiveTrip, addExpenseToTrip, type Trip, type ReceiptItem, type ItemAssignment } from "@/lib/data"

export default function AddExpensePage() {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paidBy: "You",
    category: "",
    summary: "",
    emoji: "",
  })

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null)
  const [splitMode, setSplitMode] = useState<'even' | 'items'>('even')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [itemAssignments, setItemAssignments] = useState<ItemAssignment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Item assignment flow state
  const [showItemFlow, setShowItemFlow] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0: select items, 1: assign person
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [availableItems, setAvailableItems] = useState<number[]>([])

  useEffect(() => {
    const loadTripData = async () => {
      // Check if we have a trip code from onboarding
      const tripCode = localStorage.getItem('snapTab_currentTripCode')
      
      if (tripCode) {
        // Load trip data from database
        try {
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
            totalExpenses: tripData.expenses?.reduce((sum: number, expense: any) => sum + expense.total_amount, 0) || 0,
            currency: tripData.trip.currency || 'USD',
            startDate: undefined,
            endDate: undefined,
            isActive: tripData.trip.is_active || false,
            createdAt: tripData.trip.created_at,
            expenses: []
          }
          
          setActiveTrip(trip)
          setSelectedMembers(trip.members) // Default to all members
          
        } catch (error) {
          console.error('Failed to load trip from database:', error)
          // Fallback to localStorage
          loadFromLocalStorage()
        }
      } else {
        // Fallback to localStorage
        loadFromLocalStorage()
      }
    }

    const loadFromLocalStorage = () => {
      // Load active trip data from localStorage as fallback
      const trip = getActiveTrip()
      if (trip) {
        setActiveTrip(trip)
        setSelectedMembers(trip.members) // Default to all members
      }
    }

    loadTripData()

    // Handle URL parameters from scanned receipts
    const urlParams = new URLSearchParams(window.location.search)
    const amount = urlParams.get("amount")
    const merchant = urlParams.get("merchant")
    const date = urlParams.get("date")
    const category = urlParams.get("category")
    const summary = urlParams.get("summary")
    const emoji = urlParams.get("emoji")
    const itemsParam = urlParams.get("items")
    const receiptImageUrlParam = urlParams.get("receiptImageUrl")

    if (amount || merchant || date) {
      setFormData((prev) => ({
        ...prev,
        amount: amount || prev.amount,
        description: merchant || prev.description, // Use merchant name as description
        date: date || prev.date,
        category: category || prev.category,
        summary: summary || prev.summary,
        emoji: emoji || prev.emoji,
      }))
    }

    // Parse items from URL if available
    if (itemsParam) {
      try {
        const items = JSON.parse(itemsParam)
        setReceiptItems(items)
        setAvailableItems(items.map((_: ReceiptItem, index: number) => index))
      } catch (error) {
        console.error('Failed to parse items:', error)
      }
    }

    // Set receipt image URL if available
    if (receiptImageUrlParam) {
      setReceiptImageUrl(receiptImageUrlParam)
    }
  }, [])

  const handleMemberToggle = (member: string) => {
    if (member === "You") return // User always included

    setSelectedMembers((prev) => 
      prev.includes(member) 
        ? prev.filter((m) => m !== member) 
        : [...prev, member]
    )
  }

  const handleSplitModeChange = (mode: 'even' | 'items') => {
    setSplitMode(mode)
    if (mode === 'items' && receiptItems.length > 0) {
      // Reset item assignments when switching to items mode
      setItemAssignments([])
      // Automatically start item assignment flow
      startItemAssignment()
    }
  }

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
      
      assignment.assignedTo.forEach(person => {
        if (memberTotals[person] !== undefined) {
          memberTotals[person] += splitAmount
        }
      })
    })

    return memberTotals
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!activeTrip) {
      alert("No active trip found. Please create or select a trip first.")
      return
    }

    setIsSubmitting(true)

    try {
      // Check if we have a trip code from onboarding
      const tripCode = localStorage.getItem('snapTab_currentTripCode')
      const username = localStorage.getItem('snapTab_username')
      
      if (tripCode && username) {
        // Save expense to database
        const expenseData = {
          name: formData.description,
          description: formData.description,
          merchant_name: formData.description, // This will store the merchant name from the receipt
          total_amount: parseFloat(formData.amount),
          currency: activeTrip.currency,
          receipt_image_url: receiptImageUrl,
          expense_date: formData.date,
          paid_by_username: username,
          split_with_usernames: selectedMembers,
          split_mode: splitMode,
          category: formData.category || undefined,
          summary: formData.summary || undefined,
          emoji: formData.emoji || undefined,
          items: receiptItems.length > 0 ? receiptItems.map((item, index) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            item_order: index
          })) : []
        }

        const response = await fetch(`/api/trips/${tripCode}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save expense')
        }

        // Navigate back to home (no popup needed)
        window.location.href = "/"
        
      } else {
        // Fallback to localStorage
        const expenseData = {
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date,
          paidBy: formData.paidBy,
          splitWith: selectedMembers,
          // Category and visual
          category: formData.category || undefined,
          summary: formData.summary || undefined,
          emoji: formData.emoji || undefined,
          // Item-level details
          items: receiptItems.length > 0 ? receiptItems : undefined,
          itemAssignments: itemAssignments.length > 0 ? itemAssignments : undefined,
          splitMode: splitMode,
        }

        await addExpenseToTrip(activeTrip.id, expenseData)
        
        // Navigate back to home (no popup needed)
        window.location.href = "/"
      }
      
    } catch (error) {
      console.error("Error saving expense:", error)
      alert("Failed to save expense. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const splitAmount = parseFloat(formData.amount) / selectedMembers.length || 0
  const itemBasedTotals = splitMode === 'items' ? calculateItemBasedSplit() : {}

  if (!activeTrip) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="p-6 pt-16 safe-area-top flex items-center">
          <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Add Expense</h1>
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
                  <h3 className="font-medium mb-4">Items</h3>
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
                              {activeTrip.currency} {Number(item.price || 0).toFixed(2)}
                            </span>
                            {isAssigned && assignment && assignment.assignedTo.length > 1 && (
                              <div className="text-xs text-muted-foreground">
                                {activeTrip.currency} {(Number(item.price || 0) / assignment.assignedTo.length).toFixed(2)} each
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
                                  {assignments.length} item{assignments.length > 1 ? 's' : ''} • {activeTrip.currency}{Number(totalCost || 0).toFixed(2)}
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
                                  {assignment.item.name} {activeTrip.currency}{Number(assignment.cost || 0).toFixed(2)}
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
      <header className="p-6 pt-16 safe-area-top flex items-center">
        <Button variant="ghost" size="icon" className="mr-4" onClick={() => {
          // If we're in items mode and have assignments, go back to even mode first
          if (splitMode === 'items' && itemAssignments.length > 0) {
            setSplitMode('even')
            setItemAssignments([])
            setAvailableItems(receiptItems.map((_: ReceiptItem, index: number) => index))
          } else {
            window.history.back()
          }
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-medium">Add Expense</h1>
          <p className="text-sm text-muted-foreground">{activeTrip.name}</p>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <Card className="minimal-card">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="description" className="text-muted-foreground text-sm">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="What was this for?"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 bg-background border-border rounded-xl h-12"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-muted-foreground text-sm">
                    Amount ({activeTrip.currency})
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="mt-2 bg-background border-border rounded-xl h-12"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-muted-foreground text-sm">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="mt-2 bg-background border-border rounded-xl h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paidBy" className="text-muted-foreground text-sm">
                  Paid by
                </Label>
                <select
                  id="paidBy"
                  value={formData.paidBy}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paidBy: e.target.value }))}
                  className="mt-2 w-full bg-background border border-border rounded-xl h-12 px-4"
                  required
                >
                  {activeTrip.members.map((member, index) => (
                    <option key={`${member}-${index}`} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Split Mode Toggle */}
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
          {splitMode === 'even' && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Split between</h3>
                <div className="space-y-3">
                  {activeTrip.members.map((member, index) => (
                    <div
                      key={`${member}-${index}`}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                        selectedMembers.includes(member)
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-background border border-border"
                      } ${member === "You" ? "opacity-100" : ""}`}
                      onClick={() => handleMemberToggle(member)}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedMembers.includes(member) ? "border-primary bg-primary" : "border-muted-foreground"
                          }`}
                        >
                          {selectedMembers.includes(member) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="font-medium">{member}</span>
                      </div>
                      {selectedMembers.includes(member) && formData.amount && (
                        <span className="text-primary font-medium">{activeTrip.currency} {splitAmount.toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>

                {formData.amount && (
                  <div className="mt-4 p-4 bg-background rounded-xl border border-border">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Total amount</span>
                      <span className="font-medium">{activeTrip.currency} {parseFloat(formData.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Split {selectedMembers.length} ways</span>
                      <span className="font-medium text-primary">{activeTrip.currency} {splitAmount.toFixed(2)} each</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Split Between - Items Mode */}
          {splitMode === 'items' && (
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
                    {Object.entries(itemBasedTotals).map(([member, total]) => (
                      <div
                        key={member}
                        className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20"
                      >
                        <span className="font-medium">{member}</span>
                        <span className="text-primary font-medium">{activeTrip.currency} {total.toFixed(2)}</span>
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
        </form>
      </main>

      {/* Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
        <div className="p-8 bg-gradient-to-t from-background via-background/98 to-background/80 backdrop-blur-sm">
          <div className="max-w-md mx-auto">
            <Button
              type="submit"
              className="w-full h-16 bg-primary hover:bg-primary/90 text-lg font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={!formData.description || !formData.amount || selectedMembers.length === 0 || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Adding..." : "Add Expense"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
