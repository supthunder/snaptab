"use client"
import { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: ReactNode
  disabled?: boolean
  threshold?: number
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  disabled = false,
  threshold = 60 
}: PullToRefreshProps) {
  const { isRefreshing, pullDistance, isPulling } = usePullToRefresh({
    onRefresh,
    threshold,
    disabled
  })

  const showIndicator = pullDistance > 0 || isRefreshing

  return (
    <div className="relative">
      {/* Refresh indicator in revealed space */}
      {showIndicator && (
        <div 
          className="fixed top-0 left-0 right-0 flex items-center justify-center z-40"
          style={{ 
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            paddingTop: 'env(safe-area-inset-top)'
          }}
        >
          <div className="flex items-center justify-center h-full">
            <RefreshCw 
              className={`h-6 w-6 text-muted-foreground ${
                isRefreshing ? 'animate-spin' : ''
              }`} 
            />
          </div>
        </div>
      )}

      {/* Content that moves down as user pulls */}
      <div 
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`
        }}
      >
        {children}
      </div>
    </div>
  )
} 