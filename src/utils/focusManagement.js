import { useEffect, useRef, useCallback } from 'react'

// Focus trap to keep focus within a container
export const useFocusTrap = (active = true) => {
  const containerRef = useRef(null)
  const previousFocusRef = useRef(null)

  const getFocusableElements = (container) => {
    return container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  }

  const handleFocus = useCallback((e) => {
    if (!containerRef.current || !active) return

    const focusableElements = getFocusableElements(containerRef.current)
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    // Handle Tab key
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // If shift + tab and on first element, move to last
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        // If tab and on last element, move to first
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    // Handle Escape key
    if (e.key === 'Escape' && previousFocusRef.current) {
      e.preventDefault()
      previousFocusRef.current.focus()
    }
  }, [active])

  useEffect(() => {
    if (!active) return

    // Store previous focus
    previousFocusRef.current = document.activeElement

    // Focus first focusable element
    if (containerRef.current) {
      const focusableElements = getFocusableElements(containerRef.current)
      if (focusableElements.length) focusableElements[0].focus()
    }

    // Add keyboard listener
    document.addEventListener('keydown', handleFocus)
    return () => {
      document.removeEventListener('keydown', handleFocus)
      // Restore focus on cleanup
      if (previousFocusRef.current) previousFocusRef.current.focus()
    }
  }, [active, handleFocus])

  return containerRef
}

// Focus within groups (e.g., menu items, list items)
export const useFocusGroup = ({
  vertical = true,
  horizontal = false,
  wrap = true,
  defaultIndex = 0,
  onFocusChange
} = {}) => {
  const groupRef = useRef(null)
  const [focusIndex, setFocusIndex] = useState(defaultIndex)

  const getFocusableItems = () => {
    if (!groupRef.current) return []
    return Array.from(
      groupRef.current.querySelectorAll(
        '[role="menuitem"], [role="option"], [role="tab"], [role="listitem"]'
      )
    )
  }

  const handleKeyDown = useCallback((e) => {
    if (!groupRef.current) return

    const items = getFocusableItems()
    if (!items.length) return

    let nextIndex = focusIndex

    switch (e.key) {
      case 'ArrowDown':
        if (vertical) {
          e.preventDefault()
          nextIndex = wrap
            ? (focusIndex + 1) % items.length
            : Math.min(focusIndex + 1, items.length - 1)
        }
        break
      case 'ArrowUp':
        if (vertical) {
          e.preventDefault()
          nextIndex = wrap
            ? (focusIndex - 1 + items.length) % items.length
            : Math.max(focusIndex - 1, 0)
        }
        break
      case 'ArrowRight':
        if (horizontal) {
          e.preventDefault()
          nextIndex = wrap
            ? (focusIndex + 1) % items.length
            : Math.min(focusIndex + 1, items.length - 1)
        }
        break
      case 'ArrowLeft':
        if (horizontal) {
          e.preventDefault()
          nextIndex = wrap
            ? (focusIndex - 1 + items.length) % items.length
            : Math.max(focusIndex - 1, 0)
        }
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = items.length - 1
        break
      default:
        return
    }

    if (nextIndex !== focusIndex) {
      setFocusIndex(nextIndex)
      items[nextIndex].focus()
      if (onFocusChange) onFocusChange(nextIndex)
    }
  }, [vertical, horizontal, wrap, focusIndex, onFocusChange])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    group.addEventListener('keydown', handleKeyDown)
    return () => group.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    groupRef,
    focusIndex,
    setFocusIndex
  }
}

// Focus state management for complex components
export const useFocusState = (initialState = false) => {
  const [isFocused, setIsFocused] = useState(initialState)
  const timeoutRef = useRef(null)

  const handleFocus = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    // Small delay to check if focus moved within component
    timeoutRef.current = setTimeout(() => {
      setIsFocused(false)
    }, 0)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    isFocused,
    focusProps: {
      onFocus: handleFocus,
      onBlur: handleBlur
    }
  }
}

// Focus restoration after actions (e.g., modal close)
export const useFocusReturn = () => {
  const lastFocusedElement = useRef(null)

  const saveFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (lastFocusedElement.current) {
      lastFocusedElement.current.focus()
    }
  }, [])

  return { saveFocus, restoreFocus }
} 