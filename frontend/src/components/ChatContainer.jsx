import { useState, useEffect, useMemo } from 'react';
import { Box, VStack, Container, useToast, Text, Button, Textarea, Spinner, Select, HStack } from '@chakra-ui/react';
import useRealTimeUpdates from '../hooks/useRealTimeUpdates';

// WebSocket URL from environment or default
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [channel, setChannel] = useState('general');
  const toast = useToast();

  // Create WebSocket URL with channel
  const wsUrl = useMemo(() => `${WS_BASE_URL}/${channel}`, [channel]);

  // Initialize WebSocket connection
  const { isConnected, sendMessage } = useRealTimeUpdates(wsUrl, {
    onMessage: (data) => {
      // Only add messages from other users in the same channel
      if (data.username !== username && data.channel === channel) {
        setMessages(prev => [...prev, data]);
      }
    }
  });

  // Load messages from local storage
  useEffect(() => {
    const savedMessages = localStorage.getItem(`messages_${channel}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([]); // Clear messages when switching to a new channel
    }
  }, [channel]);

  // Save messages to local storage
  useEffect(() => {
    localStorage.setItem(`messages_${channel}`, JSON.stringify(messages));
  }, [messages, channel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !username) return;

    const newMessage = {
      type: 'user',
      content: input,
      username,
      timestamp: new Date().toISOString(),
      channel
    };

    // Add message locally
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    
    // Broadcast via WebSocket
    if (isConnected) {
      sendMessage(newMessage);
    } else {
      toast({
        title: 'Connection Error',
        description: 'Message saved locally. Reconnecting...',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const channels = ['general', 'random', 'help'];

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={4} align="stretch">
        {/* Connection Status */}
        <Box textAlign="right">
          <Text 
            fontSize="sm" 
            color={isConnected ? 'green.500' : 'red.500'}
          >
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </Text>
        </Box>

        {/* Channel Selection */}
        <HStack>
          <Select 
            value={channel} 
            onChange={(e) => setChannel(e.target.value)}
            bg="gray.700"
            color="white"
          >
            {channels.map(ch => (
              <option key={ch} value={ch}>#{ch}</option>
            ))}
          </Select>
          
          {/* Username Input */}
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              localStorage.setItem('username', e.target.value);
            }}
            placeholder="Your name"
            style={{
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: '#2D3748',
              color: 'white',
              border: 'none'
            }}
          />
        </HStack>

        {/* Messages */}
        <Box 
          bg="gray.800" 
          p={4} 
          borderRadius="md" 
          minH="400px" 
          maxH="600px" 
          overflowY="auto"
        >
          {messages.map((msg, idx) => (
            <Box 
              key={idx} 
              bg={msg.username === username ? 'blue.800' : 'gray.700'} 
              p={3} 
              borderRadius="md" 
              mb={2}
            >
              <Text color="gray.400" fontSize="sm" mb={1}>
                {msg.username} • {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>
              <Text color="white">{msg.content}</Text>
            </Box>
          ))}
          {isLoading && (
            <Box textAlign="center" py={4}>
              <Spinner color="blue.500" />
            </Box>
          )}
        </Box>

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <VStack spacing={2}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={username ? "Type a message..." : "Enter your name above to chat"}
              bg="gray.700"
              color="white"
              border="none"
              _placeholder={{ color: 'gray.400' }}
              disabled={!username}
            />
            <Button 
              type="submit" 
              colorScheme="blue" 
              isLoading={isLoading}
              width="full"
              disabled={!username}
            >
              Send
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
} 