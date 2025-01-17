import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
  colors: {
    primary: {
      50: '#E6F6FF',
      100: '#BAE3FF',
      200: '#7CC4FA',
      300: '#47A9F5',
      400: '#2196F3',
      500: '#1976D2',
      600: '#1565C0',
      700: '#0D47A1',
      800: '#0A2472',
      900: '#061B64',
    },
    secondary: {
      50: '#F5F3FF',
      100: '#E9E3FF',
      200: '#D1C4FF',
      300: '#B39DFF',
      400: '#9B7CFF',
      500: '#7B61FF',
      600: '#6B4EFF',
      700: '#5A3FFF',
      800: '#4D35FF',
      900: '#3620FF',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
          },
          _active: {
            bg: 'primary.700',
          },
        },
        outline: {
          border: '2px solid',
          borderColor: 'primary.500',
          color: 'primary.500',
          _hover: {
            bg: 'primary.50',
          },
        },
        ghost: {
          color: 'primary.500',
          _hover: {
            bg: 'primary.50',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'gray.300',
            _hover: {
              borderColor: 'primary.500',
            },
            _focus: {
              borderColor: 'primary.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-primary-500)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900',
      },
    },
  },
});

export default theme; 