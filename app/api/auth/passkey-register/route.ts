import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername, savePasskeyCredential, createUser } from '@/lib/neon-db-new'

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

// POST /api/auth/passkey-register - Generate registration options
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ 
        error: 'Username is required' 
      }, { status: 400 })
    }

    // Check if user exists, create if not
    let user = await getUserByUsername(username)
    
    if (!user) {
      // Create new user
      console.log(`Creating new user: ${username}`)
      user = await createUser(username, username) // username as display name
      if (!user) {
        console.error(`Failed to create user: ${username}`)
        return NextResponse.json({ 
          error: 'Failed to create user' 
        }, { status: 500 })
      }
      console.log(`Successfully created user:`, { id: user.id, username: user.username })
    }

    // Validate user data for WebAuthn
    if (!user.username || user.username.length === 0) {
      console.error('Invalid user data - username is empty')
      return NextResponse.json({ 
        error: 'Invalid user data' 
      }, { status: 500 })
    }

    // Generate challenge and credential creation options
    const challenge = generateChallenge()
    
    const rpId = getRpId(request)
    
    // Create WebAuthn user ID (must be 1-64 bytes)
    const userIdBytes = new TextEncoder().encode(user.username)
    if (userIdBytes.length === 0 || userIdBytes.length > 64) {
      console.error(`Invalid user ID length: ${userIdBytes.length} bytes for username: ${user.username}`)
      return NextResponse.json({ 
        error: 'Username too long for WebAuthn' 
      }, { status: 400 })
    }
    
    const creationOptions = {
      challenge: challenge,
      rp: {
        name: "SnapTab",
        id: rpId
      },
      user: {
        id: userIdBytes,
        name: user.username,
        displayName: user.display_name || user.username
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "required"
      },
      timeout: 60000,
      attestation: "direct"
    }

    // Store challenge in session/cache for verification
    // For now, we'll include it in the response (in production, use proper session management)
    
    return NextResponse.json({
      success: true,
      creationOptions,
      challenge: Buffer.from(challenge).toString('base64url')
    })

  } catch (error) {
    console.error('Error in passkey registration:', error)
    return NextResponse.json({ 
      error: 'Failed to generate passkey registration options',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT /api/auth/passkey-register - Complete registration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, credential, challenge, deviceName } = body

    if (!username || !credential || !challenge) {
      return NextResponse.json({ 
        error: 'Username, credential, and challenge are required' 
      }, { status: 400 })
    }

    // Get user
    const user = await getUserByUsername(username)
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Verify credential (simplified - in production, use a proper WebAuthn library)
    const credentialId = credential.id
    const publicKeyBytes = credential.response.publicKey
    
    // Save passkey credential
    const savedCredential = await savePasskeyCredential(
      user.id,
      credentialId,
      Buffer.from(publicKeyBytes).toString('base64'),
      deviceName || 'Unknown Device'
    )

    if (!savedCredential) {
      return NextResponse.json({ 
        error: 'Failed to save passkey credential' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Passkey registered successfully',
      credentialId: credentialId
    })

  } catch (error) {
    console.error('Error completing passkey registration:', error)
    return NextResponse.json({ 
      error: 'Failed to complete passkey registration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 