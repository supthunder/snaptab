'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PasskeySignup from '@/components/PasskeySignup'
import PasskeyLogin from '@/components/PasskeyLogin'

export default function AuthPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('signup')

  const handleAuthSuccess = (user: { id: string; username: string; displayName?: string; avatarUrl?: string }) => {
    console.log('Authentication successful:', user)
    // Store user info in localStorage or context
    localStorage.setItem('currentUser', JSON.stringify(user))
    // Redirect to main app
    router.push('/')
  }

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error)
    // Error handling is already done in the components
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SnapTab</h1>
          <p className="text-gray-600">Secure, passwordless authentication</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Create Account</TabsTrigger>
            <TabsTrigger value="login">Sign In</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signup" className="mt-6">
            <PasskeySignup 
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          </TabsContent>
          
          <TabsContent value="login" className="mt-6">
            <PasskeyLogin 
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {activeTab === 'signup' ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <Button 
            variant="link" 
            onClick={() => setActiveTab(activeTab === 'signup' ? 'login' : 'signup')}
            className="p-0 h-auto text-blue-600 hover:text-blue-800"
          >
            {activeTab === 'signup' ? 'Sign in instead' : 'Create account'}
          </Button>
        </div>
      </div>
    </div>
  )
}