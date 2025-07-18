import { NextRequest, NextResponse } from 'next/server'
import { 
  generateAuthenticationOptions, 
  verifyAuthenticationResponse,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts
} from '@simplewebauthn/server'
import { 
  getUserByUsername as getUserByUsernameReal, 
  getPasskeyCredentialsByUserId as getPasskeyCredentialsByUserIdReal,
  getPasskeyCredentialByCredentialId as getPasskeyCredentialByCredentialIdReal,
  updatePasskeyCredentialCounter as updatePasskeyCredentialCounterReal
} from '@/lib/neon-db-new'
import { 
  getUserByUsername as getUserByUsernameMock, 
  getPasskeyCredentialsByUserId as getPasskeyCredentialsByUserIdMock,
  getPasskeyCredentialByCredentialId as getPasskeyCredentialByCredentialIdMock,
  updatePasskeyCredentialCounter as updatePasskeyCredentialCounterMock,
  shouldUseMockDatabase
} from '@/lib/mock-db'

const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost'
const origin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000'

// Store challenges temporarily (in production, use Redis or similar)
const challenges = new Map<string, string>()

// Database function wrappers - dynamically select at runtime
function getDbFunctions() {
  const useMock = shouldUseMockDatabase()
  console.log('Using mock database:', useMock)
  
  return {
    getUserByUsername: useMock ? getUserByUsernameMock : getUserByUsernameReal,
    getPasskeyCredentialsByUserId: useMock ? getPasskeyCredentialsByUserIdMock : getPasskeyCredentialsByUserIdReal,
    getPasskeyCredentialByCredentialId: useMock ? getPasskeyCredentialByCredentialIdMock : getPasskeyCredentialByCredentialIdReal,
    updatePasskeyCredentialCounter: useMock ? updatePasskeyCredentialCounterMock : updatePasskeyCredentialCounterReal
  }
}

// POST /api/passkey/authenticate - Generate authentication options or verify authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, step } = body

    if (step === 'options') {
      // Step 1: Generate authentication options
      const { getUserByUsername, getPasskeyCredentialsByUserId } = getDbFunctions()
      let allowCredentials: { id: string; type: 'public-key'; transports?: AuthenticatorTransport[] }[] = []

      if (username) {
        // If username is provided, get their specific credentials
        const user = await getUserByUsername(username)
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userCredentials = await getPasskeyCredentialsByUserId(user.id)
        if (userCredentials.length === 0) {
          return NextResponse.json({ error: 'No passkeys found for user' }, { status: 404 })
        }

        allowCredentials = userCredentials.map(cred => ({
          id: cred.credential_id,
          type: 'public-key' as const,
          transports: cred.transports as AuthenticatorTransport[]
        }))
      }

      const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'preferred',
        rpID
      }

      const options = await generateAuthenticationOptions(opts)
      
      // Store challenge for verification
      const challengeKey = username || 'anonymous'
      challenges.set(challengeKey, options.challenge)

      return NextResponse.json({ options })
    } 
    else if (step === 'verify') {
      // Step 2: Verify authentication response
      const { getUserByUsername, getPasskeyCredentialByCredentialId, updatePasskeyCredentialCounter } = getDbFunctions()
      const { response } = body
      
      if (!response) {
        return NextResponse.json({ error: 'Missing response' }, { status: 400 })
      }

      const challengeKey = username || 'anonymous'
      const expectedChallenge = challenges.get(challengeKey)
      if (!expectedChallenge) {
        return NextResponse.json({ error: 'No challenge found' }, { status: 400 })
      }

      // Get the credential from database
      const credentialId = response.id
      const passkeyCredential = await getPasskeyCredentialByCredentialId(credentialId)
      
      if (!passkeyCredential) {
        return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
      }

      // Get the user
      const user = await getUserByUsername(username)
      if (!user || user.id !== passkeyCredential.user_id) {
        return NextResponse.json({ error: 'User mismatch' }, { status: 400 })
      }

      const opts: VerifyAuthenticationResponseOpts = {
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: Buffer.from(passkeyCredential.credential_id, 'base64url'),
          credentialPublicKey: Buffer.from(passkeyCredential.public_key, 'base64url'),
          counter: passkeyCredential.counter,
          transports: passkeyCredential.transports as AuthenticatorTransport[]
        },
        requireUserVerification: true
      }

      const verification = await verifyAuthenticationResponse(opts)

      if (verification.verified) {
        // Update the counter
        await updatePasskeyCredentialCounter(
          passkeyCredential.credential_id, 
          verification.authenticationInfo.newCounter
        )

        // Clean up challenge
        challenges.delete(challengeKey)

        return NextResponse.json({ 
          verified: true, 
          user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name,
            avatarUrl: user.avatar_url
          },
          message: 'Authentication successful'
        })
      } else {
        return NextResponse.json({ 
          verified: false, 
          error: 'Failed to verify authentication' 
        }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })

  } catch (error) {
    console.error('Error in passkey authentication:', error)
    return NextResponse.json({ 
      error: 'Failed to process passkey authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}