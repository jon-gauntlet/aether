import React from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { AuthProvider } from './contexts/AuthContext'
import { EnergyProvider } from './core/energy/EnergyProvider'
import { FlowProvider } from './core/flow/FlowProvider'
import { SpaceProvider } from './core/space/SpaceProvider'
import ChatContainer from './components/ChatContainer'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ChakraProvider>
      <ErrorBoundary>
        <AuthProvider>
          <EnergyProvider>
            <FlowProvider>
              <SpaceProvider>
                <Box p={4}>
                  <ChatContainer />
                </Box>
              </SpaceProvider>
            </FlowProvider>
          </EnergyProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ChakraProvider>
  )
}

export default App
