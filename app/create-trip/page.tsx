"use client"

import { useState } from "react"
import { ArrowLeft, Calendar, Users, Coins, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateTripPage() {
  const [formData, setFormData] = useState({
    name: "",
    currency: "USD",
    startDate: "",
    endDate: ""
  })

  const [members, setMembers] = useState<string[]>([])
  const [newMember, setNewMember] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currencies = [
    { value: "USD", label: "USD ($)", flag: "🇺🇸" },
    { value: "EUR", label: "EUR (€)", flag: "🇪🇺" },
    { value: "GBP", label: "GBP (£)", flag: "🇬🇧" },
    { value: "JPY", label: "JPY (¥)", flag: "🇯🇵" },
    { value: "CAD", label: "CAD ($)", flag: "🇨🇦" },
    { value: "AUD", label: "AUD ($)", flag: "🇦🇺" }
  ]

  const addMember = () => {
    if (newMember.trim() && !members.includes(newMember.trim())) {
      setMembers([...members, newMember.trim()])
      setNewMember("")
    }
  }

  const removeMember = (member: string) => {
    setMembers(members.filter(m => m !== member))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Get username from localStorage
      const username = localStorage.getItem('snapTab_username')
      const displayName = localStorage.getItem('snapTab_displayName')
      
      if (!username) {
        throw new Error('No username found. Please complete onboarding first.')
      }

      // First, create/ensure the user exists in the database
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          displayName: displayName || username
        })
      })

      if (!userResponse.ok) {
        throw new Error('Failed to create user')
      }

      // Create the trip in the database
      const tripResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          currency: formData.currency,
          username: username
        })
      })

      if (!tripResponse.ok) {
        const errorData = await tripResponse.json()
        throw new Error(errorData.error || 'Failed to create trip')
      }

      const tripData = await tripResponse.json()
      
      // Store the trip code in localStorage so other parts of the app can find it
      localStorage.setItem('snapTab_currentTripCode', tripData.tripCode.toString())
      
      // TODO: If we want to invite other members, we'll need to implement that
      // For now, just the creator is added to the trip
      
      // Navigate back to home
      window.location.href = "/"
      
    } catch (error) {
      console.error("Error creating trip:", error)
      setError(error instanceof Error ? error.message : "Failed to create trip. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = formData.name.length >= 3

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-6 pt-16 safe-area-top">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Create New Trip</h1>
        </div>
      </header>

      <main className="flex-1 px-6 pb-24 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Name */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <Label htmlFor="trip-name" className="text-foreground mb-3 flex items-center">
                <span className="mr-2">🗺️</span>
                Trip Name
              </Label>
              <Input
                id="trip-name"
                type="text"
                placeholder="e.g., Tokyo Adventure 2024"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-card border-border text-foreground"
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                This will be shared with your group members
              </p>
            </CardContent>
          </Card>

          {/* Currency */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <Label className="text-foreground mb-3 flex items-center">
                <Coins className="h-4 w-4 mr-2" />
                Base Currency
              </Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.flag} {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                All expenses will be tracked in this currency
              </p>
            </CardContent>
          </Card>

          {/* Dates (Optional) */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <Label className="text-foreground mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Trip Dates (Optional)
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm text-muted-foreground mb-1 block">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm text-muted-foreground mb-1 block">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-card border-border text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Code Preview */}
          <Card className="minimal-card">
            <CardContent className="p-6 text-center">
              <h3 className="text-foreground font-semibold mb-2">Trip Code</h3>
              <div className="text-3xl font-bold text-primary mb-1">###</div>
              <p className="text-muted-foreground text-sm">
                A unique 3-digit code will be generated for your friends to join
              </p>
            </CardContent>
          </Card>

          {error && (
            <Card className="minimal-card border-destructive">
              <CardContent className="p-4">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Trip...
              </>
            ) : (
              "Create Trip"
            )}
          </Button>
        </form>
      </main>
    </div>
  )
} 