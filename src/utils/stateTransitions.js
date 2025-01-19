import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Transition states
export const TransitionState = {
  IDLE: 'idle',
  ENTERING: 'entering',
  ENTERED: 'entered',
  EXITING: 'exiting',
  EXITED: 'exited'
}

// Default transition variants
export const defaultTransitionVariants = {
  initial: { opacity: 0, scale: 0.95 },
  enter: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 }
}

// Default transition config
const defaultConfig = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
  mass: 1
}

/**
 * Hook for managing state transitions with lifecycle events
 */
export const useStateTransition = ({
  initialState = TransitionState.IDLE,
  timeout = 300,
  onEnter,
  onEntered,
  onExit,
  onExited
} = {}) => {
  const [state, setState] = useState(initialState)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timeoutRef = useRef(null)

  const enter = useCallback(() => {
    if (state === TransitionState.ENTERING || state === TransitionState.ENTERED) return

    clearTimeout(timeoutRef.current)
    setIsTransitioning(true)
    setState(TransitionState.ENTERING)
    onEnter?.()

    timeoutRef.current = setTimeout(() => {
      setState(TransitionState.ENTERED)
      setIsTransitioning(false)
      onEntered?.()
    }, timeout)
  }, [state, timeout, onEnter, onEntered])

  const exit = useCallback(() => {
    if (state === TransitionState.EXITING || state === TransitionState.EXITED) return

    clearTimeout(timeoutRef.current)
    setIsTransitioning(true)
    setState(TransitionState.EXITING)
    onExit?.()

    timeoutRef.current = setTimeout(() => {
      setState(TransitionState.EXITED)
      setIsTransitioning(false)
      onExited?.()
    }, timeout)
  }, [state, timeout, onExit, onExited])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return {
    state,
    isTransitioning,
    enter,
    exit
  }
}

/**
 * Hook for managing loading state transitions
 */
export const useLoadingTransition = ({
  timeout = 300,
  minLoadingTime = 500
} = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const startTimeRef = useRef(null)
  const timeoutRef = useRef(null)

  const startLoading = useCallback(() => {
    clearTimeout(timeoutRef.current)
    startTimeRef.current = Date.now()
    setIsLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    const elapsedTime = Date.now() - (startTimeRef.current || 0)
    const remainingTime = Math.max(0, minLoadingTime - elapsedTime)

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false)
    }, remainingTime)
  }, [minLoadingTime])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return {
    isLoading,
    startLoading,
    stopLoading
  }
}

/**
 * Hook for managing error state transitions
 */
export const useErrorTransition = ({
  timeout = 5000,
  onDismiss
} = {}) => {
  const [error, setError] = useState(null)
  const timeoutRef = useRef(null)

  const showError = useCallback((message) => {
    clearTimeout(timeoutRef.current)
    setError(message)

    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setError(null)
        onDismiss?.()
      }, timeout)
    }
  }, [timeout, onDismiss])

  const clearError = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setError(null)
    onDismiss?.()
  }, [onDismiss])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return {
    error,
    showError,
    clearError
  }
}

/**
 * Hook for managing success state transitions
 */
export const useSuccessTransition = ({
  timeout = 3000,
  onDismiss
} = {}) => {
  const [success, setSuccess] = useState(null)
  const timeoutRef = useRef(null)

  const showSuccess = useCallback((message) => {
    clearTimeout(timeoutRef.current)
    setSuccess(message)

    if (timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setSuccess(null)
        onDismiss?.()
      }, timeout)
    }
  }, [timeout, onDismiss])

  const clearSuccess = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setSuccess(null)
    onDismiss?.()
  }, [onDismiss])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return {
    success,
    showSuccess,
    clearSuccess
  }
}

/**
 * Hook for managing progress transitions
 */
export const useProgressTransition = ({
  initialProgress = 0,
  autoComplete = true,
  completeTimeout = 500
} = {}) => {
  const [progress, setProgress] = useState(initialProgress)
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef(null)

  const updateProgress = useCallback((newProgress) => {
    setProgress(newProgress)

    if (autoComplete && newProgress >= 100) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setIsComplete(true)
      }, completeTimeout)
    }
  }, [autoComplete, completeTimeout])

  const reset = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setProgress(initialProgress)
    setIsComplete(false)
  }, [initialProgress])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return {
    progress,
    isComplete,
    updateProgress,
    reset
  }
}

/**
 * Hook for managing page transitions
 */
export const usePageTransition = ({
  onBeforeEnter,
  onAfterEnter,
  onBeforeExit,
  onAfterExit
} = {}) => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timeoutRef = useRef(null)

  const transition = useCallback(async (callback) => {
    if (isTransitioning) return

    try {
      setIsTransitioning(true)
      await onBeforeExit?.()

      // Wait for exit animation
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(resolve, 300)
      })

      await onAfterExit?.()
      await onBeforeEnter?.()
      
      if (callback) {
        await callback()
      }

      // Wait for enter animation
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(resolve, 300)
      })

      await onAfterEnter?.()
    } finally {
      setIsTransitioning(false)
    }
  }, [isTransitioning, onBeforeEnter, onAfterEnter, onBeforeExit, onAfterExit])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return {
    isTransitioning,
    transition
  }
}

// Motion components with default transitions
export const TransitionFade = motion(({ children, ...props }) => (
  <AnimatePresence mode="wait">
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={defaultTransitionVariants}
      transition={defaultConfig}
      {...props}
    >
      {children}
    </motion.div>
  </AnimatePresence>
))

export const TransitionSlide = motion(({ children, direction = 'right', ...props }) => {
  const variants = {
    initial: { 
      opacity: 0,
      x: direction === 'right' ? -20 : direction === 'left' ? 20 : 0,
      y: direction === 'down' ? -20 : direction === 'up' ? 20 : 0
    },
    enter: { 
      opacity: 1,
      x: 0,
      y: 0
    },
    exit: {
      opacity: 0,
      x: direction === 'right' ? 20 : direction === 'left' ? -20 : 0,
      y: direction === 'down' ? 20 : direction === 'up' ? -20 : 0
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        transition={defaultConfig}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
})

export const TransitionScale = motion(({ children, ...props }) => {
  const variants = {
    initial: { opacity: 0, scale: 0 },
    enter: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0 }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        transition={defaultConfig}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}) 