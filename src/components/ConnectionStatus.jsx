import React from 'react'
import { Box, Text, Flex } from '@chakra-ui/react'

export default function ConnectionStatus({ isConnected, error }) {
  if (!error && isConnected) return null

  return (
    <Box w="100%" p={2} bg={error ? "red.50" : "yellow.50"} borderBottom="1px" borderColor={error ? "red.200" : "yellow.200"}>
      <Flex align="center" justify="center">
        <Box w={2} h={2} borderRadius="full" bg={error ? "red.500" : "yellow.500"} mr={2} />
        <Text color={error ? "red.600" : "yellow.700"} fontSize="sm">
          {error || 'Connecting...'}
        </Text>
      </Flex>
    </Box>
  )
} 