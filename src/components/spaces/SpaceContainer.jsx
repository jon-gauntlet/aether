import React, { useState } from 'react';
import { Box, Flex, IconButton, useColorMode } from '@chakra-ui/react';
import { FaBook, FaLeaf } from 'react-icons/fa';
import { Library } from './Library';
import { Garden } from './Garden';
import { SpaceTransition } from '../visualization/SpaceTransition';

const spaces = {
  library: {
    name: 'Knowledge Library',
    icon: FaBook,
    component: Library
  },
  garden: {
    name: 'Exploration Garden',
    icon: FaLeaf,
    component: Garden
  }
};

export function SpaceContainer() {
  const [currentSpace, setCurrentSpace] = useState('garden');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { colorMode } = useColorMode();

  const handleSpaceChange = (space) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSpace(space);
      setIsTransitioning(false);
    }, 1000); // Match this with transition animation duration
  };

  const CurrentSpaceComponent = spaces[currentSpace].component;

  return (
    <Box position="relative" minH="100vh">
      {/* Space Navigation */}
      <Flex
        position="fixed"
        top={4}
        right={4}
        bg={colorMode === 'light' ? 'white' : 'gray.800'}
        p={2}
        borderRadius="lg"
        shadow="md"
        zIndex={100}
      >
        {Object.entries(spaces).map(([key, space]) => (
          <IconButton
            key={key}
            icon={<space.icon />}
            aria-label={space.name}
            onClick={() => handleSpaceChange(key)}
            variant={currentSpace === key ? 'solid' : 'ghost'}
            colorScheme={currentSpace === key ? 'blue' : 'gray'}
            mx={1}
          />
        ))}
      </Flex>

      {/* Transition Effect */}
      {isTransitioning && (
        <SpaceTransition fromSpace={currentSpace} />
      )}

      {/* Current Space */}
      <CurrentSpaceComponent />
    </Box>
  );
} 