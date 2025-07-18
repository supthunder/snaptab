// Mock database for development/testing when Vercel database isn't available
import { User, PasskeyCredential } from './neon-db-new'

// In-memory storage
const users: Map<string, User> = new Map()
const usersByUsername: Map<string, User> = new Map()
const passkeyCredentials: Map<string, PasskeyCredential> = new Map()
const passkeyCredentialsByUser: Map<string, PasskeyCredential[]> = new Map()

let userIdCounter = 1
let credentialIdCounter = 1

// Mock user functions
export async function createUser(username: string, displayName?: string, avatarUrl?: string): Promise<User | null> {
  try {
    if (usersByUsername.has(username)) {
      return null // User already exists
    }

    const user: User = {
      id: `user-${userIdCounter++}`,
      username,
      display_name: displayName,
      avatar_url: avatarUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    users.set(user.id, user)
    usersByUsername.set(username, user)
    
    console.log('✅ Mock user created:', user.username)
    return user
  } catch (error) {
    console.error('❌ Error creating mock user:', error)
    return null
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  return usersByUsername.get(username) || null
}

export async function getUserById(id: string): Promise<User | null> {
  return users.get(id) || null
}

// Mock passkey credential functions
export async function createPasskeyCredential(
  userId: string,
  credentialId: string,
  publicKey: string,
  counter: number,
  deviceType?: string,
  backupEligible?: boolean,
  backupState?: boolean,
  transports?: string[]
): Promise<PasskeyCredential | null> {
  try {
    const credential: PasskeyCredential = {
      id: `cred-${credentialIdCounter++}`,
      user_id: userId,
      credential_id: credentialId,
      public_key: publicKey,
      counter,
      device_type: deviceType || 'unknown',
      backup_eligible: backupEligible || false,
      backup_state: backupState || false,
      transports: transports || [],
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString()
    }

    passkeyCredentials.set(credentialId, credential)
    
    // Add to user's credentials
    const userCredentials = passkeyCredentialsByUser.get(userId) || []
    userCredentials.push(credential)
    passkeyCredentialsByUser.set(userId, userCredentials)
    
    console.log('✅ Mock passkey credential created for user:', userId)
    return credential
  } catch (error) {
    console.error('❌ Error creating mock passkey credential:', error)
    return null
  }
}

export async function getPasskeyCredentialByCredentialId(credentialId: string): Promise<PasskeyCredential | null> {
  return passkeyCredentials.get(credentialId) || null
}

export async function getPasskeyCredentialsByUserId(userId: string): Promise<PasskeyCredential[]> {
  return passkeyCredentialsByUser.get(userId) || []
}

export async function updatePasskeyCredentialCounter(credentialId: string, counter: number): Promise<boolean> {
  const credential = passkeyCredentials.get(credentialId)
  if (credential) {
    credential.counter = counter
    credential.last_used = new Date().toISOString()
    console.log('✅ Mock passkey credential counter updated:', credentialId)
    return true
  }
  return false
}

export async function deletePasskeyCredential(credentialId: string): Promise<boolean> {
  const credential = passkeyCredentials.get(credentialId)
  if (credential) {
    passkeyCredentials.delete(credentialId)
    
    // Remove from user's credentials
    const userCredentials = passkeyCredentialsByUser.get(credential.user_id) || []
    const updatedCredentials = userCredentials.filter(c => c.credential_id !== credentialId)
    passkeyCredentialsByUser.set(credential.user_id, updatedCredentials)
    
    console.log('✅ Mock passkey credential deleted:', credentialId)
    return true
  }
  return false
}

// Mock database initialization
export async function initializeMockDatabase(): Promise<{ success: boolean; error?: any }> {
  try {
    console.log('🔧 Initializing mock database...')
    
    // Clear existing data
    users.clear()
    usersByUsername.clear()
    passkeyCredentials.clear()
    passkeyCredentialsByUser.clear()
    
    // Reset counters
    userIdCounter = 1
    credentialIdCounter = 1
    
    console.log('✅ Mock database initialized successfully!')
    return { success: true }
  } catch (error) {
    console.error('❌ Mock database initialization failed:', error)
    return { success: false, error }
  }
}

// Utility to check if we should use mock database
export function shouldUseMockDatabase(): boolean {
  // Use mock database if we're in development and don't have Vercel database connection
  return process.env.NODE_ENV === 'development' && !process.env.POSTGRES_URL
}

// Export mock status
export function getMockDatabaseStatus() {
  return {
    useMock: shouldUseMockDatabase(),
    userCount: users.size,
    credentialCount: passkeyCredentials.size,
    lastInitialized: new Date().toISOString()
  }
}