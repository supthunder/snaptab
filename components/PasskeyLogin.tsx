'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, Smartphone, CheckCircle, LogIn } from 'lucide-react'
import { authenticateWithPasskey, isPasskeyAvailable } from '@/lib/passkey-utils'

interface PasskeyLoginProps {
  onSuccess: (user: { id: string; username: string; displayName?: string; avatarUrl?: string }) => void
  onError?: (error: string) => void
}

export default function PasskeyLogin({ onSuccess, onError }: PasskeyLoginProps) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passkeyAvailable, setPasskeyAvailable] = useState(false)
  const [checkingSupport, setCheckingSupport] = useState(true)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      setError('Please enter your username')
      return
    }

    if (!passkeyAvailable) {
      setError('Passkeys are not available on this device')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await authenticateWithPasskey(username.trim())
      
      if (result.success && result.user) {
        setSuccess('Successfully signed in!')
        onSuccess(result.user)
      } else {
        setError(result.error || 'Failed to authenticate')
        onError?.(result.error || 'Failed to authenticate')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingSupport) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Checking passkey support...</span>
        </CardContent>
      </Card>
    )
  }

  if (!passkeyAvailable) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Passkey Not Available
          </CardTitle>
          <CardDescription>
            Passkeys are not supported on this device or browser. Please use a device with Face ID, Touch ID, or Windows Hello.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              For iOS devices, make sure you're using Safari or Chrome and have Face ID or Touch ID enabled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Sign In with Passkey
        </CardTitle>
        <CardDescription>
          Use your passkey to sign in securely without a password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Sign In with Passkey
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">On iOS:</p>
              <p>Use Face ID or Touch ID to authenticate with your saved passkey.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}