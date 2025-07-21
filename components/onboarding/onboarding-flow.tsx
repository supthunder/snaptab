"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WelcomeStep } from "./welcome-step"
import { PasskeyAuthStep } from "./passkey-auth-step"
import { TripChoiceStep } from "./trip-choice-step"
import { CreateTripStep } from "./create-trip-step"
import { JoinTripStep } from "./join-trip-step"
import { SuccessStep } from "./success-step"
import { ProgressBar } from "./progress-bar"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface OnboardingData {
  username?: string
  displayName?: string
  tripName?: string
  currency?: string
  tripCode?: string
  tripId?: string
  tripStatus?: string
  isJoining?: boolean
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({})
  const totalSteps = 6

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

  const completeOnboarding = () => {
    // Store user data in localStorage for the main app
    if (data.username) {
      localStorage.setItem('snapTab_username', data.username)
      localStorage.setItem('snapTab_displayName', data.displayName || data.username)
    }
    
    if (data.tripCode) {
      localStorage.setItem('snapTab_currentTripCode', data.tripCode)
    }
    
    // Mark onboarding as complete
    localStorage.setItem('snapTab_onboardingComplete', 'true')
    
    // Redirect to main app
    window.location.href = '/'
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={nextStep} />
      case 2:
        return <PasskeyAuthStep onNext={nextStep} data={data} updateData={updateData} />
      case 3:
        return (
          <TripChoiceStep
            onNext={nextStep}
            onCreateTrip={() => goToStep(4)}
            onJoinTrip={() => goToStep(5)}
            updateData={updateData}
          />
        )
      case 4:
        return <CreateTripStep onNext={() => goToStep(6)} data={data} updateData={updateData} />
      case 5:
        return <JoinTripStep onNext={() => goToStep(6)} data={data} updateData={updateData} />
      case 6:
        return <SuccessStep data={data} onComplete={completeOnboarding} />
      default:
        return <WelcomeStep onNext={nextStep} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

      {/* Back Button */}
      {currentStep > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" onClick={prevStep} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>
      )}

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