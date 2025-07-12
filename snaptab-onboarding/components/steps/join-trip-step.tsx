"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { OnboardingData } from "../onboarding-flow"

interface JoinTripStepProps {
  onNext: () => void
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
}

export function JoinTripStep({ onNext, data, updateData }: JoinTripStepProps) {
  const [code, setCode] = useState("")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsValid(code.length === 3 && /^[0-9]{3}$/.test(code))
  }, [code])

  const handleJoinTrip = async () => {
    if (isValid) {
      setIsLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      updateData({
        tripCode: code,
        tripName: "Tokyo Adventure",
        currency: "USD",
      })
      setIsLoading(false)
      onNext()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-8">
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

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-6"
        >
          <Input
            type="text"
            placeholder="000"
            value={code}
            onChange={(e) => setCode(e.target.value.slice(0, 3))}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 text-center text-2xl font-bold py-4"
            maxLength={3}
            autoFocus
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-gray-400 text-sm mb-8"
        >
          Ask your friend for the trip code
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Button
            onClick={handleJoinTrip}
            disabled={!isValid || isLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-400 text-white py-3 rounded-full font-semibold"
          >
            {isLoading ? "Joining trip..." : "Join Trip 🎯"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
