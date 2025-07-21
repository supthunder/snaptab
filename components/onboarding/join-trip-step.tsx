"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { OnboardingData } from "./onboarding-flow"

interface JoinTripStepProps {
  onNext: () => void
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
}

export function JoinTripStep({ onNext, data, updateData }: JoinTripStepProps) {
  const [tripCode, setTripCode] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tripInfo, setTripInfo] = useState<any>(null)

  useEffect(() => {
    setIsValid(tripCode.length === 3 && /^\d{3}$/.test(tripCode))
  }, [tripCode])

  const handleJoinTrip = async () => {
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

      // Get trip info
      const tripResponse = await fetch(`/api/trips/${tripCode}`)
      if (!tripResponse.ok) {
        throw new Error('Trip not found. Please check the code and try again.')
      }

      const tripData = await tripResponse.json()
      setTripInfo(tripData)

      // Join the trip
      const joinResponse = await fetch(`/api/trips/${tripCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username
        })
      })

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json()
        throw new Error(errorData.error || 'Failed to join trip')
      }

      // Update with complete trip data including status
      updateData({ 
        tripCode: tripCode,
        tripName: tripData.trip?.name || tripData.name || `Trip ${tripCode}`,
        currency: tripData.trip?.currency || tripData.currency || 'USD',
        tripId: tripData.trip?.id || tripData.id,
        tripStatus: tripData.trip?.is_active ? 'Active' : 'Upcoming',
        isJoining: true
      })
      
      onNext()
    } catch (error) {
      console.error('Error joining trip:', error)
      setError(error instanceof Error ? error.message : 'Failed to join trip')
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
            Join a Trip
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-400"
          >
            Enter the 3-digit code from your friend
          </motion.p>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <Input
              type="text"
              placeholder="000"
              value={tripCode}
              onChange={(e) => setTripCode(e.target.value.slice(0, 3))}
              maxLength={3}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 text-center text-2xl font-bold py-4"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-sm text-gray-400 mt-2"
            >
              Ask your friend for the trip code
            </motion.p>
          </motion.div>

          {tripInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-2">Trip Found!</h3>
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{tripInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Currency:</span>
                      <span className="text-white">{tripInfo.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Members:</span>
                      <span className="text-white">{tripInfo.memberCount || 0} members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
            transition={{ duration: 0.6, delay: 1 }}
          >
            <Button
              onClick={handleJoinTrip}
              disabled={!isValid || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-400 text-white py-3 rounded-full font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining trip...
                </>
              ) : (
                "Join Trip 🎯"
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
} 