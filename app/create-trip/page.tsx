"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Users, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getTrips, saveTrips, type Trip } from "@/lib/data"

export default function CreateTripPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    currency: "USD",
  })

  const [members, setMembers] = useState<string[]>(["You"])
  const [newMember, setNewMember] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  ]

  const handleAddMember = () => {
    if (newMember.trim() && !members.includes(newMember.trim())) {
      setMembers([...members, newMember.trim()])
      setNewMember("")
    }
  }

  const handleRemoveMember = (memberToRemove: string) => {
    if (memberToRemove !== "You") {
      setMembers(members.filter(member => member !== memberToRemove))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get existing trips and set all as inactive
      const existingTrips = getTrips()
      const updatedTrips = existingTrips.map(trip => ({ ...trip, isActive: false }))

      // Create new trip
      const newTrip: Trip = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: formData.name,
        members: members,
        totalExpenses: 0,
        currency: formData.currency,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        isActive: true, // Set as active trip
        createdAt: new Date().toISOString(),
        expenses: []
      }

      // Save all trips (existing + new)
      saveTrips([...updatedTrips, newTrip])

      // Navigate back to home (no popup needed)
      window.location.href = "/"
      
    } catch (error) {
      console.error("Error creating trip:", error)
      alert("Failed to create trip. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-6 pt-16">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Create Trip</h1>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details */}
          <Card className="minimal-card">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="name" className="text-muted-foreground text-sm">
                  Trip Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Tokyo Adventure"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2 bg-background border-border rounded-xl h-12"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-muted-foreground text-sm">
                  Description (optional)
                </Label>
                <Input
                  id="description"
                  placeholder="Brief description of your trip"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2 bg-background border-border rounded-xl h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-muted-foreground text-sm">
                    Start Date (optional)
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="mt-2 bg-background border-border rounded-xl h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-muted-foreground text-sm">
                    End Date (optional)
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="mt-2 bg-background border-border rounded-xl h-12"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currency" className="text-muted-foreground text-sm">
                  Currency
                </Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                  className="mt-2 w-full bg-background border border-border rounded-xl h-12 px-4"
                  required
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 mr-2 text-primary" />
                <h3 className="font-medium">Trip Members</h3>
              </div>

              {/* Current Members */}
              <div className="space-y-2 mb-4">
                {members.map((member) => (
                  <div
                    key={member}
                    className="flex items-center justify-between p-3 bg-background rounded-xl border border-border"
                  >
                    <span className="font-medium">{member}</span>
                    {member !== "You" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Member */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add member name"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMember())}
                  className="flex-1 bg-background border-border rounded-xl h-12"
                />
                <Button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!newMember.trim() || members.includes(newMember.trim())}
                  className="h-12 px-6 rounded-xl"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-3">
                You can add more members later and invite them to join the trip.
              </p>
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 safe-area-bottom">
        <div className="p-8 bg-gradient-to-t from-background via-background/98 to-background/80 backdrop-blur-sm">
          <div className="max-w-md mx-auto">
            <Button
              type="submit"
              className="w-full h-16 bg-primary hover:bg-primary/90 text-lg font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={!formData.name.trim() || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Creating..." : "Create Trip"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 