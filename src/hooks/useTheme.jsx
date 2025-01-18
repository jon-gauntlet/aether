import { useState, useEffect } from 'react';
import { useColorMode } from '@chakra-ui/react';

export function useTheme() {
  const { colorMode, toggleColorMode } = useColorMode();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme !== colorMode) {
      toggleColorMode();
    }
    localStorage.setItem('theme', theme);
  }, [theme, colorMode, toggleColorMode]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    setTheme,
    toggleTheme,
  };
} 