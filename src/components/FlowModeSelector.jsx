import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { motion, AnimatePresence } from 'framer-motion'

const Container = styled(motion.div)`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`

const ModeButton = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  color: #4B5563;
  background: transparent;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 140px;
  
  &.active {
    background: #EBF5FF;
    color: #2563EB;
    border-color: #93C5FD;
    font-weight: 600;
  }

  &:hover:not(.active) {
    background: #F3F4F6;
    color: #1F2937;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`

const IconWrapper = styled(motion.span)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`

const modeIcons = {
  Natural: '🌿',
  Guided: '🧭',
  Resonant: '✨'
}

const modeDescriptions = {
  Natural: 'Flow with intuitive development',
  Guided: 'Step-by-step assistance',
  Resonant: 'AI-enhanced workflow'
}

const buttonVariants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 }
}

export const FlowModeSelector = ({ 
  currentMode, 
  onSelect, 
  disabled = false,
  loading = false 
}) => {
  const modes = ['Natural', 'Guided', 'Resonant']
  
  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {modes.map((mode, index) => (
        <motion.div
          key={mode}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={buttonVariants}
          transition={{ delay: index * 0.1 }}
          style={{ width: '100%' }}
        >
          <ModeButton
            className={currentMode === mode ? 'active' : ''}
            onClick={() => onSelect(mode)}
            disabled={disabled || loading}
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            aria-label={`Select ${mode} mode - ${modeDescriptions[mode]}`}
            title={modeDescriptions[mode]}
            role="radio"
            aria-checked={currentMode === mode}
          >
            <IconWrapper
              animate={{ 
                scale: currentMode === mode ? 1.1 : 1,
                rotate: currentMode === mode ? [0, 15, -15, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {modeIcons[mode]}
            </IconWrapper>
            {mode}
          </ModeButton>
          {currentMode === mode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-gray-500 mt-1 text-center"
            >
              {modeDescriptions[mode]}
            </motion.div>
          )}
        </motion.div>
      ))}
    </Container>
  )
}

FlowModeSelector.propTypes = {
  currentMode: PropTypes.oneOf(['Natural', 'Guided', 'Resonant']).isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool
}

FlowModeSelector.defaultProps = {
  currentMode: 'Natural',
  disabled: false,
  loading: false
}