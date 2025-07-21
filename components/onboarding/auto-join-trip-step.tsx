"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import type { OnboardingData } from "./onboarding-flow"

interface AutoJoinTripStepProps {
  onNext: () => void
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
  tripCode: string
}

export function AutoJoinTripStep({ onNext, data, updateData, tripCode }: AutoJoinTripStepProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tripInfo, setTripInfo] = useState<any>(null)
  const [joinSuccess, setJoinSuccess] = useState(false)

  useEffect(() => {
    if (data.username && tripCode) {
      handleAutoJoin()
    }
  }, [data.username, tripCode])

  const handleAutoJoin = async () => {
    if (!data.username) return

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
        throw new Error('Trip not found.')
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

      // Generate basic trip card for joined trips (no location image)
      let tripCardData = null
      try {
        const cardResponse = await fetch('/api/trip-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripCode: tripCode,
            placeId: null, // No location for joined trips
            placeName: tripData.trip?.name || tripData.name || null
          })
        })
        
        if (cardResponse.ok) {
          tripCardData = await cardResponse.json()
        }
      } catch (cardError) {
        console.error('Failed to generate trip card for joined trip:', cardError)
      }

      // Update with complete trip data including status
      updateData({ 
        tripCode: tripCode,
        tripName: tripData.trip?.name || tripData.name || `Trip ${tripCode}`,
        currency: tripData.trip?.currency || tripData.currency || 'USD',
        tripId: tripData.trip?.id || tripData.id,
        tripStatus: tripData.trip?.is_active ? 'Active' : 'Upcoming',
        isJoining: true,
        tripCard: tripCardData
      })

      setJoinSuccess(true)
      
      // Auto-advance after a brief success display
      setTimeout(() => {
        onNext()
      }, 2000)

    } catch (error) {
      console.error('Error joining trip:', error)
      setError(error instanceof Error ? error.message : 'Failed to join trip')
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-red-400 font-semibold mb-2">Failed to Join Trip</h3>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </motion.div>
      )
    }

    if (joinSuccess && tripInfo) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Successfully Joined!</h3>
            <p className="text-gray-400">Welcome to the trip</p>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trip Name:</span>
                  <span className="text-white">{tripInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trip Code:</span>
                  <span className="text-white font-mono">{tripCode}</span>
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
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="mb-8">
          <Loader2 className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Joining Trip</h3>
          <p className="text-gray-400">Adding you to trip {tripCode}...</p>
        </div>

        {tripInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h4 className="text-white font-semibold mb-3">Trip Details</h4>
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
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {renderContent()}
      </motion.div>
    </div>
  )
}