import { useEffect } from 'react';
import { Box, VStack, Container, useToast } from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { withErrorBoundary } from './ErrorBoundary';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { FileUpload } from './FileUpload';
import { apiClient } from '../api/client';

function ChatContainerComponent() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const chatId = 'default';

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => apiClient.getChatHistory(chatId),
    staleTime: 1000,
  });

  const { mutate: sendMessage, isLoading: isSending } = useMutation({
    mutationFn: (message) => apiClient.processQuery(message),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat', chatId]);
    },
    onError: (error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    },
  });

  const { mutate: uploadFile, isLoading: isUploading } = useMutation({
    mutationFn: (file) => apiClient.uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat', chatId]);
      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to upload file',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    },
  });

  useEffect(() => {
    apiClient.checkHealth().catch((error) => {
      toast({
        title: 'API is not available',
        description: error.message,
        status: 'error',
        duration: null,
        isClosable: true,
      });
    });
  }, [toast]);

  return (
    <Container
      maxW={{ base: '100%', md: '800px' }}
      h="100vh"
      p={{ base: 2, md: 4 }}
      centerContent
    >
      <VStack
        spacing={4}
        w="100%"
        h="100%"
        bg="gray.800"
        borderRadius={{ base: 'none', md: 'xl' }}
        overflow="hidden"
        boxShadow="2xl"
      >
        <Box
          flex={1}
          w="100%"
          borderRadius="lg"
          bg="gray.700"
          overflow="hidden"
          position="relative"
        >
          <ChatMessageList
            messages={messages}
            isLoading={isLoadingMessages}
          />
          <ChatInput
            onSendMessage={sendMessage}
            isLoading={isSending}
          />
        </Box>
        
        <Box
          w="100%"
          bg="gray.700"
          borderRadius="lg"
          overflow="hidden"
          transition="all 0.2s"
          _hover={{ transform: 'translateY(-2px)' }}
        >
          <FileUpload
            onFileUpload={uploadFile}
            isLoading={isUploading}
          />
        </Box>
      </VStack>
    </Container>
  );
}

export const ChatContainer = withErrorBoundary(ChatContainerComponent); 