"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, Key, UserPlus, LogIn, AlertTriangle, ArrowLeft } from "lucide-react"
import { isWebAuthnSupported, isPlatformAuthenticatorAvailable, arrayBufferToBase64url } from "@/lib/webauthn-utils"
interface OnboardingData {
  username?: string
  displayName?: string
  tripName?: string
  currency?: string
  tripCode?: string
  tripId?: string
  isJoining?: boolean
}

interface PasskeyAuthStepProps {
  onNext: () => void
  data: OnboardingData
  updateData: (data: Partial<OnboardingData>) => void
}

type AuthFlow = 'choose' | 'signin' | 'create'

export function PasskeyAuthStep({ onNext, data, updateData }: PasskeyAuthStepProps) {
  const [currentFlow, setCurrentFlow] = useState<AuthFlow>('choose')
  const [username, setUsername] = useState(data.username || "")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isWebAuthnAvailable, setIsWebAuthnAvailable] = useState(false)
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false)

  useEffect(() => {
    const checkWebAuthnSupport = async () => {
      const webAuthnSupported = isWebAuthnSupported()
      const platformAvailable = await isPlatformAuthenticatorAvailable()
      
      setIsWebAuthnAvailable(webAuthnSupported)
      setIsPlatformAvailable(platformAvailable)
    }
    
    checkWebAuthnSupport()
  }, [])

  useEffect(() => {
    const isValidUsername = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
    setIsValid(isValidUsername)
  }, [username])

  // Auto-trigger sign in when flow changes to signin
  useEffect(() => {
    if (currentFlow === 'signin' && !isLoading && !error && !success) {
      const timer = setTimeout(() => {
        handleSignInFlow()
      }, 500) // Small delay to let the UI render
      
      return () => clearTimeout(timer)
    }
  }, [currentFlow, isLoading, error, success])

  const resetToChoose = () => {
    setCurrentFlow('choose')
    setError(null)
    setSuccess(null)
    setUsername('')
  }

  const handleSignInFlow = async () => {
    if (!isWebAuthnAvailable) {
      setError('Passkeys are not supported on this device.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // For sign-in, we don't need a username - passkeys are device-bound
      // Step 1: Get authentication options from server (without username)
      const optionsResponse = await fetch('/api/auth/passkey-authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty body - let server handle device-based auth
      })

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || 'No passkeys found on this device')
      }

      const { requestOptions, challenge } = await optionsResponse.json()

      // Step 2: Get credential using WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: {
          ...requestOptions,
          challenge: new Uint8Array(requestOptions.challenge),
          allowCredentials: requestOptions.allowCredentials?.map((cred: any) => ({
            ...cred,
            id: new Uint8Array(Buffer.from(cred.id, 'base64'))
          })) || []
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Authentication failed')
      }

      // Step 3: Verify credential with server
      const response = credential.response as AuthenticatorAssertionResponse
      const authData = {
        credential: {
          id: credential.id,
          rawId: arrayBufferToBase64url(credential.rawId),
          response: {
            clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
            authenticatorData: arrayBufferToBase64url(response.authenticatorData),
            signature: arrayBufferToBase64url(response.signature),
            counter: 0 // Would be extracted from authenticatorData in production
          },
          type: credential.type
        },
        challenge
      }

      const authResponse = await fetch('/api/auth/passkey-authenticate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      })

      if (!authResponse.ok) {
        const errorData = await authResponse.json()
        throw new Error(errorData.error || 'Authentication failed')
      }

      const result = await authResponse.json()
      setSuccess('Successfully signed in!')
      console.log('🔍 Sign-in success, updating data with username:', result.user.username)
      
      // Update data with username and wait for state update
      updateData({ 
        username: result.user.username,
        displayName: result.user.displayName 
      })
      
      // Set session timestamp for 30-day persistence
      localStorage.setItem('snapTab_lastAuth', Date.now().toString())
      
      // Check if we're in shared trip context (joining a specific trip)
      // If so, don't redirect to home even if user has existing trips
      const isSharedTripContext = data.tripCode && data.isJoining
      
      if (!isSharedTripContext) {
        // Only check for existing trips if not in shared trip context
        try {
          const tripsResponse = await fetch(`/api/trips?username=${encodeURIComponent(result.user.username)}`)
          if (tripsResponse.ok) {
            const tripsData = await tripsResponse.json()
            
            if (tripsData.trips && tripsData.trips.length > 0) {
              // Existing user with trips - redirect to home
              console.log('✅ Existing user with trips found, redirecting to home...')
              setTimeout(() => {
                localStorage.setItem('snapTab_username', result.user.username)
                localStorage.setItem('snapTab_displayName', result.user.displayName)
                localStorage.setItem('snapTab_onboardingComplete', 'true')
                
                // Set most recent trip as active
                const sortedTrips = tripsData.trips.sort((a: any, b: any) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                if (sortedTrips[0]) {
                  localStorage.setItem('snapTab_currentTripCode', sortedTrips[0].trip_code.toString())
                }
                
                window.location.href = '/'
              }, 1500)
              return
            }
          }
        } catch (error) {
          console.error('Error checking existing trips:', error)
          // Continue with normal flow if API call fails
        }
      }
      
      // New user or user without trips - continue with onboarding flow
      // Use shorter delay and pass username directly to ensure it's available
      setTimeout(() => {
        console.log('🔍 About to call onNext, current data should have username:', result.user.username)
        onNext()
      }, 1500)

    } catch (error: any) {
      console.error('Error signing in:', error)
      
      if (error.name === 'NotAllowedError') {
        setError('Authentication was cancelled. Please try again and approve the biometric prompt.')
      } else if (error.name === 'InvalidStateError') {
        setError('No passkey found on this device. Try creating an account instead.')
      } else {
        setError(error.message || 'No passkey found. Try creating an account instead.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!isWebAuthnAvailable) {
      setError('Passkeys are not supported on this device.')
      return
    }

    if (!isValid) {
      setError('Please enter a valid username')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Step 1: Get registration options from server
      const optionsResponse = await fetch('/api/auth/passkey-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || 'Failed to get registration options')
      }

      const { creationOptions, challenge } = await optionsResponse.json()

      // Step 2: Create credential using WebAuthn API
      const userIdArray = new Uint8Array(creationOptions.user.id)
      console.log('🔐 Creating WebAuthn credential with options:', {
        ...creationOptions,
        challenge: Array.from(new Uint8Array(creationOptions.challenge)),
        user: {
          ...creationOptions.user,
          id: Array.from(userIdArray),
          idLength: userIdArray.length
        }
      })

      // Validate user ID length before creating credential
      if (userIdArray.length === 0 || userIdArray.length > 64) {
        throw new Error(`Invalid user ID length: ${userIdArray.length} bytes (must be 1-64 bytes)`)
      }

      const credential = await navigator.credentials.create({
        publicKey: {
          ...creationOptions,
          challenge: new Uint8Array(creationOptions.challenge),
          user: {
            ...creationOptions.user,
            id: userIdArray
          }
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to create passkey')
      }

      // Step 3: Send credential to server
      const response = credential.response as AuthenticatorAttestationResponse
      const registrationData = {
        username,
        credential: {
          id: credential.id,
          rawId: arrayBufferToBase64url(credential.rawId),
          response: {
            clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
            attestationObject: arrayBufferToBase64url(response.attestationObject),
            publicKey: response.getPublicKey() ? arrayBufferToBase64url(response.getPublicKey()!) : null
          },
          type: credential.type
        },
        challenge,
        deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 
                   navigator.userAgent.includes('Android') ? 'Android' : 
                   navigator.userAgent.includes('Mac') ? 'Mac' : 'Unknown Device'
      }

      const completeResponse = await fetch('/api/auth/passkey-register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      })

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || 'Failed to complete registration')
      }

      setSuccess('Account created successfully with passkey!')
      updateData({ username })
      
      // Set session timestamp for 30-day persistence
      localStorage.setItem('snapTab_lastAuth', Date.now().toString())
      
      setTimeout(() => onNext(), 2000)

    } catch (error: any) {
      console.error('Error creating account:', error)
      
      if (error.name === 'NotAllowedError') {
        setError('Passkey creation was cancelled. Please try again and approve the biometric prompt.')
      } else if (error.name === 'InvalidStateError') {
        setError('A passkey already exists for this device. Try signing in instead.')
      } else {
        setError(error.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderChooseFlow = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
        >
          <Key className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Secure Authentication
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-gray-400"
        >
          Choose how you'd like to proceed
        </motion.p>
      </div>

      {!isPlatformAvailable && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Platform authenticator not available. You may need to set up Face ID, Touch ID, or Windows Hello.
          </AlertDescription>
        </Alert>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="space-y-4"
      >
        <Button
          onClick={() => setCurrentFlow('signin')}
          disabled={!isWebAuthnAvailable || isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-3 text-lg"
        >
          <Fingerprint className="w-6 h-6" />
          Sign In with Passkey
        </Button>

        <Button
          onClick={() => setCurrentFlow('create')}
          disabled={!isWebAuthnAvailable || isLoading}
          variant="outline"
          className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white py-4 rounded-full font-semibold flex items-center justify-center gap-3 text-lg"
        >
          <UserPlus className="w-6 h-6" />
          Create New Account
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          <strong>Sign In</strong>: Use your existing passkey<br />
          <strong>Create Account</strong>: Set up a new account with passkey
        </p>
      </motion.div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </motion.div>
  )

  const renderSignInFlow = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Fingerprint className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Sign In with Passkey
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-gray-400"
        >
          Use your biometric authentication to sign in securely
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center"
      >
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-400 font-semibold">Authenticating with passkey...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-400">
              {error ? 'Authentication failed.' : 'Tap your biometric sensor when prompted'}
            </p>
            {error && (
              <Button
                onClick={() => {
                  setError(null)
                  handleSignInFlow()
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-semibold"
              >
                Try Again
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-500/10 mt-4">
          <LogIn className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">{success}</AlertDescription>
        </Alert>
      )}
    </motion.div>
  )

  const renderCreateFlow = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <UserPlus className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Create New Account
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-gray-400"
        >
          Choose a username and create your secure account
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="space-y-4"
      >
        <Input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500"
          disabled={isLoading}
        />

        <Button
          onClick={handleCreateAccount}
          disabled={!isValid || isLoading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-700 text-white py-4 rounded-full font-semibold text-lg flex items-center justify-center gap-3"
        >
          <Fingerprint className="w-6 h-6" />
          {isLoading ? 'Creating Account...' : 'Create Account with Passkey'}
        </Button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-xs text-gray-500 text-center"
        >
          3-20 characters, letters, numbers, and underscores only
        </motion.p>
      </motion.div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-500/10 mt-4">
          <LogIn className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-500">{success}</AlertDescription>
        </Alert>
      )}
    </motion.div>
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      {currentFlow === 'choose' && renderChooseFlow()}
      {currentFlow === 'signin' && renderSignInFlow()}
      {currentFlow === 'create' && renderCreateFlow()}
    </div>
  )
} 