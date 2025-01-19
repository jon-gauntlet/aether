import React from 'react';
import { Box, VStack, useColorMode } from '@chakra-ui/react';
import { ChatContainer } from '../chat';
import { Flow } from '../visualization/Flow';

export function Garden() {
  const { colorMode } = useColorMode();

  return (
    <Box
      minH="100vh"
      bg={colorMode === 'light' ? 'green.50' : 'gray.900'}
      color={colorMode === 'light' ? 'gray.800' : 'gray.100'}
      p={4}
      position="relative"
    >
      <Flow />
      <VStack spacing={6} maxW="1200px" mx="auto" w="full">
        <ChatContainer spaceType="garden" />
      </VStack>
    </Box>
  );
} 