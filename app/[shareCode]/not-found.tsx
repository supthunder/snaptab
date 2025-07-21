import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">😕</div>
        <h1 className="text-3xl font-bold text-white mb-4">Trip Not Found</h1>
        <p className="text-gray-400 mb-8">
          This trip link is invalid or has expired. The trip may have been deleted or the link was copied incorrectly.
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full bg-blue-500 hover:bg-blue-600">
            <Link href="/onboarding">Join a Different Trip</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 