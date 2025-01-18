import React from 'react';
import { Box, Text, Button } from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';

const MessageContent = ({ content, attachments = [], onCopy }) => {
  const handleCopy = () => {
    if (onCopy) {
      onCopy(content);
    }
  };

  return (
    <Box>
      <Text whiteSpace="pre-wrap">{content}</Text>
      {content.includes('```') && (
        <Button
          leftIcon={<CopyIcon />}
          size="sm"
          onClick={handleCopy}
          mt={2}
          variant="outline"
        >
          Copy Code
        </Button>
      )}
      {attachments.length > 0 && (
        <Box mt={4}>
          {attachments.map((attachment, index) => (
            <Box key={index} mt={2}>
              {/* Render attachment based on type */}
              <Text>{attachment.name}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MessageContent; 