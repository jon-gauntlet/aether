import React from 'react'
import { HStack, Text, Circle, useColorModeValue } from '@chakra-ui/react'

export default function ConnectionStatus({ isConnected, error, retryCount }) {
  const statusColor = error ? 'red.500' : isConnected ? 'green.500' : 'yellow.500'
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <HStack spacing={2} w="full" p={2} borderBottom="1px" borderColor={useColorModeValue('gray.100', 'gray.700')}>
      <Circle size={2} bg={statusColor} />
      <Text fontSize="sm" color={error ? 'red.500' : textColor}>
        {error 
          ? error
          : isConnected 
            ? 'Connected' 
            : 'Connecting...'}
      </Text>
      {retryCount > 0 && !isConnected && (
        <Text fontSize="xs" color={textColor} ml="auto">
          Retry {retryCount}
        </Text>
      )}
    </HStack>
  )
} 