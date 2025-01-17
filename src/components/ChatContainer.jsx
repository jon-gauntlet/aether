import React, { useEffect, useState } from 'react';
import { VStack, Container, useToast } from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { FileUpload } from './FileUpload';
import { apiClient } from '../services/apiClient';
import { withErrorBoundary } from './ErrorBoundary';

export const ChatContainer = withErrorBoundary(() => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: apiClient.getChatHistory,
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  });

  const { mutate: sendMessage } = useMutation({
    mutationFn: apiClient.processQuery,
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages']);
      setIsLoading(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      setIsLoading(false);
    }
  });

  const { mutate: uploadFile } = useMutation({
    mutationFn: apiClient.uploadFile,
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiClient.checkHealth();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'API is not available',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      }
    };
    checkHealth();
  }, [toast]);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <div className="chat-container">
          <ChatMessageList messages={messages} />
          <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
        </div>
        <FileUpload onFileUpload={uploadFile} />
      </VStack>
    </Container>
  );
}); 