"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"


interface TripCardProps {
  tripCode: string
  placeName?: string | null
  backgroundImageUrl?: string | null
  className?: string
}

export function TripCard({ tripCode, placeName, backgroundImageUrl, className = "" }: TripCardProps) {
  const [imageError, setImageError] = useState(false)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      <Card className="relative w-full aspect-[4/3] overflow-hidden border-0 shadow-2xl">
        {/* Background Image */}
        {backgroundImageUrl && !imageError ? (
          <div className="absolute inset-0">
            <img
              src={backgroundImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover filter blur-sm"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
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
              className="mb-8"
            >
              <p className="text-white/95 text-2xl md:text-3xl font-semibold">
                {placeName}
              </p>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-8xl md:text-9xl font-bold text-white mb-4 tracking-wider">
              {tripCode}
            </h1>
            <div className="h-1 w-32 bg-white/60 mx-auto rounded-full" />
          </motion.div>
        </div>
      </Card>
    </motion.div>
  )
} 