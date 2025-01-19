import { useEffect, useRef, useState } from 'react'

// Gesture detection thresholds
const SWIPE_THRESHOLD = 50
const SWIPE_VELOCITY = 0.5
const LONG_PRESS_DELAY = 500

export const useGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onPinch,
  onRotate,
  threshold = SWIPE_THRESHOLD,
  velocity = SWIPE_VELOCITY,
  longPressDelay = LONG_PRESS_DELAY,
  disabled = false
} = {}) => {
  const touchRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    distance: 0,
    initialPinchDistance: 0,
    initialRotation: 0
  })
  const longPressTimer = useRef(null)
  const [isGesturing, setIsGesturing] = useState(false)

  const getDistance = (touches) => {
    return Math.hypot(
      touches[1].clientX - touches[0].clientX,
      touches[1].clientY - touches[0].clientY
    )
  }

  const getRotation = (touches) => {
    return Math.atan2(
      touches[1].clientY - touches[0].clientY,
      touches[1].clientX - touches[0].clientX
    )
  }

  const handleTouchStart = (e) => {
    if (disabled || !e.touches) return

    const touch = e.touches[0]
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      distance: 0,
      initialPinchDistance: e.touches.length === 2 ? getDistance(e.touches) : 0,
      initialRotation: e.touches.length === 2 ? getRotation(e.touches) : 0
    }

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(e)
      }, longPressDelay)
    }

    setIsGesturing(true)
  }

  const handleTouchMove = (e) => {
    if (disabled || !e.touches || !touchRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchRef.current.startX
    const deltaY = touch.clientY - touchRef.current.startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Clear long press timer if moved beyond threshold
    if (distance > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }

    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch) {
      const currentDistance = getDistance(e.touches)
      const scale = currentDistance / touchRef.current.initialPinchDistance
      onPinch({
        scale,
        center: {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        }
      })
    }

    // Handle rotation gesture
    if (e.touches.length === 2 && onRotate) {
      const currentRotation = getRotation(e.touches)
      const rotation = (currentRotation - touchRef.current.initialRotation) * (180 / Math.PI)
      onRotate({ rotation })
    }

    touchRef.current.distance = distance
  }

  const handleTouchEnd = (e) => {
    if (disabled || !touchRef.current) return

    clearTimeout(longPressTimer.current)
    setIsGesturing(false)

    const deltaX = e.changedTouches[0].clientX - touchRef.current.startX
    const deltaY = e.changedTouches[0].clientY - touchRef.current.startY
    const duration = Date.now() - touchRef.current.startTime
    const velocityX = Math.abs(deltaX) / duration
    const velocityY = Math.abs(deltaY) / duration

    // Detect swipe direction if threshold and velocity are met
    if (velocityX >= velocity || velocityY >= velocity) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > absY && absX > threshold) {
        if (deltaX > 0 && onSwipeRight) onSwipeRight(e)
        if (deltaX < 0 && onSwipeLeft) onSwipeLeft(e)
      } else if (absY > threshold) {
        if (deltaY > 0 && onSwipeDown) onSwipeDown(e)
        if (deltaY < 0 && onSwipeUp) onSwipeUp(e)
      }
    }

    touchRef.current = null
  }

  useEffect(() => {
    if (disabled) return

    const options = { passive: true }
    document.addEventListener('touchstart', handleTouchStart, options)
    document.addEventListener('touchmove', handleTouchMove, options)
    document.addEventListener('touchend', handleTouchEnd, options)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [disabled, threshold, velocity, longPressDelay])

  return { isGesturing }
}

// Helper hook for swipe-to-action functionality
export const useSwipeToAction = ({
  onSwipe,
  threshold = SWIPE_THRESHOLD,
  direction = 'horizontal',
  disabled = false
} = {}) => {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleSwipeLeft = () => {
    if (direction === 'horizontal' && onSwipe) onSwipe('left')
  }

  const handleSwipeRight = () => {
    if (direction === 'horizontal' && onSwipe) onSwipe('right')
  }

  const handleSwipeUp = () => {
    if (direction === 'vertical' && onSwipe) onSwipe('up')
  }

  const handleSwipeDown = () => {
    if (direction === 'vertical' && onSwipe) onSwipe('down')
  }

  const { isGesturing } = useGestures({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeUp: handleSwipeUp,
    onSwipeDown: handleSwipeDown,
    threshold,
    disabled
  })

  return {
    offset,
    isDragging: isGesturing && isDragging,
    gestureProps: {
      style: {
        transform: `translate${direction === 'horizontal' ? 'X' : 'Y'}(${offset}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      }
    }
  }
} 