import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import styled from 'styled-components'

const ToggleButton = styled(motion.button)`
  position: relative;
  width: 56px;
  height: 28px;
  border-radius: 14px;
  padding: 2px;
  border: none;
  cursor: pointer;
  background: ${props => props.$isDark ? '#1a202c' : '#e2e8f0'};
  transition: background-color 0.3s;

  &:focus-visible {
    outline: 2px solid #3182ce;
    outline-offset: 2px;
  }

  @media (max-width: 640px) {
    width: 48px;
    height: 24px;
  }
`

const Handle = styled(motion.div)`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (max-width: 640px) {
    width: 20px;
    height: 20px;
  }
`

const spring = {
  type: "spring",
  stiffness: 500,
  damping: 30
}

export default function ThemeToggle() {
  const { isDarkMode, toggleDarkMode } = useTheme()

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleDarkMode()
    }
  }

  return (
    <ToggleButton
      $isDark={isDarkMode}
      onClick={toggleDarkMode}
      onKeyDown={handleKeyDown}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      role="switch"
      aria-checked={isDarkMode}
      tabIndex={0}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Handle
        animate={{
          x: isDarkMode ? 28 : 0,
          rotate: isDarkMode ? 180 : 0
        }}
        transition={spring}
      >
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{
            rotate: isDarkMode ? 360 : 0
          }}
          transition={spring}
        >
          {isDarkMode ? (
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              stroke="#1a202c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <circle
              cx="12"
              cy="12"
              r="5"
              stroke="#ed8936"
              strokeWidth="2"
              fill="#ed8936"
            >
              <animate
                attributeName="r"
                values="5;6;5"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </motion.svg>
      </Handle>
    </ToggleButton>
  )
} 