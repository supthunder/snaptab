"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TripChoiceStep } from "@/components/onboarding/trip-choice-step"
import { CreateTripStep } from "@/components/onboarding/create-trip-step"
import { JoinTripStep } from "@/components/onboarding/join-trip-step"
import { SuccessStep } from "@/components/onboarding/success-step"
import { ProgressBar } from "@/components/onboarding/progress-bar"
import { OnboardingData } from "@/components/onboarding/onboarding-flow"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AddTripPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({})
  const totalSteps = 3 // Trip Choice → Create/Join → Success

  // Get user data from localStorage
  const username = typeof window !== 'undefined' ? localStorage.getItem('snapTab_username') : null
  const displayName = typeof window !== 'undefined' ? localStorage.getItem('snapTab_displayName') : null

  // Initialize with user data
  const initialData = {
    username: username || '',
    displayName: displayName || username || ''
  }

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const completeAddTrip = () => {
    // Store the new trip data
    if (data.tripCode) {
      localStorage.setItem('snapTab_currentTripCode', data.tripCode)
    }
    
    // Redirect back to main app to load the new trip
    window.location.href = '/'
  }

  const renderStep = () => {
    const mergedData = { ...initialData, ...data }
    
    switch (currentStep) {
      case 1:
        return (
          <TripChoiceStep
            onNext={nextStep}
            onCreateTrip={() => goToStep(2)}
            onJoinTrip={() => goToStep(2)}
            updateData={updateData}
          />
        )
      case 2:
        return data.isJoining ? (
          <JoinTripStep onNext={() => goToStep(3)} data={mergedData} updateData={updateData} />
        ) : (
          <CreateTripStep onNext={() => goToStep(3)} data={mergedData} updateData={updateData} />
        )
      case 3:
        return <SuccessStep data={mergedData} onComplete={completeAddTrip} />
      default:
        return (
          <TripChoiceStep
            onNext={nextStep}
            onCreateTrip={() => goToStep(2)}
            onJoinTrip={() => goToStep(2)}
            updateData={updateData}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      {/* Back Button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-4 left-4 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (currentStep > 1) {
              prevStep()
            } else {
              window.location.href = '/'
            }
          }}
          className="text-white hover:bg-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="h-full"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 