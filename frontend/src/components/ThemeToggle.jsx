import { IconButton, useColorMode } from '@chakra-ui/react';
import { withErrorBoundary } from './ErrorBoundary';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

function ThemeToggleComponent() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      data-testid="theme-toggle"
      aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      colorScheme={colorMode === 'light' ? 'gray' : 'yellow'}
      size="md"
    />
  );
}

export const ThemeToggle = withErrorBoundary(ThemeToggleComponent); 