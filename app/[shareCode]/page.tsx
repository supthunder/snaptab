import { Metadata } from 'next'
import { sql } from '@vercel/postgres'
import { notFound } from 'next/navigation'
import SharedTripOnboarding from './shared-trip-onboarding'

interface ShareCodePageProps {
  params: Promise<{
    shareCode: string
  }>
}

// Fetch share data from database
async function getShareData(shareCode: string) {
  try {
    const result = await sql`
      SELECT share_code, trip_code, og_image_url, username, place_name, background_image_url, created_at
      FROM trip_shares 
      WHERE share_code = ${shareCode}
      LIMIT 1
    `
    
    if (result.rows.length === 0) {
      return null
    }
    
    return result.rows[0]
  } catch (error) {
    console.error('Error fetching share data:', error)
    return null
  }
}

// Generate OG image if missing
async function ensureOgImage(shareData: any) {
  if (shareData.og_image_url) {
    return shareData.og_image_url
  }

  try {
    console.log('🖼️ No OG image found, generating on-the-fly for share code:', shareData.share_code)
    
    // Generate the image using the trip-card-image API
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/trip-card-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripCode: shareData.trip_code,
        placeName: shareData.place_name,
        backgroundImageUrl: shareData.background_image_url
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      // Update the database with the new OG image URL
      await sql`
        UPDATE trip_shares 
        SET og_image_url = ${data.imageUrl}
        WHERE share_code = ${shareData.share_code}
      `
      
      console.log('✅ Generated and saved OG image:', data.imageUrl)
      return data.imageUrl
    } else {
      console.error('❌ Failed to generate OG image:', response.status)
    }
  } catch (error) {
    console.error('❌ Error generating OG image:', error)
  }

  return null
}

// Generate metadata for OpenGraph
export async function generateMetadata({ params }: ShareCodePageProps): Promise<Metadata> {
  const { shareCode } = await params
  const shareData = await getShareData(shareCode)
  
  if (!shareData) {
    return {
      title: 'Trip Not Found - SnapTab',
      description: 'This trip link is invalid or has expired.'
    }
  }

  const title = shareData.username 
    ? `Join ${shareData.username}'s trip${shareData.place_name ? ` to ${shareData.place_name}` : ''}`
    : `Join Trip ${shareData.trip_code}`
  
  const description = `Split travel expenses together with SnapTab. Enter code ${shareData.trip_code} to join the group.`

  // Ensure we have an OG image (generate if missing)
  const ogImageUrl = await ensureOgImage(shareData)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImageUrl ? [
        {
          url: ogImageUrl,
          width: 600,
          height: 400,
          alt: title
        }
      ] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    }
  }
}

export default async function ShareCodePage({ params }: ShareCodePageProps) {
  const { shareCode } = await params
  const shareData = await getShareData(shareCode)
  
  if (!shareData) {
    notFound()
  }

  return (
    <SharedTripOnboarding 
      shareData={{
        shareCode: shareData.share_code,
        tripCode: shareData.trip_code,
        ogImageUrl: shareData.og_image_url,
        username: shareData.username,
        placeName: shareData.place_name,
        backgroundImageUrl: shareData.background_image_url,
        createdAt: shareData.created_at
      }}
    />
  )
} 