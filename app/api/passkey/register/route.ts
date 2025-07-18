import { NextRequest, NextResponse } from 'next/server'
import { 
  generateRegistrationOptions, 
  verifyRegistrationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts
} from '@simplewebauthn/server'
import { 
  createUser as createUserReal, 
  getUserByUsername as getUserByUsernameReal, 
  createPasskeyCredential as createPasskeyCredentialReal,
  getPasskeyCredentialsByUserId as getPasskeyCredentialsByUserIdReal
} from '@/lib/neon-db-new'
import { 
  createUser as createUserMock, 
  getUserByUsername as getUserByUsernameMock, 
  createPasskeyCredential as createPasskeyCredentialMock,
  getPasskeyCredentialsByUserId as getPasskeyCredentialsByUserIdMock,
  shouldUseMockDatabase
} from '@/lib/mock-db'

const rpName = 'SnapTab'
const rpID = process.env.NEXT_PUBLIC_RP_ID || 'localhost'
const origin = process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000'

// Store challenges temporarily (in production, use Redis or similar)
const challenges = new Map<string, string>()

// Database function wrappers - dynamically select at runtime
function getDbFunctions() {
  const useMock = shouldUseMockDatabase()
  console.log('Using mock database:', useMock)
  
  return {
    createUser: useMock ? createUserMock : createUserReal,
    getUserByUsername: useMock ? getUserByUsernameMock : getUserByUsernameReal,
    createPasskeyCredential: useMock ? createPasskeyCredentialMock : createPasskeyCredentialReal,
    getPasskeyCredentialsByUserId: useMock ? getPasskeyCredentialsByUserIdMock : getPasskeyCredentialsByUserIdReal
  }
}

// POST /api/passkey/register - Generate registration options
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, displayName, step } = body

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (step === 'options') {
      // Step 1: Generate registration options
      const { createUser, getUserByUsername, getPasskeyCredentialsByUserId } = getDbFunctions()
      
      let user = await getUserByUsername(username)
      
      if (!user) {
        // Create user first if they don't exist
        user = await createUser(username, displayName)
        if (!user) {
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }
      }

      // Get existing credentials to exclude them
      const existingCredentials = await getPasskeyCredentialsByUserId(user.id)
      const excludeCredentials = existingCredentials.map(cred => ({
        id: cred.credential_id,
        type: 'public-key' as const,
        transports: cred.transports as AuthenticatorTransport[]
      }))

      const opts: GenerateRegistrationOptionsOpts = {
        rpName,
        rpID,
        userID: user.id,
        userName: username,
        userDisplayName: displayName || username,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform' // Prefer platform authenticators (like Face ID/Touch ID)
        },
        supportedAlgorithmIDs: [-7, -257] // ES256 and RS256
      }

      const options = await generateRegistrationOptions(opts)
      
      // Store challenge for verification
      challenges.set(username, options.challenge)

      return NextResponse.json({ options, userId: user.id })
    } 
    else if (step === 'verify') {
      // Step 2: Verify registration response
      const { createPasskeyCredential } = getDbFunctions()
      const { response, userId } = body
      
      if (!response || !userId) {
        return NextResponse.json({ error: 'Missing response or userId' }, { status: 400 })
      }

      const expectedChallenge = challenges.get(username)
      if (!expectedChallenge) {
        return NextResponse.json({ error: 'No challenge found for user' }, { status: 400 })
      }

      const opts: VerifyRegistrationResponseOpts = {
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true
      }

      const verification = await verifyRegistrationResponse(opts)

      if (verification.verified && verification.registrationInfo) {
        const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

        // Store the credential in the database
        const passkeyCredential = await createPasskeyCredential(
          userId,
          Buffer.from(credentialID).toString('base64url'),
          Buffer.from(credentialPublicKey).toString('base64url'),
          counter,
          credentialDeviceType,
          credentialBackedUp,
          credentialBackedUp,
          response.response.transports
        )

        if (!passkeyCredential) {
          return NextResponse.json({ error: 'Failed to store passkey credential' }, { status: 500 })
        }

        // Clean up challenge
        challenges.delete(username)

        return NextResponse.json({ 
          verified: true, 
          credentialId: passkeyCredential.credential_id,
          message: 'Passkey registered successfully'
        })
      } else {
        return NextResponse.json({ 
          verified: false, 
          error: 'Failed to verify registration' 
        }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })

  } catch (error) {
    console.error('Error in passkey registration:', error)
    return NextResponse.json({ 
      error: 'Failed to process passkey registration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}