import { useState, useCallback } from 'react';
import {
  Box,
  Text,
  VStack,
  Progress,
  useToast,
  Icon,
  Button,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { withErrorBoundary } from './ErrorBoundary';

function FileUploadComponent({ onFileUpload, isUploading, progress = 0 }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a valid document file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await onFileUpload(acceptedFiles[0]);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [onFileUpload, toast]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false,
  });

  return (
    <Box>
      <Box
        data-testid="upload-area"
        className={`css-1qyo9yx ${isDragActive ? 'drag-active' : ''}`}
        role="presentation"
        tabIndex="0"
        {...getRootProps()}
        p={6}
        borderWidth={2}
        borderRadius="lg"
        borderStyle="dashed"
        borderColor={isDragActive ? 'blue.500' : isDragReject ? 'red.500' : 'gray.500'}
        bg={isDragActive ? 'blue.50' : isDragReject ? 'red.50' : 'transparent'}
        transition="all 0.2s"
        cursor="pointer"
        _hover={{
          borderColor: 'blue.500',
          bg: 'blue.50',
        }}
        sx={{
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.02)' },
            '100%': { transform: 'scale(1)' }
          },
          animation: isDragActive ? 'pulse 1.5s infinite' : 'none'
        }}
      >
        <input
          data-testid="file-input"
          accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt"
          style={{
            border: 0,
            clip: 'rect(0, 0, 0, 0)',
            clipPath: 'inset(50%)',
            height: 1,
            margin: '0 -1px -1px 0',
            overflow: 'hidden',
            padding: 0,
            position: 'absolute',
            width: 1,
            whiteSpace: 'nowrap',
          }}
          tabIndex="-1"
          type="file"
          {...getInputProps()}
        />
        <VStack spacing={2} align="center">
          <Icon
            as={() => (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
            boxSize={8}
            color={isDragReject ? 'red.500' : 'blue.500'}
          />
          <Text color={isDragReject ? 'red.500' : 'gray.600'}>
            {isDragReject
              ? 'Invalid file type'
              : isDragActive
              ? 'Drop the file here'
              : 'Drag & drop a file here, or click to select'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Supported formats: PDF, DOC, DOCX, TXT
          </Text>
        </VStack>
      </Box>

      {isUploading && (
        <Box mt={4}>
          <Progress
            data-testid="upload-progress"
            value={progress}
            size="sm"
            colorScheme="blue"
            hasStripe
            isAnimated
          />
          <Text mt={2} fontSize="sm" color="gray.500" textAlign="center" data-testid="upload-progress-text">
            {progress}%
          </Text>
        </Box>
      )}
    </Box>
  );
}

export const FileUpload = withErrorBoundary(FileUploadComponent); 