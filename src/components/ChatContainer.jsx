import React, { useState, useRef, useEffect } from "react";
import { Box, Button, Input, Text, useColorModeValue, VStack, HStack, IconButton } from '@chakra-ui/react';
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

    if (editingId) {
      setMessages(prev => prev.map(msg => 
        msg.id === editingId ? { ...msg, text: text.trim(), isEdited: true } : msg
      ))
      setEditingId(null)
    } else {
      // Add user message
      const userMessage = {
        id: Date.now(),
        text: text.trim(),
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        reactions: {},
        attachments: []
      }
      setMessages(prev => [...prev, userMessage])

      // If message starts with /rag, send to RAG system
      if (text.trim().startsWith('/rag ')) {
        try {
          const query = text.trim().slice(5)
          const response = await fetch('http://localhost:8002/api/rag/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: query })
          })

          if (!response.ok) throw new Error('RAG query failed')
          
          const data = await response.json()
          
          // Add AI response
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: data.answer || 'Sorry, I could not process that query.',
            timestamp: new Date().toISOString(),
            userId: 'ai',
            reactions: {},
            attachments: [],
            sources: data.sources || []
          }])
        } catch (error) {
          console.error('RAG Error:', error)
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: 'Sorry, there was an error processing your query.',
            timestamp: new Date().toISOString(),
            userId: 'ai',
            reactions: {},
            attachments: []
          }])
        }
      }
    }
    setText('')
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
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
      userId: currentUser.id,
      reactions: {},
      attachments: [attachment]
    }])
  }

  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <Box p={5} maxW="600px" mx="auto">
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
        h="400px"
        borderWidth={1}
        borderRadius="md"
        mb={4}
        overflowY="auto"
        p={4}
      >
        <VStack spacing={4} align="stretch">
          {filteredMessages.map(msg => {
            const isCurrentUser = msg.userId === currentUser.id
            const isAI = msg.userId === 'ai'
            return (
              <Box
                key={msg.id}
                alignSelf={isCurrentUser ? 'flex-end' : 'flex-start'}
                maxW="70%"
                position="relative"
              >
                <Box
                  bg={isAI ? 'gray.50' : (isCurrentUser ? 'blue.500' : 'gray.100')}
                  color={isCurrentUser ? 'white' : 'black'}
                  p={3}
                  borderRadius="lg"
                  position="relative"
                >
                  <Text>{msg.text}</Text>
                  {msg.sources && msg.sources.length > 0 && (
                    <Box mt={2} pt={2} borderTopWidth={1} fontSize="sm" color="gray.600">
                      <Text>Sources:</Text>
                      <VStack align="stretch" pl={4} mt={1}>
                        {msg.sources.map((source, i) => (
                          <Text key={i}>{source}</Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                  {msg.isEdited && (
                    <Text as="span" fontSize="xs" opacity={0.7} ml={2}>(edited)</Text>
                  )}
                  {msg.attachments?.map(attachment => (
                    <Box
                      key={attachment.id}
                      mt={2}
                      p={2}
                      bg="blackAlpha.100"
                      borderRadius="md"
                      fontSize="sm"
                    >
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: isCurrentUser ? 'white' : 'blue' }}
                      >
                        📎 {attachment.name}
                      </a>
                    </Box>
                  ))}
                </Box>
                {isCurrentUser && (
                  <HStack
                    position="absolute"
                    right={-10}
                    top={0}
                    spacing={1}
                  >
                    <IconButton
                      size="xs"
                      icon={<DeleteIcon />}
                      onClick={() => deleteMessage(msg.id)}
                      variant="ghost"
                    />
                    <IconButton
                      size="xs"
                      icon={<EditIcon />}
                      onClick={() => editMessage(msg)}
                      variant="ghost"
                    />
                  </HStack>
                )}
                <Text
                  fontSize="xs"
                  color="gray.500"
                  textAlign={isCurrentUser ? 'right' : 'left'}
                  mt={1}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
                <HStack
                  spacing={1}
                  justify={isCurrentUser ? 'flex-end' : 'flex-start'}
                  wrap="wrap"
                  mt={1}
                >
                  {Object.entries(msg.reactions || {}).map(([reaction, users]) => (
                    <Button
                      key={reaction}
                      size="xs"
                      variant={users.includes(currentUser.id) ? 'solid' : 'ghost'}
                      onClick={() => addReaction(msg.id, reaction)}
                    >
                      {reaction} {users.length}
                    </Button>
                  ))}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={(event) => {
                      const menu = document.createElement('div')
                      menu.style.position = 'fixed'
                      menu.style.background = 'white'
                      menu.style.border = '1px solid #ccc'
                      menu.style.borderRadius = '8px'
                      menu.style.padding = '4px'
                      menu.style.display = 'flex'
                      menu.style.gap = '4px'
                      menu.style.zIndex = '1000'
                      menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)'
                      
                      reactions.forEach(reaction => {
                        const btn = document.createElement('button')
                        btn.innerText = reaction
                        btn.style.background = 'none'
                        btn.style.border = 'none'
                        btn.style.cursor = 'pointer'
                        btn.style.fontSize = '16px'
                        btn.style.padding = '4px'
                        btn.style.borderRadius = '4px'
                        btn.style.transition = 'background 0.2s'
                        btn.onmouseover = () => btn.style.background = '#f0f0f0'
                        btn.onmouseout = () => btn.style.background = 'none'
                        btn.onclick = () => {
                          addReaction(msg.id, reaction)
                          menu.remove()
                        }
                        menu.appendChild(btn)
                      })
                      
                      document.body.appendChild(menu)
                      const rect = event.currentTarget.getBoundingClientRect()
                      menu.style.left = `${rect.left}px`
                      menu.style.top = `${rect.bottom + 5}px`
                      
                      const menuRect = menu.getBoundingClientRect()
                      if (menuRect.right > window.innerWidth) {
                        menu.style.left = `${window.innerWidth - menuRect.width - 5}px`
                      }
                      if (menuRect.bottom > window.innerHeight) {
                        menu.style.top = `${rect.top - menuRect.height - 5}px`
                      }
                      
                      const closeMenu = (e) => {
                        if (!menu.contains(e.target)) {
                          menu.remove()
                          document.removeEventListener('click', closeMenu)
                        }
                      }
                      requestAnimationFrame(() => {
                        document.addEventListener('click', closeMenu)
                      })
                    }}
                  >
                    + Add Reaction
                  </Button>
                </HStack>
              </Box>
            )
          })}
          <div ref={messagesEndRef} />
          {isTyping && (
            <Box
              p={3}
              bg="gray.100"
              borderRadius="lg"
              alignSelf="flex-start"
              mt={2}
            >
              <Text fontSize="sm" color="gray.600">
                Typing...
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      <form onSubmit={handleSubmit}>
        <HStack spacing={4}>
          <Input
            value={text}
            onChange={e => {
              setText(e.target.value)
              if (!editingId) handleTyping()
            }}
            placeholder={editingId ? "Edit message..." : "Type a message..."}
          />
          <Button type="submit" colorScheme="blue">
            {editingId ? 'Save' : 'Send'}
          </Button>
          {editingId && (
            <Button
              onClick={() => {
                setEditingId(null)
                setText('')
              }}
              variant="ghost"
            >
              Cancel
            </Button>
          )}
        </HStack>
      </form>
    </Box>
  )
} 