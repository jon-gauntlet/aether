import React from "react";
import { Box, VStack, Text, Progress, useToast } from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";

const FileUploadComponent = ({ onFileUpload, isUploading, progress = 0 }) => {
  const toast = useToast();
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      try {
        await onFileUpload(acceptedFiles);
      } catch (error) {
        toast({
          title: "Upload failed",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    },
  });

  return (
    <Box>
      <Box
        {...getRootProps()}
        p={6}
        border="2px dashed"
        borderColor={isDragActive ? "blue.400" : "gray.200"}
        borderRadius="md"
        bg={isDragActive ? "blue.50" : "transparent"}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: "blue.400", bg: "blue.50" }}
      >
        <input {...getInputProps()} />
        <VStack spacing={2}>
          <Text>
            {isDragActive
              ? "Drop the files here..."
              : "Drag and drop files here, or click to select files"}
          </Text>
          {isUploading && (
            <Progress
              value={progress}
              size="sm"
              width="100%"
              colorScheme="blue"
              isAnimated
            />
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export const FileUpload = (props) => (
  <ErrorBoundary>
    <FileUploadComponent {...props} />
  </ErrorBoundary>
); 