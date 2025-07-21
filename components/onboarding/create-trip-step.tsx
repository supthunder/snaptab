"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


import { GooglePlacesAutocomplete } from "@/components/ui/google-places-autocomplete"
import { Loader2, Calendar } from "lucide-react"
import type { OnboardingData } from "./onboarding-flow"

interface CreateTripStepProps {
  onNext: () => void
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
}

export function CreateTripStep({ onNext, data, updateData }: CreateTripStepProps) {
  const [tripName, setTripName] = useState(data.tripName || "")

  const [location, setLocation] = useState("")
  const [selectedPlace, setSelectedPlace] = useState<any>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currencies = [
    { value: "USD", label: "USD ($)", flag: "🇺🇸" },
    { value: "EUR", label: "EUR (€)", flag: "🇪🇺" },
    { value: "GBP", label: "GBP (£)", flag: "🇬🇧" },
    { value: "JPY", label: "JPY (¥)", flag: "🇯🇵" },
    { value: "CAD", label: "CAD ($)", flag: "🇨🇦" },
    { value: "AUD", label: "AUD ($)", flag: "🇦🇺" },
  ]

  useEffect(() => {
    setIsValid(tripName.length >= 3 && tripName.length <= 50)
  }, [tripName])

  const handleCreateTrip = async () => {
    if (!isValid || !data.username) return

    setIsLoading(true)
    setError(null)

    try {
      // First, create/get the user
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          displayName: data.displayName || data.username
        })
      })

      if (!userResponse.ok) {
        throw new Error('Failed to create user')
      }

      // Then create the trip
      const tripResponse = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tripName,
          currency: 'USD',
          username: data.username
        })
      })

      if (!tripResponse.ok) {
        const errorData = await tripResponse.json()
        throw new Error(errorData.error || 'Failed to create trip')
      }

      const tripData = await tripResponse.json()
      
      // Generate trip card with location image
      let tripCardData = null
      if (selectedPlace) {
        try {
          const cardResponse = await fetch('/api/trip-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tripCode: tripData.tripCode,
              placeId: selectedPlace.place_id,
              placeName: selectedPlace.main_text
            })
          })
          
          if (cardResponse.ok) {
            tripCardData = await cardResponse.json()
          }
        } catch (cardError) {
          console.error('Failed to generate trip card:', cardError)
        }
      }

      updateData({ 
        tripName: tripName, 
        currency: 'USD', 
        tripCode: tripData.tripCode,
        tripId: tripData.trip?.id,
        tripStatus: 'Active',
        tripCard: tripCardData,
        selectedPlace: selectedPlace
      })
      

      
      onNext()
    } catch (error) {
      console.error('Error creating trip:', error)
      setError(error instanceof Error ? error.message : 'Failed to create trip')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Create Your Trip
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-400"
          >
            Set up your group expense tracker
          </motion.p>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Label htmlFor="trip-name" className="text-white mb-2 block">
              🗺️ Trip Name
            </Label>
            <Input
              id="trip-name"
              type="text"
              placeholder="e.g., Tokyo Adventure 2024"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </motion.div>



          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <Label htmlFor="location" className="text-white mb-2 block">
              📍 Location (Optional)
            </Label>
            <GooglePlacesAutocomplete
              value={location}
              onChange={setLocation}
              onPlaceSelect={setSelectedPlace}
              placeholder="e.g., Banff, Canada"
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Label htmlFor="dates" className="text-white mb-2 block">
              📅 Trip Dates (Optional)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Start date"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="End date"
                />
              </div>
            </div>
          </motion.div>



          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/20 border border-red-500/30 rounded-lg p-4"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <Button
              onClick={handleCreateTrip}
              disabled={!isValid || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-400 text-white py-3 rounded-full font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating trip...
                </>
              ) : (
                "Create Trip 🚀"
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 