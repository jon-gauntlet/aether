import React from 'react'
import styled, { keyframes } from 'styled-components'
import { useAuth } from '@/core/auth/AuthProvider'
import { StyledContainerProps } from '@/components/shared/types'

export interface ConsciousnessState {
  energyLevel: number
  isCoherent: boolean
}

interface ConsciousnessProps extends StyledContainerProps {
  onSignIn?: () => void
  onSignOut?: () => void
}

const breatheAnimation = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`

const ConsciousnessContainer = styled.div<StyledContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.background};
  transition: all ${({ theme }) => theme.transitions.normal};
  transform: scale(${({ isActive }) => (isActive ? 1.05 : 1)});
  box-shadow: ${({ theme }) => theme.shadows.medium};
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
  }
`

const EnergyField = styled.div<{ energyLevel?: number }>`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.secondary} 100%
  );
  opacity: ${({ energyLevel }) => (energyLevel ? energyLevel / 100 : 0.5)};
  animation: ${breatheAnimation} 4s ease-in-out infinite;
`

const EnergyLevel = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 1rem;
`

const CoherenceStatus = styled.div<{ isCoherent?: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ theme, isCoherent }) =>
    isCoherent ? theme.colors.success : theme.colors.warning};
  position: absolute;
  top: 1rem;
  right: 1rem;
  transition: background-color ${({ theme }) => theme.transitions.fast};
`

const AuthButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }
`

export const ConsciousnessComponent: React.FC<ConsciousnessProps> = ({
  onSignIn,
  onSignOut
}) => {
  const { user, consciousnessState, signIn, signOut } = useAuth()

  const handleAuth = async () => {
    if (user) {
      await signOut()
      onSignOut?.()
    } else {
      await signIn()
      onSignIn?.()
    }
  }

  return (
    <ConsciousnessContainer data-testid="consciousness-container" isActive={consciousnessState.isCoherent}>
      <EnergyField energyLevel={consciousnessState.energyLevel} />
      <EnergyLevel>{consciousnessState.energyLevel}</EnergyLevel>
      <span>Energy Level</span>
      <CoherenceStatus data-testid="coherence-status" isCoherent={consciousnessState.isCoherent} />
      <AuthButton onClick={handleAuth}>
        {user ? 'Sign Out' : 'Sign In'}
      </AuthButton>
    </ConsciousnessContainer>
  )
} 