import React from 'react'
import { motion } from 'framer-motion'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Container = styled.div`
  width: 100%;
  background: ${props => props.$isDark ? '#374151' : '#E5E7EB'};
  border-radius: 9999px;
  overflow: hidden;
  height: ${props => props.$size === 'sm' ? '4px' : '8px'};
  position: relative;
`

const Bar = styled(motion.div)`
  height: 100%;
  background: ${props => {
    if (props.$status === 'error') return '#EF4444'
    if (props.$status === 'success') return '#10B981'
    return '#3B82F6'
  }};
  border-radius: 9999px;
  position: relative;
`

const Pulse = styled(motion.div)`
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    ${props => props.$isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'},
    transparent
  );
`

const Label = styled.div`
  font-size: ${props => props.$size === 'sm' ? '0.75rem' : '0.875rem'};
  color: ${props => props.$isDark ? '#9CA3AF' : '#6B7280'};
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export default function ProgressIndicator({
  progress = 0,
  status = 'progress',
  size = 'md',
  showLabel = true,
  isDark = false,
  label,
  animate = true
}) {
  const formattedProgress = Math.min(100, Math.max(0, Math.round(progress)))
  
  return (
    <div>
      <Container $size={size} $isDark={isDark}>
        <Bar
          $status={status}
          initial={animate ? { width: 0 } : { width: `${formattedProgress}%` }}
          animate={{ width: `${formattedProgress}%` }}
          transition={{
            duration: animate ? 0.5 : 0,
            ease: 'easeOut'
          }}
        >
          {status === 'progress' && animate && (
            <Pulse
              $isDark={isDark}
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
        </Bar>
      </Container>
      
      {showLabel && (
        <Label $size={size} $isDark={isDark}>
          <span>{label || `${formattedProgress}% Complete`}</span>
          {status === 'error' && <span>Error</span>}
          {status === 'success' && <span>Complete</span>}
        </Label>
      )}
    </div>
  )
}

ProgressIndicator.propTypes = {
  progress: PropTypes.number,
  status: PropTypes.oneOf(['progress', 'error', 'success']),
  size: PropTypes.oneOf(['sm', 'md']),
  showLabel: PropTypes.bool,
  isDark: PropTypes.bool,
  label: PropTypes.string,
  animate: PropTypes.bool
}

// Variants for different states
export const progressVariants = {
  initial: {
    width: 0,
    opacity: 0
  },
  animate: {
    width: '100%',
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

// Helper hook for managing progress state
export const useProgress = (initialProgress = 0) => {
  const [progress, setProgress] = React.useState(initialProgress)
  const [status, setStatus] = React.useState('progress')

  const updateProgress = (newProgress) => {
    setProgress(Math.min(100, Math.max(0, newProgress)))
  }

  const complete = () => {
    setProgress(100)
    setStatus('success')
  }

  const error = () => {
    setStatus('error')
  }

  const reset = () => {
    setProgress(0)
    setStatus('progress')
  }

  return {
    progress,
    status,
    updateProgress,
    complete,
    error,
    reset
  }
} 