import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getUserByUsername, updateUserAvatar } from '@/lib/neon-db-new'

// POST /api/users/avatar - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const username = formData.get('username') as string

    if (!file || !username) {
      return NextResponse.json(
        { error: 'File and username are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await getUserByUsername(username)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `avatars/${username}-${timestamp}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    })

    // Update user's avatar URL in database
    const updatedUser = await updateUserAvatar(username, blob.url)
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user avatar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatarUrl: blob.url,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
} 