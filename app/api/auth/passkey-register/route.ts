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

    console.log('🔐 Passkey registration request for username:', username)

    if (!username) {
      console.error('❌ Username is required')
      return NextResponse.json({ 
        error: 'Username is required' 
      }, { status: 400 })
    }

    // Validate username format
    if (typeof username !== 'string' || username.trim().length === 0) {
      console.error('❌ Invalid username format:', username)
      return NextResponse.json({ 
        error: 'Invalid username format' 
      }, { status: 400 })
    }

    // Check if user exists, create if not
    let user = await getUserByUsername(username)
    
    if (!user) {
      // Create new user
      console.log(`🆕 Creating new user: ${username}`)
      user = await createUser(username, username) // username as display name
      if (!user) {
        console.error(`❌ Failed to create user: ${username}`)
        return NextResponse.json({ 
          error: 'Failed to create user' 
        }, { status: 500 })
      }
      console.log(`✅ Successfully created user:`, { id: user.id, username: user.username })
    } else {
      console.log(`👤 Found existing user:`, { id: user.id, username: user.username })
    }

    // Validate user data for WebAuthn
    if (!user.username || user.username.length === 0) {
      console.error('❌ Invalid user data - username is empty')
      return NextResponse.json({ 
        error: 'Invalid user data' 
      }, { status: 500 })
    }

    // Generate challenge and credential creation options
    const challenge = generateChallenge()
    
    const rpId = getRpId(request)
    
    // Create WebAuthn user ID (must be 1-64 bytes)
    console.log(`🔤 Processing username for WebAuthn user ID: "${user.username}"`)
    console.log(`📏 Username length: ${user.username.length} characters`)
    
    let userIdBytes = new TextEncoder().encode(user.username)
    console.log(`📊 Encoded user ID bytes length: ${userIdBytes.length}`)
    console.log(`🔢 User ID bytes array:`, Array.from(userIdBytes))
    
    // If username is too long, use user database ID instead
    if (userIdBytes.length > 64) {
      console.log(`⚠️ Username too long (${userIdBytes.length} bytes), using user ID instead`)
      userIdBytes = new TextEncoder().encode(user.id)
      console.log(`🔄 Using user ID: "${user.id}" (${userIdBytes.length} bytes)`)
    }
    
    // Final validation
    if (userIdBytes.length === 0 || userIdBytes.length > 64) {
      console.error(`❌ Invalid user ID length: ${userIdBytes.length} bytes`)
      return NextResponse.json({ 
        error: `Cannot create valid WebAuthn user ID: ${userIdBytes.length} bytes (must be 1-64 bytes)` 
      }, { status: 400 })
    }
    
    console.log(`✅ Valid user ID length: ${userIdBytes.length} bytes`)
    
    const creationOptions = {
      challenge: Array.from(challenge), // Convert to regular array for JSON serialization
      rp: {
        name: "SnapTab",
        id: rpId
      },
      user: {
        id: Array.from(userIdBytes), // Convert to regular array for JSON serialization
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

    console.log('📋 Creation options prepared:', {
      rpId,
      userId: Array.from(userIdBytes),
      userIdLength: userIdBytes.length,
      username: user.username,
      displayName: user.display_name || user.username
    })

    // Store challenge in session/cache for verification
    // For now, we'll include it in the response (in production, use proper session management)
    
    return NextResponse.json({
      success: true,
      creationOptions,
      challenge: Buffer.from(challenge).toString('base64url'),
      debug: {
        userIdLength: userIdBytes.length,
        userIdArray: Array.from(userIdBytes),
        username: user.username
      }
    })

  } catch (error) {
    console.error('❌ Error in passkey registration:', error)
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