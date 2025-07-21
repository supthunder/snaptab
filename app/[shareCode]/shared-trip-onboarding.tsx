"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PasskeyAuthStep } from "@/components/onboarding/passkey-auth-step"
import { JoinTripStep } from "@/components/onboarding/join-trip-step"
import { TripCardStep } from "@/components/onboarding/trip-card-step"
import { SuccessStep } from "@/components/onboarding/success-step"
import { ProgressBar } from "@/components/onboarding/progress-bar"
import { OnboardingData } from "@/components/onboarding/onboarding-flow"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TripCard } from "@/components/ui/trip-card"

interface SharedTripOnboardingProps {
  shareData: {
    shareCode: string
    tripCode: string
    ogImageUrl: string | null
    username: string | null
    placeName: string | null  
    backgroundImageUrl: string | null
    createdAt: string
  }
}

export default function SharedTripOnboarding({ shareData }: SharedTripOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    tripCode: shareData.tripCode,
    isJoining: true,
    tripName: `Trip ${shareData.tripCode}`,
  })
  const totalSteps = 4 // Welcome → Auth → Join → Success

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

  // Welcome step with trip preview
  const renderWelcomeStep = () => (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-900">
      {/* Hero Section */}
      <div className="text-center pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-3">
            🎉 You're Invited!
          </h1>
          <p className="text-gray-300 text-lg">
            {shareData.username 
              ? `${shareData.username} invited you to join their trip${shareData.placeName ? ` to ${shareData.placeName}` : ''}`
              : `Join this awesome trip!`
            }
          </p>
        </motion.div>
      </div>

      {/* Trip Card Preview */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <TripCard
            tripCode={shareData.tripCode}
            placeName={shareData.placeName}
            backgroundImageUrl={shareData.backgroundImageUrl}
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button
            onClick={nextStep}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2"
          >
            Join This Trip 🚀
          </Button>
        </motion.div>
      </div>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderWelcomeStep()
      case 2:
        return <PasskeyAuthStep onNext={nextStep} data={data} updateData={updateData} />
      case 3:
        return <JoinTripStep onNext={() => goToStep(4)} data={data} updateData={updateData} />
      case 4:
        return <TripCardStep onNext={completeOnboarding} onSkipToHome={completeOnboarding} data={data} />
      default:
        return renderWelcomeStep()
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