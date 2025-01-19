import React from 'react'
import PropTypes from 'prop-types'
import { useAuth } from './AuthProvider'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const Button = styled(motion.button)`
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.neutral[200]};
  color: ${({ theme }) => theme.colors.neutral[700]};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[300]};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.neutral[100]};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

export const SignOut = ({ onSuccess }) => {
  const { signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      if (onSuccess) onSuccess()
    } catch (err) {
      // Error is handled by AuthProvider
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={loading}
      whileTap={{ scale: 0.98 }}
      aria-label="Sign out"
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}

SignOut.propTypes = {
  onSuccess: PropTypes.func
}

export default SignOut 