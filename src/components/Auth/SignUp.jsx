import React, { useState, useCallback, useRef, useEffect } from 'react'
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
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral[700]};
  margin-bottom: 0.25rem;
`

const PasswordStrength = styled.div`
  height: 4px;
  background-color: ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  margin-top: 0.5rem;
  overflow: hidden;
`

const PasswordStrengthIndicator = styled(motion.div)`
  height: 100%;
  background-color: ${({ theme, strength }) => {
    switch (strength) {
      case 'weak':
        return theme.colors.error[500]
      case 'medium':
        return theme.colors.warning[500]
      case 'strong':
        return theme.colors.success[500]
      default:
        return theme.colors.neutral[300]
    }
  }};
`

const PasswordRequirements = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.neutral[600]};

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;

    &::before {
      content: '';
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: ${({ theme }) => theme.colors.neutral[300]};
    }

    &[data-valid="true"]::before {
      background-color: ${({ theme }) => theme.colors.success[500]};
    }
  }
`

export const SignUp = ({ onSuccess, onError }) => {
  const { signUp, loading: authLoading, error: authError, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Safe state updates
  const safeSetState = useCallback((setter) => {
    if (mountedRef.current) {
      setter()
    }
  }, [])

  const getPasswordRequirements = useCallback((password) => {
    return {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    }
  }, [])

  const getPasswordStrength = useCallback((password) => {
    if (!password) return ''
    const requirements = getPasswordRequirements(password)
    const score = Object.values(requirements).filter(Boolean).length
    return score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong'
  }, [getPasswordRequirements])

  const validateForm = useCallback(() => {
    const errors = {}
    if (!email) errors.email = 'Email is required'
    if (!password) errors.password = 'Password is required'
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password'
    
    if (email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = 'Invalid email address'
    }

    const requirements = getPasswordRequirements(password)
    if (password && !requirements.length) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (password && !requirements.lowercase) {
      errors.password = 'Password must contain at least one lowercase letter'
    }
    if (password && !requirements.uppercase) {
      errors.password = 'Password must contain at least one uppercase letter'
    }
    if (password && !requirements.number) {
      errors.password = 'Password must contain at least one number'
    }
    if (password && !requirements.special) {
      errors.password = 'Password must contain at least one special character'
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    safeSetState(() => setValidationErrors(errors))
    return Object.keys(errors).length === 0
  }, [email, password, confirmPassword, getPasswordRequirements, safeSetState])

  // Debounced submit handler with cleanup
  const debouncedSubmit = useCallback(
    debounce(async (email, password) => {
      try {
        const data = await signUp({ email, password })
        safeSetState(() => setIsSubmitting(false))
        if (onSuccess) onSuccess(data)
      } catch (err) {
        safeSetState(() => setIsSubmitting(false))
        if (onError) onError(err)
      }
    }, 300),
    [signUp, onSuccess, onError, safeSetState]
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!validateForm() || isSubmitting) return

    safeSetState(() => setIsSubmitting(true))
    debouncedSubmit(email, password)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSubmit.cancel()
    }
  }, [debouncedSubmit])

  const passwordRequirements = getPasswordRequirements(password)
  const passwordStrength = getPasswordStrength(password)
  const isDisabled = authLoading || isSubmitting

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
          error={validationErrors.email || authError}
          disabled={isDisabled}
          aria-invalid={!!validationErrors.email}
          aria-describedby={validationErrors.email ? 'email-error' : undefined}
          data-testid="email-input"
        />
        <AnimatePresence mode="wait">
          {validationErrors.email && (
            <ErrorMessage
              role="alert"
              id="email-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              data-testid="email-error"
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
          error={validationErrors.password || authError}
          disabled={isDisabled}
          aria-invalid={!!validationErrors.password}
          aria-describedby={validationErrors.password ? 'password-error' : undefined}
          data-testid="password-input"
        />
        <PasswordStrength>
          <PasswordStrengthIndicator
            strength={passwordStrength}
            initial={{ width: '0%' }}
            animate={{ width: passwordStrength ? '100%' : '0%' }}
            transition={{ duration: 0.3 }}
          />
        </PasswordStrength>
        <PasswordRequirements>
          <li data-valid={passwordRequirements.length}>At least 8 characters</li>
          <li data-valid={passwordRequirements.lowercase}>One lowercase letter</li>
          <li data-valid={passwordRequirements.uppercase}>One uppercase letter</li>
          <li data-valid={passwordRequirements.number}>One number</li>
          <li data-valid={passwordRequirements.special}>One special character</li>
        </PasswordRequirements>
        <AnimatePresence mode="wait">
          {validationErrors.password && (
            <ErrorMessage
              role="alert"
              id="password-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              data-testid="password-error"
            >
              {validationErrors.password}
            </ErrorMessage>
          )}
        </AnimatePresence>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={validationErrors.confirmPassword || authError}
          disabled={isDisabled}
          aria-invalid={!!validationErrors.confirmPassword}
          aria-describedby={validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
          data-testid="confirm-password-input"
        />
        <AnimatePresence mode="wait">
          {validationErrors.confirmPassword && (
            <ErrorMessage
              role="alert"
              id="confirm-password-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              data-testid="confirm-password-error"
            >
              {validationErrors.confirmPassword}
            </ErrorMessage>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {authError && (
          <ErrorMessage
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            data-testid="auth-error"
          >
            {authError.includes('Network error') ? 'Unable to connect. Please check your internet connection.' :
             authError.includes('Too many requests') ? 'Too many attempts. Please try again later.' :
             authError.includes('Email taken') ? 'This email is already registered.' :
             authError}
          </ErrorMessage>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        $loading={isDisabled}
        data-testid="submit-button"
      >
        {isDisabled ? 'Creating account...' : 'Sign up'}
      </Button>
    </Form>
  )
}

SignUp.propTypes = {
  onSuccess: PropTypes.func,
  onError: PropTypes.func
}

export default SignUp 