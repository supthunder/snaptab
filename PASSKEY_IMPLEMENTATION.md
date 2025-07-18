# Passkey Authentication Implementation

This document describes the passkey authentication system implemented for SnapTab, providing secure, passwordless authentication with iOS support.

## Overview

The passkey authentication system allows users to:
- **Sign up** with a username and create a passkey using Face ID/Touch ID on iOS
- **Sign in** using their saved passkey without entering passwords
- **Securely store** passkey credentials in the database for future authentication

## Features

### 🔐 Secure Authentication
- Uses WebAuthn standard for passkey authentication
- Supports platform authenticators (Face ID, Touch ID, Windows Hello)
- No passwords stored or transmitted
- Cryptographic signatures for authentication
- **Identifier-first approach** following Web.dev and FIDO Alliance best practices

### 📱 iOS Support
- Optimized for iOS Safari and Chrome
- Face ID and Touch ID integration
- Platform authenticator preference for better UX
- Proper error handling for iOS-specific scenarios

### 🗄️ Database Integration
- New `passkey_credentials` table for storing credentials
- Proper indexing for performance
- Counter-based replay protection
- Support for multiple passkeys per user

## Database Schema

### passkey_credentials Table
```sql
CREATE TABLE passkey_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type VARCHAR(50),
  backup_eligible BOOLEAN DEFAULT false,
  backup_state BOOLEAN DEFAULT false,
  transports JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### POST /api/passkey/register
Handles passkey registration in two steps:
1. **Step 'options'**: Generates registration options
2. **Step 'verify'**: Verifies the registration response

**Request body:**
```json
{
  "username": "string",
  "displayName": "string (optional)",
  "step": "options" | "verify",
  "response": "object (for verify step)",
  "userId": "string (for verify step)"
}
```

### POST /api/passkey/authenticate
Handles passkey authentication in two steps:
1. **Step 'options'**: Generates authentication options
2. **Step 'verify'**: Verifies the authentication response

**Request body:**
```json
{
  "username": "string",
  "step": "options" | "verify",
  "response": "object (for verify step)"
}
```

## Components

### PasskeySignup Component
- Checks passkey availability
- Handles user registration with passkey creation
- Provides iOS-specific guidance
- Error handling and user feedback

### PasskeyLogin Component
- Authenticates users with existing passkeys
- Handles authentication flow
- User-friendly error messages
- Success feedback

### Authentication Page
- Combines signup and login in tabbed interface
- Handles authentication success/failure
- Redirects to main app after successful auth
- Stores user info in localStorage

## Usage

### 1. Navigate to Authentication
Visit `/auth` to access the authentication page.

### 2. Sign Up
1. Enter a username (required)
2. Enter display name (recommended)
3. Click "Create Account & Passkey"
4. Follow iOS prompts to create passkey with Face ID/Touch ID
5. Account created and passkey stored

### 3. Sign In
1. Enter your username
2. Click "Sign In with Passkey"
3. Use Face ID/Touch ID to authenticate
4. Automatically signed in

## iOS Integration

### Requirements
- iOS 16+ for optimal experience
- Safari or Chrome browser
- Face ID or Touch ID enabled
- Secure context (HTTPS in production)

### User Experience
- Native iOS authentication prompts
- Seamless Face ID/Touch ID integration
- Clear error messages for common issues
- Guidance for iOS-specific setup

## Security Features

### WebAuthn Standard
- Uses FIDO2/WebAuthn for secure authentication
- Cryptographic key pairs for authentication
- No shared secrets or passwords
- Phishing-resistant authentication

### Counter-based Protection
- Prevents replay attacks
- Tracks authentication counter
- Updates counter on each use
- Detects cloned credentials

### Device Binding
- Passkeys tied to specific devices
- Platform authenticator preference
- Backup state tracking
- Transport method recording

## Error Handling

### Common Error Scenarios
- **NotSupportedError**: Passkeys not supported on device
- **NotAllowedError**: User cancelled or timeout
- **InvalidStateError**: Passkey already exists or not found
- **NetworkError**: API communication issues

### iOS-Specific Errors
- Face ID/Touch ID not available
- User cancelled biometric prompt
- Device passcode required
- Biometric authentication failed

## Environment Variables

```env
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000
```

For production, update these to your actual domain:
```env
NEXT_PUBLIC_RP_ID=yourdomain.com
NEXT_PUBLIC_ORIGIN=https://yourdomain.com
```

## Testing

### Local Testing
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/auth`
3. Test signup and login flows
4. Verify passkey creation and authentication

### iOS Testing
1. Test on actual iOS device with Face ID/Touch ID
2. Use Safari or Chrome browser
3. Verify biometric prompts appear
4. Test error handling scenarios

## Production Deployment

### Prerequisites
- HTTPS enabled (required for WebAuthn)
- Database with passkey_credentials table
- Environment variables configured
- iOS app store compliance (if applicable)

### Configuration
1. Update environment variables for production domain
2. Configure HTTPS certificates
3. Test passkey functionality on production
4. Monitor authentication success rates

## Troubleshooting

### Common Issues
1. **Passkeys not working**: Check browser support and HTTPS
2. **iOS issues**: Verify Face ID/Touch ID enabled
3. **Database errors**: Ensure passkey_credentials table exists
4. **API errors**: Check server logs for detailed error messages

### Debug Steps
1. Check browser console for WebAuthn errors
2. Verify API endpoint responses
3. Check database connectivity
4. Test on different devices and browsers

## Future Enhancements

### Planned Features
- Multiple passkeys per user
- Passkey management interface
- Cross-platform synchronization
- Advanced security analytics

### Potential Improvements
- Conditional mediation support
- Discoverable credentials
- Enterprise policy support
- Advanced error recovery