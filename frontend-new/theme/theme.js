import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
  components: {
    Container: {
      baseStyle: {
        maxW: 'container.lg',
      },
    },
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: 'blue.400',
      },
    },
  },
})

export default theme 