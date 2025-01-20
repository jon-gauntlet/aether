import React from 'react'
import { Box, Text, VStack, HStack, Avatar, Spinner, Collapse } from '@chakra-ui/react'
import { InfoIcon } from '@chakra-ui/icons'

export function Message({ content, timestamp, role, avatar, isLoading, sources }) {
  const isUser = role === 'user'
  const isRAG = role === 'assistant' && sources?.length > 0
  
  return (
    <HStack
      spacing={2}
      align="flex-start"
      justify={isUser ? 'flex-end' : 'flex-start'}
      w="100%"
    >
      {!isUser && (
        <Avatar
          size="sm"
          name={isRAG ? "RAG Assistant" : "AI Assistant"}
          src={avatar}
          bg={isRAG ? "purple.500" : "blue.500"}
        />
      )}
      <VStack
        align={isUser ? 'flex-end' : 'flex-start'}
        maxW="70%"
        spacing={1}
      >
        <Box
          bg={isUser ? 'blue.500' : isRAG ? 'purple.700' : 'gray.700'}
          color="white"
          px={4}
          py={2}
          borderRadius="lg"
          position="relative"
        >
          {isLoading ? (
            <HStack spacing={3} p={2}>
              <Spinner size="sm" />
              <Text>Thinking...</Text>
            </HStack>
          ) : (
            <>
              <Text whiteSpace="pre-wrap">{content}</Text>
              {isRAG && sources?.length > 0 && (
                <VStack align="start" mt={2} pt={2} borderTop="1px solid" borderColor="whiteAlpha.300">
                  <HStack spacing={1} color="whiteAlpha.700">
                    <InfoIcon boxSize={3} />
                    <Text fontSize="xs">Sources:</Text>
                  </HStack>
                  {sources.map((source, idx) => (
                    <Text key={idx} fontSize="xs" color="whiteAlpha.800">
                      {source.title || `Source ${idx + 1}`}
                    </Text>
                  ))}
                </VStack>
              )}
            </>
          )}
        </Box>
        {timestamp && (
          <Text fontSize="xs" color="gray.500">
            {new Date(timestamp).toLocaleTimeString()}
          </Text>
        )}
      </VStack>
      {isUser && (
        <Avatar
          size="sm"
          name="User"
          bg="green.500"
        />
      )}
    </HStack>
  )
} 