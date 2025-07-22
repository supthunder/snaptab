
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TripCard } from "@/components/ui/trip-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, Share2, Copy, Check } from "lucide-react"
import type { OnboardingData } from "./onboarding-flow"

interface TripCardStepProps {
  onNext: () => void
  onSkipToHome?: () => void
  data: OnboardingData
}

export function TripCardStep({ onNext, onSkipToHome, data }: TripCardStepProps) {
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)
  const [shareUrlCopied, setShareUrlCopied] = useState(false)
  
  const handleContinue = () => {
    onNext()
  }

  const generateAndCopyShareUrl = async () => {
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
        
        // Copy to clipboard (no need to store URL)
        await navigator.clipboard.writeText(fullUrl)
        setShareUrlCopied(true)
        setTimeout(() => setShareUrlCopied(false), 2000)
      } else {
        console.error('Failed to generate share URL')
      }
    } catch (error) {
      console.error('Error generating share URL:', error)
    } finally {
      setIsGeneratingShare(false)
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

      {/* Trip Members Section (only for joined trips) */}
      {data.isJoining && (
        <TripMembersSection tripCode={data.tripCode} />
      )}

      {/* Instructions */}
      <div className="px-6 pb-4">
        <div className="space-y-4">
          {[
            {
              icon: "📸",
              text: "Snap receipts to add expenses",
            },
            {
              icon: data.isJoining ? "💰" : "🤝", 
              text: data.isJoining ? "Track balances in real-time" : `Share code ${data.tripCode} with friends`,
            },
            {
              icon: data.isJoining ? "🎉" : "💰",
              text: data.isJoining ? "Start adding your expenses!" : "Track balances in real-time",
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
              Share Invite Link
            </h3>
            
            <Button
              onClick={generateAndCopyShareUrl}
              disabled={isGeneratingShare}
              variant="outline"
              className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 flex items-center gap-2"
            >
              {isGeneratingShare ? (
                <>Generating & Copying...</>
              ) : shareUrlCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied Invite Link!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Invite Link
                </>
              )}
            </Button>
            

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

// Component to show current trip members with overlapping avatars
function TripMembersSection({ tripCode }: { tripCode?: string }) {
  const [members, setMembers] = useState<Array<{
    id: string
    username: string
    display_name?: string
    avatar_url?: string
    created_at?: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMembers = async () => {
      if (!tripCode) return
      
      try {
        const response = await fetch(`/api/trips/${tripCode}`)
        if (response.ok) {
          const tripData = await response.json()
          setMembers(tripData.members || [])
        }
      } catch (error) {
        console.error('Failed to fetch trip members:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [tripCode])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserColor = (userId: string, username: string) => {
    const colors = [
      { bg: "bg-red-500", text: "text-white" },
      { bg: "bg-blue-500", text: "text-white" },
      { bg: "bg-green-500", text: "text-white" },
      { bg: "bg-purple-500", text: "text-white" },
      { bg: "bg-pink-500", text: "text-white" },
      { bg: "bg-indigo-500", text: "text-white" },
      { bg: "bg-orange-500", text: "text-white" },
      { bg: "bg-teal-500", text: "text-white" },
      { bg: "bg-cyan-500", text: "text-white" },
      { bg: "bg-emerald-500", text: "text-white" },
      { bg: "bg-violet-500", text: "text-white" },
      { bg: "bg-rose-500", text: "text-white" },
    ]

    const hashString = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash)
    }

    const hash = hashString(userId + username)
    const colorIndex = hash % colors.length
    return colors[colorIndex]
  }

  if (isLoading) return null

  if (members.length === 0) return null

  const visibleMembers = members.slice(0, 4)
  const hiddenCount = members.length - 4

  return (
    <div className="px-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
      >
        <h3 className="text-white font-semibold mb-3 text-center">
          🎉 You've joined {members.length} {members.length === 1 ? 'member' : 'members'}!
        </h3>
        
        {/* Overlapping Avatars */}
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            {visibleMembers.map((member, index) => {
              const userColor = getUserColor(member.id, member.username)
              return (
                <div
                  key={member.id}
                  className="relative"
                  style={{
                    marginLeft: index > 0 ? "-12px" : "0",
                    zIndex: visibleMembers.length - index,
                  }}
                >
                  <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                    <AvatarImage
                      src={member.avatar_url}
                      alt={member.username}
                      className="object-cover"
                    />
                    <AvatarFallback 
                      className={`text-sm font-medium ${
                        member.avatar_url 
                          ? "bg-primary/10 text-primary" 
                          : `${userColor.bg} ${userColor.text}`
                      }`}
                    >
                      {getInitials(member.username)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )
            })}

            {/* Hidden Members Count */}
            {hiddenCount > 0 && (
              <div
                className="flex items-center justify-center h-12 w-12 rounded-full bg-white/20 border-2 border-white shadow-lg"
                style={{
                  marginLeft: visibleMembers.length > 0 ? "-12px" : "0",
                  zIndex: 0,
                }}
              >
                <span className="text-sm font-semibold text-white">+{hiddenCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-3">
          <p className="text-white/80 text-sm">
            {members.map(m => m.username).join(", ")}
          </p>
        </div>
      </motion.div>
    </div>
  )
} 