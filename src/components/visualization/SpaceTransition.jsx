import React from 'react';
import { Box } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

export function SpaceTransition({ fromSpace }) {
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg={fromSpace === 'library' ? 'blue.500' : 'green.500'}
      opacity={0.3}
      zIndex={1000}
      animation={`${fadeOut} 1s ease-out forwards`}
      pointerEvents="none"
    />
  );
} 