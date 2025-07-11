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
    emoji: "",
  })

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([])
  const [splitMode, setSplitMode] = useState<'even' | 'items'>('even')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [itemAssignments, setItemAssignments] = useState<ItemAssignment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Item assignment flow state
  const [showItemFlow, setShowItemFlow] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0: select items, 1: assign person
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [availableItems, setAvailableItems] = useState<number[]>([])

  useEffect(() => {
    // Load active trip data
    const trip = getActiveTrip()
    if (trip) {
      setActiveTrip(trip)
      setSelectedMembers(trip.members) // Default to all members
    }

    // Handle URL parameters from scanned receipts
    const urlParams = new URLSearchParams(window.location.search)
    const amount = urlParams.get("amount")
    const merchant = urlParams.get("merchant")
    const date = urlParams.get("date")
    const category = urlParams.get("category")
    const emoji = urlParams.get("emoji")
    const itemsParam = urlParams.get("items")

    if (amount || merchant || date) {
      setFormData((prev) => ({
        ...prev,
        amount: amount || prev.amount,
        description: merchant || prev.description,
        date: date || prev.date,
        category: category || prev.category,
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

  const proceedToPersonSelection = () => {
    if (selectedItems.length > 0) {
      setCurrentStep(1)
    }
  }

  const assignItemsToPerson = (person: string) => {
    // Create new assignments for selected items
    const newAssignments = selectedItems.map(itemIndex => ({
      itemIndex,
      assignedTo: [person]
    }))

    setItemAssignments(prev => {
      // Remove any existing assignments for these items
      const filtered = prev.filter(assignment => 
        !selectedItems.includes(assignment.itemIndex)
      )
      return [...filtered, ...newAssignments]
    })

    // Remove assigned items from available items if they're not shared
    setAvailableItems(prev => 
      prev.filter(itemIndex => !selectedItems.includes(itemIndex))
    )

    // Reset selection and go back to item selection
    setSelectedItems([])
    setCurrentStep(0)

    // If no more items available, close the flow
    if (availableItems.length === selectedItems.length) {
      setShowItemFlow(false)
    }
  }

  const shareItemsWithPerson = (person: string) => {
    // Add person to existing assignments for selected items
    setItemAssignments(prev => 
      prev.map(assignment => {
        if (selectedItems.includes(assignment.itemIndex)) {
          return {
            ...assignment,
            assignedTo: [...assignment.assignedTo, person]
          }
        }
        return assignment
      })
    )

    // Reset selection and go back to item selection
    setSelectedItems([])
    setCurrentStep(0)
  }

  const finishItemAssignment = () => {
    setShowItemFlow(false)
    setCurrentStep(0)
    setSelectedItems([])
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
      // Save expense to the active trip
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        paidBy: formData.paidBy,
        splitWith: selectedMembers,
        // Category and visual
        category: formData.category || undefined,
        emoji: formData.emoji || undefined,
        // Item-level details
        items: receiptItems.length > 0 ? receiptItems : undefined,
        itemAssignments: itemAssignments.length > 0 ? itemAssignments : undefined,
        splitMode: splitMode,
      }

      await addExpenseToTrip(activeTrip.id, expenseData)
      
      // Navigate back to home (no popup needed)
      window.location.href = "/"
      
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
      } else {
        // Go back to main form
        setShowItemFlow(false)
        setCurrentStep(0)
        setSelectedItems([])
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
              {/* Available Items */}
              <Card className="minimal-card">
                <CardContent className="p-6">
                  <h3 className="font-medium mb-4">Available Items</h3>
                  <div className="space-y-3">
                    {availableItems.map((itemIndex) => {
                      const item = receiptItems[itemIndex]
                      return (
                        <div
                          key={itemIndex}
                          className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                            selectedItems.includes(itemIndex)
                              ? "bg-primary/10 border border-primary/20"
                              : "bg-background border border-border"
                          }`}
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
                              <span className="font-medium">{item.name}</span>
                              {item.quantity && (
                                <span className="text-sm text-muted-foreground ml-2">×{item.quantity}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-primary font-medium">{activeTrip.currency} {item.price.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Already Assigned Items */}
              {itemAssignments.length > 0 && (
                <Card className="minimal-card">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4">Already Assigned</h3>
                    <div className="space-y-3">
                      {itemAssignments.map((assignment) => {
                        const item = receiptItems[assignment.itemIndex]
                        return (
                          <div
                            key={assignment.itemIndex}
                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors ${
                              selectedItems.includes(assignment.itemIndex)
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-muted/50 border border-border"
                            }`}
                            onClick={() => handleItemSelection(assignment.itemIndex)}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  selectedItems.includes(assignment.itemIndex) ? "border-primary bg-primary" : "border-muted-foreground"
                                }`}
                              >
                                {selectedItems.includes(assignment.itemIndex) && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <div>
                                <span className="font-medium opacity-75">{item.name}</span>
                                <div className="text-sm text-muted-foreground">
                                  {assignment.assignedTo.join(', ')}
                                </div>
                              </div>
                            </div>
                            <span className="text-muted-foreground font-medium">{activeTrip.currency} {item.price.toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <Card className="minimal-card">
              <CardContent className="p-6">
                {(() => {
                  // Get people who already have ANY items assigned (not just selected items)
                  const alreadyAssignedPeople = new Set<string>()
                  itemAssignments.forEach(assignment => {
                    assignment.assignedTo.forEach(person => alreadyAssignedPeople.add(person))
                  })

                  // Get people who can be assigned (not already assigned to any items)
                  const availablePeople = selectedMembers.filter(member => !alreadyAssignedPeople.has(member))
                  const assignedPeople = selectedMembers.filter(member => alreadyAssignedPeople.has(member))

                  return (
                    <>
                      {/* Available people to assign */}
                      {availablePeople.length > 0 && (
                        <>
                          <h3 className="font-medium mb-4">Assign to Person</h3>
                          <div className="space-y-3 mb-6">
                            {availablePeople.map((member) => (
                              <div
                                key={member}
                                className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors bg-background border border-border hover:bg-primary/5"
                                onClick={() => assignItemsToPerson(member)}
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium">{member}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Already assigned people */}
                      {assignedPeople.length > 0 && (
                        <div className={availablePeople.length > 0 ? "border-t border-border pt-6" : ""}>
                          <h4 className="font-medium mb-3 text-sm text-muted-foreground">Already Assigned</h4>
                          <div className="space-y-2">
                            {assignedPeople.map((member) => (
                              <Button
                                key={member}
                                variant="outline"
                                className="w-full justify-start opacity-60"
                                onClick={() => shareItemsWithPerson(member)}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Add {member} (share cost)
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No one available */}
                      {availablePeople.length === 0 && assignedPeople.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No one available to assign</p>
                        </div>
                      )}
                    </>
                  )
                })()}
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
                <Button
                  variant="outline"
                  className="w-full h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setCurrentStep(0)}
                >
                  Back to Items
                </Button>
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
                  {activeTrip.members.map((member) => (
                    <option key={member} value={member}>
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
                  {activeTrip.members.map((member) => (
                    <div
                      key={member}
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
