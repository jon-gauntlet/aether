import { Box, VStack, Text, Progress, useToast } from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { withErrorBoundary } from './ErrorBoundary';

const FileUploadComponent = ({ onFileUpload, isUploading, progress = 0 }) => {
  const toast = useToast();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, DOC, DOCX, or TXT file',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      onFileUpload(file);
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  return (
    <Box>
      <Box
        {...getRootProps()}
        data-testid="upload-area"
        p={6}
        border="2px dashed"
        borderColor={isDragActive ? 'blue.500' : 'gray.300'}
        borderRadius="lg"
        bg={isDragActive ? 'blue.50' : 'transparent'}
        transition="all 0.2s"
        cursor="pointer"
      >
        <input {...getInputProps()} data-testid="file-input" />
        <VStack spacing={2}>
          <Text>
            {isDragActive
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
          />
          <Text mt={2} fontSize="sm" color="gray.600" data-testid="upload-progress-text">
            Uploading... {progress}%
          </Text>
        </Box>
      )}
    </Box>
  );
};

export const FileUpload = withErrorBoundary(FileUploadComponent); 