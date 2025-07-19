import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername, getUserById, getPasskeyCredentialsByUserId, updatePasskeyCredentialCounter, getPasskeyCredentialByCredentialId } from '@/lib/neon-db-new'

// Generate a cryptographically secure challenge for WebAuthn
function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32))
}

// Get the correct RP ID based on environment
function getRpId(request: NextRequest): string {
  const host = request.headers.get('host')
  if (!host) return 'localhost'
  
  // For localhost development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'localhost'
  }
  
  // For production (remove port if present)
  return host.split(':')[0]
}

// POST /api/auth/passkey-authenticate - Generate authentication options
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    let allowCredentials: any[] = []

    if (username) {
      // Username-based flow (existing)
      const user = await getUserByUsername(username)
      
      if (!user) {
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 })
      }

      // Get user's passkey credentials
      const credentials = await getPasskeyCredentialsByUserId(user.id)
      
      if (credentials.length === 0) {
        return NextResponse.json({ 
          error: 'No passkeys found for this user. Please register a passkey first.' 
        }, { status: 404 })
      }

      allowCredentials = credentials.map(cred => ({
        id: cred.credential_id,
        type: "public-key" as const
      }))
    } else {
      // Device-based flow (new) - allow any credential from this device
      // Don't specify allowCredentials to let the browser choose from available passkeys
      allowCredentials = []
    }

    // Generate challenge for authentication
    const challenge = generateChallenge()
    const rpId = getRpId(request)
    
    const requestOptions = {
      challenge: challenge,
      timeout: 60000,
      rpId: rpId,
      allowCredentials: allowCredentials,
      userVerification: "required" as const
    }

    return NextResponse.json({
      success: true,
      requestOptions,
      challenge: Buffer.from(challenge).toString('base64url')
    })

  } catch (error) {
    console.error('Error in passkey authentication:', error)
    return NextResponse.json({ 
      error: 'Failed to generate passkey authentication options',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/auth/passkey-authenticate - Complete authentication
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, credential, challenge } = body

    if (!credential || !challenge) {
      return NextResponse.json({ 
        error: 'Credential and challenge are required' 
      }, { status: 400 })
    }

    let user: any = null

    if (username) {
      // Username-based flow (existing)
      user = await getUserByUsername(username)
      if (!user) {
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 })
      }
    } else {
      // Device-based flow (new) - find user by credential ID
      const credentialRecord = await getPasskeyCredentialByCredentialId(credential.id)
      if (!credentialRecord) {
        return NextResponse.json({ 
          error: 'Credential not found' 
        }, { status: 404 })
      }
      
      // Get the user associated with this credential
      user = await getUserById(credentialRecord.user_id)
      if (!user) {
        return NextResponse.json({ 
          error: 'User not found for this credential' 
        }, { status: 404 })
      }
    }

    // Verify credential (simplified - in production, use proper WebAuthn verification)
    const credentialId = credential.id
    
    // Update credential counter (for replay attack prevention)
    const success = await updatePasskeyCredentialCounter(credentialId, credential.response.counter || 0)
    
    if (!success) {
      return NextResponse.json({ 
        error: 'Failed to verify passkey credential' 
      }, { status: 401 })
    }

    // Authentication successful
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name
      }
    })

  } catch (error) {
    console.error('Error completing passkey authentication:', error)
    return NextResponse.json({ 
      error: 'Failed to complete passkey authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 