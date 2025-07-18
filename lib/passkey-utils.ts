import { startRegistration, startAuthentication } from '@simplewebauthn/browser'

export interface PasskeyRegistrationResult {
  success: boolean
  credentialId?: string
  error?: string
}

export interface PasskeyAuthenticationResult {
  success: boolean
  user?: {
    id: string
    username: string
    displayName?: string
    avatarUrl?: string
  }
  error?: string
}

export async function registerPasskey(
  username: string, 
  displayName?: string
): Promise<PasskeyRegistrationResult> {
  try {
    // Step 1: Get registration options from server
    const optionsResponse = await fetch('/api/passkey/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username, 
        displayName,
        step: 'options' 
      }),
    })

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json()
      return { success: false, error: error.error || 'Failed to get registration options' }
    }

    const { options, userId } = await optionsResponse.json()

    // Step 2: Start registration with the browser
    let attResp
    try {
      attResp = await startRegistration(options)
    } catch (error) {
      // Some basic error handling
      if (error instanceof Error) {
        if (error.name === 'InvalidStateError') {
          return { success: false, error: 'A passkey already exists for this device' }
        } else if (error.name === 'NotAllowedError') {
          return { success: false, error: 'User cancelled or timed out' }
        } else if (error.name === 'NotSupportedError') {
          return { success: false, error: 'Passkeys are not supported on this device' }
        }
      }
      return { success: false, error: 'Failed to create passkey' }
    }

    // Step 3: Verify registration with server
    const verificationResponse = await fetch('/api/passkey/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username,
        userId,
        response: attResp,
        step: 'verify' 
      }),
    })

    if (!verificationResponse.ok) {
      const error = await verificationResponse.json()
      return { success: false, error: error.error || 'Failed to verify registration' }
    }

    const verification = await verificationResponse.json()

    if (verification.verified) {
      return { 
        success: true, 
        credentialId: verification.credentialId 
      }
    } else {
      return { 
        success: false, 
        error: verification.error || 'Registration verification failed' 
      }
    }

  } catch (error) {
    console.error('Error in passkey registration:', error)
    return { 
      success: false, 
      error: 'Network error during registration' 
    }
  }
}

export async function authenticateWithPasskey(
  username: string
): Promise<PasskeyAuthenticationResult> {
  try {
    // Step 1: Get authentication options from server
    const optionsResponse = await fetch('/api/passkey/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username,
        step: 'options' 
      }),
    })

    if (!optionsResponse.ok) {
      const error = await optionsResponse.json()
      return { success: false, error: error.error || 'Failed to get authentication options' }
    }

    const { options } = await optionsResponse.json()

    // Step 2: Start authentication with the browser
    let authResp
    try {
      authResp = await startAuthentication(options)
    } catch (error) {
      // Some basic error handling
      if (error instanceof Error) {
        if (error.name === 'InvalidStateError') {
          return { success: false, error: 'No passkey found for this device' }
        } else if (error.name === 'NotAllowedError') {
          return { success: false, error: 'User cancelled or timed out' }
        } else if (error.name === 'NotSupportedError') {
          return { success: false, error: 'Passkeys are not supported on this device' }
        }
      }
      return { success: false, error: 'Failed to authenticate with passkey' }
    }

    // Step 3: Verify authentication with server
    const verificationResponse = await fetch('/api/passkey/authenticate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username,
        response: authResp,
        step: 'verify' 
      }),
    })

    if (!verificationResponse.ok) {
      const error = await verificationResponse.json()
      return { success: false, error: error.error || 'Failed to verify authentication' }
    }

    const verification = await verificationResponse.json()

    if (verification.verified) {
      return { 
        success: true, 
        user: verification.user 
      }
    } else {
      return { 
        success: false, 
        error: verification.error || 'Authentication verification failed' 
      }
    }

  } catch (error) {
    console.error('Error in passkey authentication:', error)
    return { 
      success: false, 
      error: 'Network error during authentication' 
    }
  }
}

export function isPasskeySupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable &&
    window.PublicKeyCredential.isConditionalMediationAvailable
  )
}

export async function isPasskeyAvailable(): Promise<boolean> {
  if (!isPasskeySupported()) {
    return false
  }

  try {
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch (error) {
    console.error('Error checking passkey availability:', error)
    return false
  }
}