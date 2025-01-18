import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { Box, Container, Heading, VStack } from '@chakra-ui/react'

export function Auth() {
  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Box 
          w="full" 
          bg="gray.800" 
          p={8} 
          rounded="lg" 
          shadow="lg"
          borderWidth={1}
          borderColor="gray.700"
        >
          <VStack spacing={6}>
            <Heading size="lg" textAlign="center" color="white">
              Welcome to Aether Chat
            </Heading>
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#3182CE',
                      brandAccent: '#4299E1',
                      inputBackground: '#2D3748',
                      inputText: 'white',
                      inputPlaceholder: 'gray',
                    },
                  },
                },
                style: {
                  button: {
                    borderRadius: '0.375rem',
                    height: '40px',
                  },
                  input: {
                    borderRadius: '0.375rem',
                    height: '40px',
                  },
                },
              }}
              providers={['google']}
              redirectTo={window.location.origin}
            />
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
} 