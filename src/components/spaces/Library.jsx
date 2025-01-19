import React, { useEffect, useState } from 'react';
import { Box, VStack, Input, Tabs, TabList, Tab, TabPanels, TabPanel, useColorMode } from '@chakra-ui/react';
import { ChatContainer } from '../chat';
import { ConsciousnessField } from '../visualization/ConsciousnessField';
import { useRAG } from '../../hooks/useRAG';

export function Library() {
  const { colorMode } = useColorMode();
  const { ingestText } = useRAG();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Box
      minH="100vh"
      bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}
      color={colorMode === 'light' ? 'gray.800' : 'gray.100'}
      p={4}
    >
      <VStack spacing={6} maxW="1200px" mx="auto" w="full">
        {/* Search and Navigation */}
        <Box w="full">
          <Input
            placeholder="Search knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="lg"
            mb={4}
          />
          <Tabs 
            variant="soft-rounded" 
            colorScheme="blue" 
            index={activeTab}
            onChange={setActiveTab}
          >
            <TabList>
              <Tab>Recent</Tab>
              <Tab>Favorites</Tab>
              <Tab>Archives</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <ChatContainer spaceType="library" />
              </TabPanel>
              <TabPanel>
                <Box p={4} textAlign="center">Favorites coming soon</Box>
              </TabPanel>
              <TabPanel>
                <Box p={4} textAlign="center">Archives coming soon</Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>
    </Box>
  );
} 