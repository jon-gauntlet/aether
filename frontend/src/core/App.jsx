import React from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { RAGProvider } from '../contexts/RAGContext'
import ChatContainer from '../components/ChatContainer'

export default function App() {
  return (
    <ChakraProvider>
      <RAGProvider>
        <Box h="100vh" bg="gray.50">
          <ChatContainer />
        </Box>
      </RAGProvider>
    </ChakraProvider>
  )
} 