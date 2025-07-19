"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, Key, UserPlus, LogIn, AlertTriangle } from "lucide-react"
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

export function PasskeyAuthStep({ onNext, data, updateData }: PasskeyAuthStepProps) {
  const [username, setUsername] = useState(data.username || "")
  const [displayName, setDisplayName] = useState(data.displayName || "")
  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isWebAuthnAvailable, setIsWebAuthnAvailable] = useState(false)
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

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
    const isValidDisplayName = displayName.trim().length >= 2
    
    if (showCreateForm) {
      setIsValid(isValidUsername && isValidDisplayName)
    } else {
      setIsValid(true) // For signin, no validation needed upfront
    }
  }, [username, displayName, showCreateForm])

  // No longer need checkUserExists - show both options directly

  const handleCreateAccount = async () => {
    if (!isWebAuthnAvailable) {
      setError('Passkeys are not supported on this device.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Step 1: Get registration options from server
      const optionsResponse = await fetch('/api/auth/passkey-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.toLowerCase(),
          displayName: displayName.trim()
        })
      })

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || 'Failed to get registration options')
      }

      const { creationOptions, challenge } = await optionsResponse.json()

      // Step 2: Create credential using WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: {
          ...creationOptions,
          challenge: new Uint8Array(creationOptions.challenge),
          user: {
            ...creationOptions.user,
            id: new Uint8Array(creationOptions.user.id)
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
      updateData({ 
        username: username.toLowerCase(),
        displayName: displayName.trim()
      })
      setTimeout(() => onNext(), 2000)

    } catch (error: any) {
      console.error('Error creating account:', error)
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      
      if (error.name === 'NotAllowedError') {
        setError('Passkey creation was cancelled, timed out, or blocked by the browser. Please try again and make sure to approve the biometric prompt.')
      } else if (error.name === 'InvalidStateError') {
        setError('A passkey already exists for this device. Try signing in instead.')
      } else if (error.name === 'NotSupportedError') {
        setError('Passkeys are not supported on this device or browser.')
      } else if (error.name === 'SecurityError') {
        setError('Security error: Make sure you\'re using HTTPS or localhost.')
      } else {
        setError(error.message || 'Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!isWebAuthnAvailable) {
      setError('Passkeys are not supported on this device.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Step 1: Get authentication options from server
      const optionsResponse = await fetch('/api/auth/passkey-authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })

      if (!optionsResponse.ok) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || 'Failed to get authentication options')
      }

      const { requestOptions, challenge } = await optionsResponse.json()

      // Step 2: Get credential using WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: {
          ...requestOptions,
          challenge: new Uint8Array(requestOptions.challenge),
          allowCredentials: requestOptions.allowCredentials.map((cred: any) => ({
            ...cred,
            id: new Uint8Array(Buffer.from(cred.id, 'base64'))
          }))
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Authentication failed')
      }

      // Step 3: Verify credential with server
      const response = credential.response as AuthenticatorAssertionResponse
      const authData = {
        username,
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
      updateData({ 
        username: result.user.username,
        displayName: result.user.displayName 
      })
      setTimeout(() => onNext(), 2000)

    } catch (error: any) {
      console.error('Error signing in:', error)
      console.log('Sign-in error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      
      if (error.name === 'NotAllowedError') {
        setError('Authentication was cancelled, timed out, or blocked. Please try again and approve the biometric prompt.')
      } else if (error.name === 'NotSupportedError') {
        setError('Passkeys are not supported on this device or browser.')
      } else if (error.name === 'SecurityError') {
        setError('Security error: Make sure you\'re using HTTPS or localhost.')
      } else if (error.name === 'InvalidStateError') {
        setError('No passkey found for this account on this device.')
      } else {
        setError(error.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isWebAuthnAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Passkeys Not Supported</h2>
          <p className="text-gray-400 mb-6">
            Your device or browser doesn't support passkeys. Please use a modern browser on a supported device.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="bg-gray-700 hover:bg-gray-600"
          >
            Go Back
          </Button>
        </motion.div>
      </div>
    )
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
            className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6"
          >
            <Key className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl font-bold text-white mb-3"
          >
            {showCreateForm ? 'Create Your Account' : 'Welcome Back'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-gray-400"
          >
            {showCreateForm ? 'Set up your username and secure it with a passkey' : 'Sign in to your account or create a new one'}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="space-y-4"
        >
          {showCreateForm ? (
            // Create Account Form
            <>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />
              
              <Input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />

              <p className="text-sm text-gray-400 text-center">
                Username: 3-20 characters, letters, numbers, and underscores only
              </p>

              <Button
                onClick={handleCreateAccount}
                disabled={!isValid || isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                {isLoading ? 'Creating Account...' : 'Create Account with Passkey'}
              </Button>

              <Button
                onClick={() => setShowCreateForm(false)}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white py-2"
              >
                ← Back to options
              </Button>
            </>
          ) : (
            // Auth Choice Buttons
            <div className="space-y-4">
              <Button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-3 text-lg"
              >
                <Fingerprint className="w-6 h-6" />
                {isLoading ? 'Signing In...' : 'Sign In with Passkey'}
              </Button>
              
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="outline"
                className="w-full border-gray-600 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-3 text-lg"
              >
                <UserPlus className="w-6 h-6" />
                Create Account
              </Button>

              <p className="text-gray-500 text-sm text-center mt-8">
                Passkeys use your device's biometric authentication<br />
                (Face ID, Touch ID, or Windows Hello)
              </p>
            </div>
          )}

          {!isPlatformAvailable && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Platform authenticator not available. You may need to set up Face ID, Touch ID, or Windows Hello.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-500/10">
              <LogIn className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">{success}</AlertDescription>
            </Alert>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-sm text-gray-400 text-center"
          >
            3-20 characters, letters, numbers, and underscores only
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  )
} 