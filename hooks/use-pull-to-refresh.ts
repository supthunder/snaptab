import { useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  disabled?: boolean
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 60, 
  disabled = false 
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  
  const startY = useRef(0)
  const currentY = useRef(0)
  const isAtTop = useRef(true)

  useEffect(() => {
    if (disabled) return

    const checkScrollPosition = () => {
      isAtTop.current = window.scrollY <= 0
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop.current || isRefreshing) return
      
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || !isAtTop.current || isRefreshing) return

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        // Prevent default scrolling when pulling down
        e.preventDefault()
        
        // Apply diminishing returns to pull distance for natural feel
        const dampedDistance = Math.min(distance * 0.6, threshold * 1.5)
        setPullDistance(dampedDistance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return

      setIsPulling(false)

      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        setPullDistance(0)
        
        try {
          await onRefresh()
        } catch (error) {
          console.error('Refresh failed:', error)
        } finally {
          setIsRefreshing(false)
        }
      } else {
        // Animate back to 0
        setPullDistance(0)
      }
    }

    // Add event listeners
    window.addEventListener('scroll', checkScrollPosition, { passive: true })
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    // Initial scroll position check
    checkScrollPosition()

    return () => {
      window.removeEventListener('scroll', checkScrollPosition)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [disabled, isPulling, pullDistance, threshold, onRefresh, isRefreshing])

  return {
    isRefreshing,
    pullDistance,
    isPulling,
    isActive: pullDistance > 0 || isRefreshing
  }
} 