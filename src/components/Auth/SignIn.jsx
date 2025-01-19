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

export const SignIn = ({ onSuccess }) => {
  const { signIn, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const validateForm = useCallback(() => {
    const errors = {}
    if (!email) errors.email = 'Email is required'
    if (!password) errors.password = 'Password is required'
    if (email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = 'Invalid email address'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [email, password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (!validateForm()) return

    try {
      const data = await signIn({ email, password })
      if (onSuccess) onSuccess(data)
    } catch (err) {
      // Error is handled by AuthProvider
    }
  }

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
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </Form>
  )
}

SignIn.propTypes = {
  onSuccess: PropTypes.func
}

export default SignIn 