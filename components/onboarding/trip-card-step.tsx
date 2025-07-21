
import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TripCard } from "@/components/ui/trip-card"
import { ArrowRight, Share2, Copy, Check } from "lucide-react"
import type { OnboardingData } from "./onboarding-flow"

interface TripCardStepProps {
  onNext: () => void
  onSkipToHome?: () => void
  data: OnboardingData
}

export function TripCardStep({ onNext, onSkipToHome, data }: TripCardStepProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)
  const [shareUrlCopied, setShareUrlCopied] = useState(false)
  
  const handleContinue = () => {
    onNext()
  }

  const generateShareUrl = async () => {
    if (!data.tripCode || isGeneratingShare) return

    setIsGeneratingShare(true)
    try {
      const response = await fetch('/api/share-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripCode: data.tripCode,
          placeName: data.tripCard?.placeName || data.selectedPlace?.main_text || data.tripName,
          backgroundImageUrl: data.tripCard?.backgroundImageUrl,
          username: data.username
        })
      })

      if (response.ok) {
        const result = await response.json()
        const fullUrl = `${window.location.origin}${result.shareUrl}`
        setShareUrl(fullUrl)
      } else {
        console.error('Failed to generate share URL')
      }
    } catch (error) {
      console.error('Error generating share URL:', error)
    } finally {
      setIsGeneratingShare(false)
    }
  }

  const copyShareUrl = async () => {
    if (!shareUrl) return
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareUrlCopied(true)
      setTimeout(() => setShareUrlCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy share URL:', error)
    }
  }



  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-900">
      {/* Header */}
      <div className="text-center pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-3">
            🎉 {data.isJoining ? 'Joined Trip!' : 'Trip Created!'}
          </h1>
          <p className="text-gray-300 text-lg">
            {data.isJoining ? 'Welcome to the group' : 'Your trip is ready to share'}
          </p>
        </motion.div>
      </div>

      {/* Trip Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <TripCard
            tripCode={data.tripCard?.tripCode || data.tripCode || 'XXX'}
            placeName={data.tripCard?.placeName || data.selectedPlace?.main_text || data.tripName}
            backgroundImageUrl={data.tripCard?.backgroundImageUrl || null}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="px-6 pb-4">
        <div className="space-y-4">
          {[
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
          ].map((feature, index) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 + index * 0.2 }}
              className="flex items-center space-x-3 text-left"
            >
              <div className="text-xl">{feature.icon}</div>
              <span className="text-gray-300">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Share URL Section */}
      {!data.isJoining && (
        <div className="px-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Trip Link
            </h3>
            
            {!shareUrl ? (
              <Button
                onClick={generateShareUrl}
                disabled={isGeneratingShare}
                variant="outline"
                className="w-full bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                {isGeneratingShare ? 'Generating Link...' : 'Generate Shareable Link'}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 bg-white/20 rounded-lg p-2">
                  <span className="text-white text-sm font-mono flex-1 truncate">{shareUrl}</span>
                  <Button
                    onClick={copyShareUrl}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20 p-1 h-8 w-8"
                  >
                    {shareUrlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-white/80 text-xs">
                  Send this link to friends so they can join with one tap!
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Action Button */}
      <div className="p-6 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <Button
            onClick={handleContinue}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2"
          >
            Start Tracking Expenses
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
} 