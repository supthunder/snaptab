"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: "📸",
      title: "Snap & Split",
      description: "Take a photo of any receipt and AI splits it instantly",
    },
    {
      icon: "🤝",
      title: "Share with Friends",
      description: "Simple 3-digit codes to join trips together",
    },
    {
      icon: "💰",
      title: "Smart Settlements",
      description: "Calculate who owes what with minimal transactions",
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 0 }}
        className="text-8xl mb-6"
      >
        📱
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-4xl font-bold text-blue-400 mb-4"
      >
        SnapTab
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-xl text-gray-400 mb-12"
      >
        The smartest way to split travel expenses
      </motion.p>

      <div className="space-y-6 mb-12 max-w-md">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.8 + index * 0.2 }}
            className="flex items-start space-x-4 text-left"
          >
            <div className="text-2xl">{feature.icon}</div>
            <div>
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      >
        <Button
          onClick={onNext}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold"
          size="lg"
        >
          Get Started →
        </Button>
      </motion.div>
    </div>
  )
} 