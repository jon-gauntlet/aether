import React, { useState, useEffect, useCallback } from 'react'
import { Box, VStack, useToast } from '@chakra-ui/react'
import { ChatMessageList } from './ChatMessageList'
import { ChatInput } from './ChatInput'
import { FileUpload } from './FileUpload'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchMessages, sendMessage, subscribeToMessages, uploadFile as uploadFileApi } from '../services/apiClient'

export function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [channel, setChannel] = useState('general')
  const toast = useToast()

  const { data: chatHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chatHistory', channel],
    queryFn: () => fetchMessages(channel),
    onError: () => {
      toast({
        title: 'Failed to load chat history',
        status: 'error',
        duration: 3000,
      })
    },
  })

  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory)
    }
  }, [chatHistory])

  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = subscribeToMessages(channel, (newMessage) => {
      setMessages(prev => [...prev, newMessage])
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [channel])

  const { mutate: sendMessageMutation, isLoading: isSending } = useMutation({
    mutationFn: (message) => sendMessage(message, channel),
    onError: () => {
      toast({
        title: 'Failed to send message',
        status: 'error',
        duration: 3000,
      })
    },
  })

  const { mutate: uploadFile, isLoading: isUploading } = useMutation({
    mutationFn: (file) => uploadFileApi(file, channel),
    onSuccess: () => {
      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
      })
    },
    onError: () => {
      toast({
        title: 'Failed to upload file',
        status: 'error',
        duration: 3000,
      })
    },
  })

  const handleSendMessage = useCallback((text) => {
    sendMessageMutation(text)
  }, [sendMessageMutation])

  return (
    <VStack h="100%" spacing={4} p={4}>
      <Box flex={1} w="100%" overflowY="auto">
        <ChatMessageList messages={messages} />
      </Box>
      <Box w="100%">
        <FileUpload onUpload={uploadFile} isLoading={isUploading} />
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isSending || isLoadingHistory} 
        />
      </Box>
    </VStack>
  )
} 