import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useAuth } from './AuthProvider'
import styled from 'styled-components'
import { motion } from 'framer-motion'

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
  transition: background-color 0.2s ease;

  &:hover {
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

export const SignUp = ({ onSuccess }) => {
  const { signUp, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const getPasswordStrength = useCallback((password) => {
    if (!password) return ''
    if (password.length < 8) return 'weak'
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*]/.test(password)
    const strength = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length
    return strength === 1 ? 'weak' : strength === 2 ? 'medium' : 'strong'
  }, [])

  const validateForm = useCallback(() => {
    const errors = {}
    if (!email) errors.email = 'Email is required'
    if (!password) errors.password = 'Password is required'
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password'
    if (email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = 'Invalid email address'
    }
    if (password && password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (password && confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [email, password, confirmPassword])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!validateForm()) return

    try {
      const data = await signUp({ email, password })
      if (onSuccess) onSuccess(data)
    } catch (err) {
      // Error is handled by AuthProvider
    }
  }

  const passwordStrength = getPasswordStrength(password)

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
          error={validationErrors.email || error}
          disabled={loading}
          aria-invalid={!!validationErrors.email}
          aria-describedby={validationErrors.email ? 'email-error' : undefined}
        />
        {validationErrors.email && (
          <ErrorMessage
            role="alert"
            id="email-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {validationErrors.email}
          </ErrorMessage>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={validationErrors.password || error}
          disabled={loading}
          aria-invalid={!!validationErrors.password}
          aria-describedby={validationErrors.password ? 'password-error' : undefined}
        />
        <PasswordStrength>
          <PasswordStrengthIndicator
            strength={passwordStrength}
            initial={{ width: '0%' }}
            animate={{ width: passwordStrength ? '100%' : '0%' }}
            transition={{ duration: 0.3 }}
          />
        </PasswordStrength>
        {validationErrors.password && (
          <ErrorMessage
            role="alert"
            id="password-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {validationErrors.password}
          </ErrorMessage>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={validationErrors.confirmPassword || error}
          disabled={loading}
          aria-invalid={!!validationErrors.confirmPassword}
          aria-describedby={validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
        />
        {validationErrors.confirmPassword && (
          <ErrorMessage
            role="alert"
            id="confirm-password-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {validationErrors.confirmPassword}
          </ErrorMessage>
        )}
      </div>

      {error && (
        <ErrorMessage
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </ErrorMessage>
      )}

      <Button
        type="submit"
        disabled={loading}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? 'Creating account...' : 'Sign up'}
      </Button>
    </Form>
  )
}

SignUp.propTypes = {
  onSuccess: PropTypes.func
}

export default SignUp 