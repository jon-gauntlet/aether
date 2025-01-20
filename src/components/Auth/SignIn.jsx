import React, { useState, useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useAuth } from './AuthProvider'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'
import { debounce } from 'lodash'

const Form = styled(motion.form)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
`

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${({ theme, error }) => error ? theme.colors.error[500] : theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  width: 100%;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100]};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.neutral[50]};
    cursor: not-allowed;
  }
`

const Button = styled(motion.button)`
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary[600]};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100]};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.neutral[400]};
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transform: translateX(-100%);
    animation: ${({ $loading }) => $loading ? 'loading 1.5s infinite' : 'none'};
  }

  @keyframes loading {
    100% {
      transform: translateX(100%);
    }
  }
`

const ErrorMessage = styled(motion.div)`
  color: ${({ theme }) => theme.colors.error[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: 0.25rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  role: alert;
  aria-live: polite;
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral[700]};
  margin-bottom: 0.25rem;
`

const getButtonText = (state) => {
  switch (state) {
    case 'loading':
      return 'Signing in...'
    case 'error':
      return 'Try Again'
    case 'success':
      return 'Success!'
    default:
      return 'Sign In'
  }
}

export const SignIn = ({ onSuccess, onError }) => {
  const { signIn, loading: authLoading, error: authError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [buttonState, setButtonState] = useState('idle')
  const mountedRef = useRef(true)
  const submitTimeoutRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [])

  // Safe state updates
  const safeSetState = useCallback((setter) => {
    if (mountedRef.current) {
      setter()
    }
  }, [])

  // Update button state based on conditions
  useEffect(() => {
    if (authLoading || isSubmitting) {
      safeSetState(() => setButtonState('loading'))
    } else if (authError) {
      safeSetState(() => setButtonState('error'))
      // Auto-reset error state after 2 seconds
      submitTimeoutRef.current = setTimeout(() => {
        safeSetState(() => setButtonState('idle'))
      }, 2000)
    } else if (!authError && !authLoading && !isSubmitting) {
      safeSetState(() => setButtonState('idle'))
    }

    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [authLoading, isSubmitting, authError, safeSetState])

  // Clear validation errors when input changes
  useEffect(() => {
    if (validationErrors.email || validationErrors.password) {
      safeSetState(() => setValidationErrors({}))
    }
    if (authError) {
      clearError()
    }
  }, [email, password, clearError, validationErrors, authError])

  const validateForm = useCallback(() => {
    const errors = {}
    if (!email) errors.email = 'Email is required'
    if (!password) errors.password = 'Password is required'
    if (email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = 'Invalid email address'
    }
    if (password && password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    safeSetState(() => setValidationErrors(errors))
    return Object.keys(errors).length === 0
  }, [email, password, safeSetState])

  // Debounced submit handler with cleanup
  const debouncedSubmit = useCallback(
    debounce(async (email, password) => {
      try {
        const data = await signIn({ email, password })
        safeSetState(() => {
          setIsSubmitting(false)
          setButtonState('success')
        })
        if (onSuccess) onSuccess(data)
        // Reset success state after 1 second
        submitTimeoutRef.current = setTimeout(() => {
          safeSetState(() => setButtonState('idle'))
        }, 1000)
      } catch (err) {
        safeSetState(() => {
          setIsSubmitting(false)
          setButtonState('error')
        })
        if (onError) onError(err)
        // Reset error state after 2 seconds
        submitTimeoutRef.current = setTimeout(() => {
          safeSetState(() => setButtonState('idle'))
        }, 2000)
      }
    }, 300),
    [signIn, onSuccess, onError, safeSetState]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!validateForm() || isSubmitting) return

    safeSetState(() => {
      setIsSubmitting(true)
      setButtonState('loading')
    })
    debouncedSubmit(email, password)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSubmit.cancel()
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [debouncedSubmit])

  const isDisabled = buttonState === 'loading' || buttonState === 'success'

  return (
    <Form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isDisabled}
          error={validationErrors.email}
          aria-invalid={!!validationErrors.email}
          aria-describedby={validationErrors.email ? "email-error" : undefined}
        />
        <AnimatePresence>
          {validationErrors.email && (
            <ErrorMessage
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              id="email-error"
              role="alert"
            >
              {validationErrors.email}
            </ErrorMessage>
          )}
        </AnimatePresence>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isDisabled}
          error={validationErrors.password}
          aria-invalid={!!validationErrors.password}
          aria-describedby={validationErrors.password ? "password-error" : undefined}
        />
        <AnimatePresence>
          {validationErrors.password && (
            <ErrorMessage
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              id="password-error"
              role="alert"
            >
              {validationErrors.password}
            </ErrorMessage>
          )}
        </AnimatePresence>
      </div>

      <Button
        type="submit"
        disabled={isDisabled}
        $loading={buttonState === 'loading'}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        aria-disabled={isDisabled}
        aria-busy={buttonState === 'loading'}
        data-testid="sign-in-button"
      >
        {getButtonText(buttonState)}
      </Button>

      <AnimatePresence>
        {authError && (
          <ErrorMessage
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
          >
            {authError.message || 'An error occurred during sign in'}
          </ErrorMessage>
        )}
      </AnimatePresence>
    </Form>
  )
}

SignIn.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func
}

export default SignIn 