import React from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { AuthProvider } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import { useAuth } from './contexts/AuthContext'
import ChatContainer from './components/chat/ChatContainer'
import { SpaceContainer } from './components/spaces'
import ThemeToggle from './components/shared/ThemeToggle'

function ProtectedChat() {
  const { user, loading } = useAuth()

  if (loading) {
    return <Box p={4}>Loading...</Box>
  }

  if (!user) {
    return <Auth />
  }

  return <ChatContainer />
}

export default function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <ProtectedChat />
      </AuthProvider>
    </ChakraProvider>
  )
} 