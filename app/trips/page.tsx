"use client"

import { ArrowLeft, Users, Calendar, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TripsPage() {
  const trips = [
    {
      id: "1",
      name: "Tokyo Adventure",
      members: 4,
      totalExpenses: 1247.5,
      yourBalance: -89.25,
      currency: "USD",
      startDate: "2024-01-10",
      endDate: "2024-01-20",
      isActive: true,
      status: "ongoing",
    },
    {
      id: "2",
      name: "Paris Weekend",
      members: 3,
      totalExpenses: 890.0,
      yourBalance: 45.3,
      currency: "EUR",
      startDate: "2023-12-15",
      endDate: "2023-12-18",
      isActive: false,
      status: "completed",
    },
    {
      id: "3",
      name: "NYC Business Trip",
      members: 2,
      totalExpenses: 567.25,
      yourBalance: -12.5,
      currency: "USD",
      startDate: "2023-11-05",
      endDate: "2023-11-08",
      isActive: false,
      status: "completed",
    },
    {
      id: "4",
      name: "Bali Vacation",
      members: 6,
      totalExpenses: 2150.75,
      yourBalance: 125.8,
      currency: "USD",
      startDate: "2023-09-20",
      endDate: "2023-09-30",
      isActive: false,
      status: "completed",
    },
  ]

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startMonth = start.toLocaleDateString("en-US", { month: "short" })
    const endMonth = end.toLocaleDateString("en-US", { month: "short" })

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`
  }

  const handleTripSelect = (tripId: string) => {
    // Here you would switch the active trip
    console.log("Switching to trip:", tripId)
    // For now, just go back to home
    window.location.href = "/"
  }

  const handleCreateTrip = () => {
    // Navigate to create trip page
    window.location.href = "/create-trip"
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="p-6 pt-16">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-medium">Your Trips</h1>
        </div>
      </header>

      {/* Trips Timeline */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto">
        <div className="space-y-4">
          {trips.map((trip, index) => (
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
                        <span>{trip.members} members</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total spent</p>
                        <p className="text-xl font-medium">${trip.totalExpenses.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Your balance</p>
                        <p
                          className={`text-xl font-medium ${
                            trip.yourBalance < 0
                              ? "text-red-400"
                              : trip.yourBalance > 0
                                ? "text-green-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {trip.yourBalance === 0
                            ? "Even"
                            : `${trip.yourBalance < 0 ? "-" : "+"}$${Math.abs(trip.yourBalance).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {trip.status === "completed" && (
                  <div className="flex items-center justify-center pt-4 border-t border-border">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4" />
                      <span>Trip completed</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create New Trip Button */}
        <div className="mt-8">
          <Button
            variant="outline"
            className="w-full h-14 rounded-2xl border-dashed border-2 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 bg-transparent"
            onClick={handleCreateTrip}
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Trip
          </Button>
        </div>
      </main>
    </div>
  )
} 