"use client"

import { useState, useEffect } from "react"
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

// Check if session is expired (30 days)
function isSessionExpired(): boolean {
  const lastAuth = localStorage.getItem('snapTab_lastAuth')
  if (!lastAuth) return true
  
  const lastAuthTime = parseInt(lastAuth)
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  
  return Date.now() - lastAuthTime > thirtyDaysMs
}

// Check if user is already authenticated
function isUserAuthenticated(): boolean {
  const username = localStorage.getItem('snapTab_username')
  const onboardingComplete = localStorage.getItem('snapTab_onboardingComplete')
  
  return !!(username && onboardingComplete && !isSessionExpired())
}

export default function SharedTripOnboarding({ shareData }: SharedTripOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [data, setData] = useState<OnboardingData>({
    tripCode: shareData.tripCode,
    isJoining: true,
    tripName: `Trip ${shareData.tripCode}`,
  })
  const totalSteps = 3 // Welcome → Auth → Success (Skip Join step)

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }))
  }

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthAndProceed = async () => {
      console.log('🔍 Checking authentication status...')
      
      if (isUserAuthenticated()) {
        console.log('✅ User already authenticated, auto-joining trip...')
        
        // Load existing user data
        const username = localStorage.getItem('snapTab_username')
        const displayName = localStorage.getItem('snapTab_displayName')
        
        updateData({ 
          username: username || '', 
          displayName: displayName || username || '' 
        })
        
        // Auto-join the trip
        await autoJoinTrip()
        
        // Skip directly to success step
        setCurrentStep(3)
        setIsCheckingAuth(false)
      } else {
        console.log('❌ User not authenticated or session expired, proceeding with auth flow...')
        // Proceed with normal onboarding flow
        setIsCheckingAuth(false)
      }
    }

    checkAuthAndProceed()
  }, [])

  const nextStep = async () => {
    if (currentStep === 2) {
      // After auth step, automatically join the trip before going to success step
      await autoJoinTrip()
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const autoJoinTrip = async () => {
    try {
      if (!data.username) {
        console.error('No username available for auto-join')
        return
      }

      // Create/get the user
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          displayName: data.displayName || data.username
        })
      })

      // Get trip info
      const tripResponse = await fetch(`/api/trips/${shareData.tripCode}`)
      if (!tripResponse.ok) {
        throw new Error('Trip not found')
      }
      const tripData = await tripResponse.json()

      // Join the trip
      const joinResponse = await fetch(`/api/trips/${shareData.tripCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: data.username })
      })

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json()
        throw new Error(errorData.error || 'Failed to join trip')
      }

      // Generate trip card with location image (same as original trip creator)
      let tripCardData = null
      
      // First try to use stored background image from share data
      if (shareData.backgroundImageUrl) {
        tripCardData = {
          tripCode: shareData.tripCode,
          placeName: shareData.placeName || tripData.trip?.name || tripData.name,
          backgroundImageUrl: shareData.backgroundImageUrl,
          generatedAt: new Date().toISOString()
        }
        console.log('✅ Using stored background image from share data')
      } else {
        // If no background image in share data, try to generate one with location
        console.log('⚠️ No background image in share data, attempting to generate with location')
        try {
          const cardResponse = await fetch('/api/trip-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tripCode: shareData.tripCode,
              placeId: null, // We don't have place ID from share data
              placeName: shareData.placeName || tripData.trip?.name || tripData.name
            })
          })
          
          if (cardResponse.ok) {
            tripCardData = await cardResponse.json()
            console.log('✅ Generated new trip card with location')
          } else {
            console.log('❌ Failed to generate trip card, using fallback')
            // Fallback to basic data
            tripCardData = {
              tripCode: shareData.tripCode,
              placeName: shareData.placeName || tripData.trip?.name || tripData.name,
              backgroundImageUrl: null, // Will show gradient
              generatedAt: new Date().toISOString()
            }
          }
        } catch (cardError) {
          console.error('Failed to generate trip card:', cardError)
          // Fallback to basic data
          tripCardData = {
            tripCode: shareData.tripCode,
            placeName: shareData.placeName || tripData.trip?.name || tripData.name,
            backgroundImageUrl: null, // Will show gradient
            generatedAt: new Date().toISOString()
          }
        }
      }

      // Update data with trip info
      updateData({ 
        tripCode: shareData.tripCode,
        tripName: shareData.placeName || tripData.trip?.name || tripData.name || `Trip ${shareData.tripCode}`,
        currency: tripData.trip?.currency || tripData.currency || 'USD',
        tripId: tripData.trip?.id || tripData.id,
        tripStatus: tripData.trip?.is_active ? 'Active' : 'Upcoming',
        isJoining: true,
        tripCard: tripCardData
      })

      console.log('✅ Auto-joined trip successfully:', shareData.tripCode)
    } catch (error) {
      console.error('❌ Failed to auto-join trip:', error)
      // Continue to next step even if join fails - user can join manually later
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
      // Update session timestamp
      localStorage.setItem('snapTab_lastAuth', Date.now().toString())
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
        // Skip JoinTripStep since we already have trip context from the share URL
        // Go directly to success/trip card confirmation
        return <TripCardStep onNext={completeOnboarding} onSkipToHome={completeOnboarding} data={data} />
      default:
        return renderWelcomeStep()
    }
  }

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-white/80">Checking authentication...</p>
        </div>
      </div>
    )
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