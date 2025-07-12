"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import type { OnboardingData } from "../onboarding-flow"

interface TripChoiceStepProps {
  onNext: () => void
  onCreateTrip: () => void
  onJoinTrip: () => void
  updateData: (data: Partial<OnboardingData>) => void
}

export function TripChoiceStep({ onCreateTrip, onJoinTrip, updateData }: TripChoiceStepProps) {
  const handleCreateTrip = () => {
    updateData({ isJoining: false })
    onCreateTrip()
  }

  const handleJoinTrip = () => {
    updateData({ isJoining: true })
    onJoinTrip()
  }

  const choices = [
    {
      id: "create-trip",
      icon: "✨",
      title: "Create New Trip",
      description: "Start fresh with a new group expense tracker",
      features: ["Generate unique trip code", "Invite friends to join", "Set trip currency"],
      color: "blue",
      action: handleCreateTrip,
    },
    {
      id: "join-trip",
      icon: "🎯",
      title: "Join Existing Trip",
      description: "Enter a 3-digit code to join your friends",
      features: ["Quick 3-digit code entry", "Instant access to group", "See existing expenses"],
      color: "green",
      action: handleJoinTrip,
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
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
            Ready to Track Expenses?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-400"
          >
            Start a new trip or join an existing one
          </motion.p>
        </div>

        <div className="space-y-4">
          {choices.map((choice, index) => (
            <motion.div
              key={choice.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.15 }}
            >
              <Card
                className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={choice.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-3xl">{choice.icon}</div>
                    <div className="flex-1">
                      <h3
                        className={`font-semibold text-lg mb-2 ${choice.color === "blue" ? "text-blue-400" : "text-green-400"}`}
                      >
                        {choice.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">{choice.description}</p>
                      <ul className="space-y-1">
                        {choice.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="text-gray-300 text-xs flex items-center">
                            <span className="w-1 h-1 bg-gray-500 rounded-full mr-2"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
