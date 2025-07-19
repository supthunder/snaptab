// WebAuthn utility functions for passkey authentication

/**
 * Generate a cryptographically secure challenge for WebAuthn
 */
export function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32))
}

/**
 * Generate credential creation options for WebAuthn registration
 */
export function generateCredentialCreationOptions(
  userId: string,
  username: string,
  displayName: string,
  challenge: Uint8Array
) {
  const rpId = 'localhost' // Always use localhost for development

  return {
    challenge: challenge,
    rp: {
      name: "SnapTab",
      id: rpId
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: username,
      displayName: displayName
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" as const }, // ES256 (recommended)
      { alg: -257, type: "public-key" as const } // RS256 (backup)
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform" as const, // Prefer platform authenticators (Face ID, Touch ID, Windows Hello)
      userVerification: "required" as const,
      residentKey: "required" as const
    },
    timeout: 60000, // 60 seconds
    attestation: "none" as const // Don't require attestation for simplicity
  }
}

/**
 * Generate credential request options for WebAuthn authentication
 */
export function generateCredentialRequestOptions(
  challenge: Uint8Array,
  allowCredentials?: Array<{ id: string; type: "public-key" }>
) {
  const rpId = 'localhost' // Always use localhost for development

  return {
    challenge: challenge,
    timeout: 60000,
    rpId: rpId,
    allowCredentials: allowCredentials || [],
    userVerification: "required" as const
  }
}

/**
 * Convert ArrayBuffer to base64url string
 */
export function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Convert base64url string to ArrayBuffer
 */
export function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  // Add padding if necessary
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - base64url.length % 4) % 4, '=')
  
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer
}

/**
 * Check if WebAuthn is supported in the browser
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && 
         'credentials' in navigator &&
         'create' in navigator.credentials &&
         window.PublicKeyCredential !== undefined
}

/**
 * Check if platform authenticator (Face ID, Touch ID, etc.) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false
  
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch (error) {
    console.error('Error checking platform authenticator availability:', error)
    return false
  }
}

/**
 * Convert credential creation options for browser API
 */
export function prepareCreationOptions(options: any) {
  return {
    ...options,
    challenge: new Uint8Array(options.challenge),
    user: {
      ...options.user,
      id: new Uint8Array(options.user.id)
    }
  }
}

/**
 * Convert credential request options for browser API
 */
export function prepareRequestOptions(options: any) {
  return {
    ...options,
    challenge: new Uint8Array(options.challenge),
    allowCredentials: options.allowCredentials.map((cred: any) => ({
      ...cred,
      id: base64urlToArrayBuffer(cred.id)
    }))
  }
} 