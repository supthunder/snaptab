"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Users, Calendar, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getTrips, saveTrips, getUserBalance, type Trip } from "@/lib/data"

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load real trips from localStorage
    const loadedTrips = getTrips()
    setTrips(loadedTrips)
    setIsLoading(false)
  }, [])

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
    // Set selected trip as active and others as inactive
    const updatedTrips = trips.map(trip => ({
      ...trip,
      isActive: trip.id === tripId
    }))
    
    setTrips(updatedTrips)
    saveTrips(updatedTrips)
    
    // Navigate back to home
    window.location.href = "/"
  }

  const handleCreateTrip = () => {
    // Navigate to create trip page
    window.location.href = "/create-trip"
  }

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$"
    }
    return symbols[currency] || currency
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
            <p className="text-muted-foreground">Loading trips...</p>
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
            <h1 className="text-xl font-medium">Your Trips</h1>
          </div>
          <Button 
            onClick={handleCreateTrip}
            className="rounded-xl"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Trip
          </Button>
        </div>
      </header>

      {/* Trips List */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        {trips.length === 0 ? (
          <Card className="minimal-card">
            <CardContent className="p-6 text-center">
              <div className="py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first trip to start tracking expenses with friends
                </p>
                <Button onClick={handleCreateTrip} className="w-full">
                  Create Your First Trip
                </Button>
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
                            <p className="text-muted-foreground">Balance to Pay</p>
                            <p className={`font-medium ${userBalance < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                              {getCurrencySymbol(trip.currency)}
                              {userBalance < 0 ? Math.abs(userBalance).toFixed(2) : "0.00"}
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
      </main>
    </div>
  )
} 