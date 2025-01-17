import React from 'react';
import { IconButton, useColorMode } from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';

export const ThemeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <IconButton
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      colorScheme={isDark ? 'yellow' : 'gray'}
      backgroundColor={isDark ? 'gray.700' : 'gray.100'}
      _hover={{
        backgroundColor: isDark ? 'gray.600' : 'gray.200'
      }}
    />
  );
}; 