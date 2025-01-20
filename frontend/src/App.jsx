import React from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { RAGProvider } from './contexts/RAGContext'
import ChatContainer from './components/ChatContainer'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ChakraProvider>
      <ErrorBoundary>
        <RAGProvider>
          <Box h="100vh" bg="gray.50">
            <ChatContainer />
          </Box>
        </RAGProvider>
      </ErrorBoundary>
    </ChakraProvider>
  )
}

export default App
