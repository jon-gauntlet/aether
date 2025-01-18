import React from 'react'
import { IconButton, useColorMode } from '@chakra-ui/react'
import { SunIcon, MoonIcon } from '@chakra-ui/icons'

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === 'dark'

  return (
    <IconButton
      data-testid="theme-toggle"
      data-theme={colorMode}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      icon={isDark ? 
        <SunIcon data-testid="sun-icon" /> : 
        <MoonIcon data-testid="moon-icon" />
      }
      onClick={toggleColorMode}
      size="md"
      variant="ghost"
      colorScheme={isDark ? 'yellow' : 'purple'}
    />
  )
} 