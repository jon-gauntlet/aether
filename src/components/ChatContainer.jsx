import React from 'react'
import { Box, Button, Select, Text } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'

export function ChatContainer() {
  const { user, logout } = useAuth()

  if (!user) {
    return (
      <Box p={4}>
        <Text>Please log in to access the chat.</Text>
      </Box>
    )
  }

  return (
    <Box p={4}>
      <Button 
        onClick={logout} 
        data-testid="logout-button"
        colorScheme="red"
        size="sm"
        position="absolute"
        top={4}
        right={4}
      >
        Logout
      </Button>
      
      <Select 
        data-testid="channel-select" 
        defaultValue="general"
        mb={4}
      >
        <option value="general">General</option>
        <option value="support">Support</option>
        <option value="random">Random</option>
      </Select>

      <Box borderWidth={1} borderRadius="lg" p={4} minH="400px">
        {/* Chat messages will go here */}
      </Box>
    </Box>
  )
} 