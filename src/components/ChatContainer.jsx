import React, { useState, useRef, useEffect } from "react";
import { Box, Button, Input, Text, useColorModeValue, VStack, HStack, IconButton, useToast } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatContainer() {
  const { user, logout } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [session, setSession] = useState(null)
  const [showAuthForm, setShowAuthForm] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const fileInputRef = useRef(null)
  const toast = useToast()
  
  // Check for existing session in localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('session')
    if (savedSession) {
      setSession(JSON.parse(savedSession))
    }
  }, [])

  const handleSignIn = async () => {
    try {
      // Mock auth - in real app this would validate with Supabase
      const mockSession = {
        user: {
          id: Date.now().toString(),
          email: authEmail,
        }
      }
      setSession(mockSession)
      localStorage.setItem('session', JSON.stringify(mockSession))
      setShowAuthForm(false)
      setAuthEmail('')
      setAuthPassword('')
    } catch (error) {
      console.error('Error signing in:', error.message)
    }
  }

  const handleSignOut = async () => {
    setSession(null)
    localStorage.removeItem('session')
  }

  // Update current user based on session
  const currentUser = session ? {
    id: session.user.id,
    name: session.user.email?.split('@')[0] || 'You'
  } : { id: 'anonymous', name: 'Anonymous' }

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡']

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleTyping = () => {
    setIsTyping(true)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    const userMessage = {
      id: Date.now(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
      sender: 'user'
    }
    
    setMessages(prev => [...prev, userMessage])
    setText('')

    // Handle RAG query
    if (text.trim().toLowerCase().startsWith('/rag ')) {
      setIsLoading(true)
      try {
        const query = text.trim().slice(5)
        const response = await fetch('http://localhost:8002/api/rag/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: query })
        })

        if (!response.ok) throw new Error('RAG query failed')
        
        const data = await response.json()
        
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: data.answer || 'I could not find a relevant answer.',
          timestamp: new Date().toISOString(),
          sender: 'ai',
          sources: data.sources || []
        }])
      } catch (error) {
        console.error('RAG Error:', error)
        toast({
          title: 'Error',
          description: 'Failed to get AI response. Please try again.',
          status: 'error',
          duration: 3000,
        })
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: 'Sorry, I encountered an error processing your query.',
          timestamp: new Date().toISOString(),
          sender: 'ai'
        }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const deleteMessage = (msgId) => {
    setMessages(prev => prev.filter(msg => msg.id !== msgId))
  }

  const editMessage = (msg) => {
    setEditingId(msg.id)
    setText(msg.text)
  }

  const addReaction = (msgId, reaction) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        const newReactions = { ...msg.reactions }
        if (newReactions[reaction]?.includes(currentUser.id)) {
          newReactions[reaction] = newReactions[reaction].filter(id => id !== currentUser.id)
          if (newReactions[reaction].length === 0) delete newReactions[reaction]
        } else {
          newReactions[reaction] = [...(newReactions[reaction] || []), currentUser.id]
        }
        return { ...msg, reactions: newReactions }
      }
      return msg
    }))
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Mock file upload
    const attachment = {
      id: Date.now(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file)
    }

    setMessages(prev => [...prev, {
      id: Date.now(),
      text: `Sent file: ${file.name}`,
      timestamp: new Date().toISOString(),
      sender: 'user',
      reactions: {},
      attachments: [attachment]
    }])
  }

  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchText.toLowerCase())
  )

  const [isLoading, setIsLoading] = useState(false)

  return (
    <Box p={5} maxW="800px" mx="auto">
      <HStack mb={4} spacing={4}>
        {session ? (
          <>
            <Text fontSize="sm" color="gray.600">
              Signed in as {session.user.email}
            </Text>
            <Button
              size="sm"
              onClick={handleSignOut}
              variant="outline"
            >
              Sign Out
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            colorScheme="blue"
            onClick={() => setShowAuthForm(true)}
          >
            Sign In
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSearch(!showSearch)}
          leftIcon={<span>🔍</span>}
        >
          Search
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          display="none"
          onChange={handleFileUpload}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          leftIcon={<span>📎</span>}
        >
          Attach
        </Button>
        <Text fontSize="sm" color="gray.600" ml="auto">
          Type /rag followed by your question to use AI
        </Text>
      </HStack>

      {showSearch && (
        <Input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Search messages..."
          mb={4}
          size="sm"
        />
      )}

      {showAuthForm && !session && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Box bg="white" p={6} borderRadius="md" maxW="400px" w="90%">
            <Text fontSize="xl" mb={4}>Sign In</Text>
            <VStack spacing={4}>
              <Input
                type="email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="Email"
              />
              <Input
                type="password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="Password"
              />
              <HStack spacing={4} justifyContent="flex-end" w="100%">
                <Button variant="ghost" onClick={() => setShowAuthForm(false)}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleSignIn}>
                  Sign In
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>
      )}

      <Box
        h="500px"
        borderWidth={1}
        borderRadius="lg"
        mb={4}
        overflowY="auto"
        p={4}
        bg={useColorModeValue('white', 'gray.800')}
        boxShadow="sm"
      >
        <VStack spacing={4} align="stretch">
          {filteredMessages.map(msg => (
            <Box
              key={msg.id}
              alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
              maxW="70%"
              position="relative"
            >
              <Box
                bg={msg.sender === 'ai' ? 'gray.100' : 'blue.500'}
                color={msg.sender === 'user' ? 'white' : 'black'}
                p={3}
                borderRadius="lg"
                position="relative"
              >
                <Text>{msg.text}</Text>
                {msg.sources && msg.sources.length > 0 && (
                  <Box mt={2} pt={2} borderTopWidth={1} fontSize="sm" color="gray.600">
                    <Text fontWeight="bold">Sources:</Text>
                    <VStack align="stretch" pl={4} mt={1}>
                      {msg.sources.map((source, i) => (
                        <Text key={i}>{source}</Text>
                      ))}
                    </VStack>
                  </Box>
                )}
              </Box>
              <Text
                fontSize="xs"
                color="gray.500"
                textAlign={msg.sender === 'user' ? 'right' : 'left'}
                mt={1}
              >
                {new Date(msg.timestamp).toLocaleTimeString()}
              </Text>
            </Box>
          ))}
          <div ref={messagesEndRef} />
          {isLoading && (
            <Box
              p={3}
              bg="gray.100"
              borderRadius="lg"
              alignSelf="flex-start"
              mt={2}
            >
              <Text fontSize="sm" color="gray.600">
                Thinking...
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      <form onSubmit={handleSubmit}>
        <HStack spacing={4}>
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message... (use /rag for AI assistance)"
            isDisabled={isLoading}
          />
          <Button 
            type="submit" 
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Sending"
          >
            Send
          </Button>
        </HStack>
      </form>
    </Box>
  )
} 