import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { formatDistanceToNow } from 'date-fns';
import { Box, Button, Text, VStack, HStack, useToast, Code } from '@chakra-ui/react';

export function MessageContent({ content, metadata, timestamp }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      status: "success",
      duration: 2000,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const renderContent = () => {
    // Detect code blocks with language
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);
    
    return parts.map((part, i) => {
      if (i % 3 === 1) { // Language identifier
        const language = part || 'text';
        const code = parts[i + 1];
        return (
          <Box key={i} borderWidth="1px" borderRadius="md" overflow="hidden">
            <HStack p={2} bg="gray.50" justify="space-between">
              <Text fontSize="sm">{language}</Text>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(code)}
                aria-label="Copy code"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </HStack>
            <Box p={4}>
              <Code as="pre" fontSize="sm" whiteSpace="pre-wrap">
                <SyntaxHighlighter language={language}>
                  {code}
                </SyntaxHighlighter>
              </Code>
            </Box>
          </Box>
        );
      } else if (i % 3 === 0) { // Regular text
        return <Text key={i}>{part}</Text>;
      }
      return null;
    });
  };

  return (
    <VStack spacing={4} align="stretch" className="message-content">
      {renderContent()}
      <HStack spacing={2} fontSize="sm" color="gray.500" className="message-metadata">
        <time 
          title={new Date(timestamp).toLocaleString()}
          dateTime={timestamp}
        >
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </time>
        {metadata?.attachments?.length > 0 && (
          <Text>• {metadata.attachments.length} attachment(s)</Text>
        )}
      </HStack>
    </VStack>
  );
} 