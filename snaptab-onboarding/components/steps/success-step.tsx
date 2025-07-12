"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { OnboardingData } from "../onboarding-flow"

interface SuccessStepProps {
  data: OnboardingData
}

export function SuccessStep({ data }: SuccessStepProps) {
  const features = [
    {
      icon: "📸",
      text: "Snap receipts to add expenses",
    },
    {
      icon: "🤝",
      text: `Share code ${data.tripCode} with friends`,
    },
    {
      icon: "💰",
      text: "Track balances in real-time",
    },
  ]

  useEffect(() => {
    // Trigger confetti animation
    const timer = setTimeout(() => {
      // Confetti would be triggered here
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.5 }}
          className="text-8xl mb-6"
        >
          🎉
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Welcome to SnapTab!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-gray-400 mb-8"
        >
          Your trip is ready
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mb-8"
        >
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4">Trip Details</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="text-white">{data.tripName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Code:</span>
                  <span className="text-blue-400 font-bold">{data.tripCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Currency:</span>
                  <span className="text-white">{data.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Members:</span>
                  <span className="text-white">1 member</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
              className="flex items-center space-x-3 text-left"
            >
              <div className="text-xl">{feature.icon}</div>
              <span className="text-gray-300">{feature.text}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 2 }}
        >
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-full font-semibold" size="lg">
            Start Tracking Expenses →
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
