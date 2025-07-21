"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface TripCardProps {
  tripCode: string
  placeName?: string | null
  backgroundImageUrl?: string | null
  className?: string
}

export function TripCard({ tripCode, placeName, backgroundImageUrl, className = "" }: TripCardProps) {
  const [copied, setCopied] = useState(false)
  


  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(tripCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy trip code:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      <Card className="relative w-full aspect-[4/3] overflow-hidden border-0 shadow-2xl">
        {/* Background Image */}
        {backgroundImageUrl ? (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${backgroundImageUrl})`,
              filter: 'blur(1px)'
            }}
          >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
          {placeName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-4"
            >
              <p className="text-white/90 text-lg font-medium">
                {placeName}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-2 tracking-wider">
              {tripCode}
            </h1>
            <div className="h-1 w-24 bg-white/60 mx-auto rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-3"
          >
            <p className="text-white/80 text-sm font-medium">
              Share this code with your travel buddies
            </p>
            
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all duration-200 border border-white/30"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-sm font-medium">Copy Code</span>
                </>
              )}
            </button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
} 