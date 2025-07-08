"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CreateTripPage() {
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    currency: "USD",
  })

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Creating trip:", formData)
    alert("Trip created successfully!")
    window.location.href = "/"
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
          <Card className="minimal-card">
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="name" className="text-muted-foreground text-sm">
                  Trip Name
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-muted-foreground text-sm">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="mt-2 bg-background border-border rounded-xl h-12"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-muted-foreground text-sm">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="mt-2 bg-background border-border rounded-xl h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="currency" className="text-muted-foreground text-sm">
                  Base Currency
                </Label>
                <select
                  id="currency"
                  className="w-full mt-2 p-3 bg-background border border-border rounded-xl h-12 text-foreground"
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="minimal-card">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-medium mb-2">Invite Members</h3>
                  <p className="text-sm text-muted-foreground">
                    After creating your trip, you'll get a shareable link to invite friends and family.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto">
        <div className="p-6 bg-background/95 backdrop-blur-sm border-t border-border">
          <Button
            type="submit"
            className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-medium rounded-2xl"
            disabled={!formData.name || !formData.startDate || !formData.endDate}
            onClick={handleSubmit}
          >
            Create Trip
          </Button>
        </div>
      </div>
    </div>
  )
} 