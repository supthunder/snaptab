"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Loader2, CheckCircle, Smartphone } from "lucide-react"
import { registerPasskey, isPasskeyAvailable } from "@/lib/passkey-utils"
import type { OnboardingData } from "./onboarding-flow"

interface UsernameStepProps {
  onNext: () => void
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
}

export function UsernameStep({ onNext, data, updateData }: UsernameStepProps) {
  const [username, setUsername] = useState(data.username || "")
  const [displayName, setDisplayName] = useState(data.displayName || "")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [passkeyAvailable, setPasskeyAvailable] = useState(false)
  const [checkingSupport, setCheckingSupport] = useState(true)

  useEffect(() => {
    const isValidUsername = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
    const isValidDisplayName = displayName.length >= 1 && displayName.length <= 30
    setIsValid(isValidUsername && isValidDisplayName)
  }, [username, displayName])

  useEffect(() => {
    checkPasskeySupport()
  }, [])

  const checkPasskeySupport = async () => {
    try {
      const available = await isPasskeyAvailable()
      setPasskeyAvailable(available)
    } catch (error) {
      console.error('Error checking passkey support:', error)
      setPasskeyAvailable(false)
    } finally {
      setCheckingSupport(false)
    }
  }

  const handleContinue = async () => {
    if (!isValid) return
    
    if (!passkeyAvailable) {
      setError('Passkeys are not available on this device. Please use a device with Face ID, Touch ID, or Windows Hello.')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // First, update the data
      updateData({ username, displayName })
      
      // Then create the passkey
      const result = await registerPasskey(username.trim(), displayName.trim())
      
      if (result.success) {
        setSuccess('Account created successfully with passkey!')
        // Store user info for the main app
        localStorage.setItem('currentUser', JSON.stringify({
          id: result.credentialId || '',
          username: username.trim(),
          displayName: displayName.trim()
        }))
        
        // Continue to next step
        setTimeout(() => {
          onNext()
        }, 1000)
      } else {
        setError(result.error || 'Failed to create account with passkey')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
          >
            👤
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Create Your Account
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-gray-400"
          >
            Enter your details, then create a secure passkey
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="space-y-4"
        >
          <div>
            <Input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="text-xs text-gray-400 mt-1"
            >
              3-20 characters, letters, numbers, and underscores only
            </motion.p>
          </div>

          <div>
            <Input
              type="text"
              placeholder="Enter display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="text-xs text-gray-400 mt-1"
            >
              Your display name (shown when you sign in)
            </motion.p>
          </div>

          {/* Passkey Support Status */}
          {checkingSupport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="flex items-center gap-2 text-gray-400 text-sm"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking passkey support...
            </motion.div>
          )}

          {!checkingSupport && !passkeyAvailable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <Alert className="bg-red-900/20 border-red-500/50 text-red-300">
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Passkeys are not available on this device. Please use a device with Face ID, Touch ID, or Windows Hello.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {!checkingSupport && passkeyAvailable && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium">Passkey Ready!</p>
                  <p>You'll use Face ID or Touch ID to create a secure passkey. No passwords needed!</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="bg-red-900/20 border-red-500/50 text-red-300">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="bg-green-900/20 border-green-500/50 text-green-300">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="mt-8"
        >
          <Button
            onClick={handleContinue}
            disabled={!isValid || isLoading || !passkeyAvailable || checkingSupport}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-400 text-white py-3 rounded-full font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account & Passkey...
              </>
            ) : success ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Account Created!
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Create Account & Passkey →
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
} 