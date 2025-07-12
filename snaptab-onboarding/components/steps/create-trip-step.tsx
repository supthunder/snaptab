"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import type { OnboardingData } from "../onboarding-flow"

interface CreateTripStepProps {
  onNext: () => void
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
}

export function CreateTripStep({ onNext, data, updateData }: CreateTripStepProps) {
  const [tripName, setTripName] = useState(data.tripName || "")
  const [currency, setCurrency] = useState(data.currency || "USD")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
    if (isValid) {
      setIsLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const tripCode = Math.floor(100 + Math.random() * 900).toString()
      updateData({ tripName, currency, tripCode })
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
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Label htmlFor="currency" className="text-white mb-2 block">
              💰 Base Currency
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {currencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value} className="text-white hover:bg-gray-700">
                    {curr.flag} {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-2">Trip Preview</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">###</div>
                  <p className="text-gray-400 text-sm">Your friends will use this code to join</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Button
              onClick={handleCreateTrip}
              disabled={!isValid || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-400 text-white py-3 rounded-full font-semibold"
            >
              {isLoading ? "Creating trip..." : "Create Trip 🚀"}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
