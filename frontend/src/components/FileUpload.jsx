import React, { useState, useCallback } from 'react'
import {
  Box,
  Button,
  Progress,
  Text,
  useToast,
  VStack,
  HStack,
  Icon
} from '@chakra-ui/react'
import { AttachmentIcon } from '@chakra-ui/icons'

export function FileUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const toast = useToast()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.size <= 10 * 1024 * 1024) { // 10MB limit
      setFile(selectedFile)
    } else {
      toast({
        title: 'File too large',
        description: 'Please select a file under 10MB',
        status: 'error',
        duration: 3000,
      })
    }
  }

  const uploadFile = useCallback(async () => {
    if (!file) return

    try {
      setUploading(true)
      
      // Simulate upload progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          setUploading(false)
          setProgress(0)
          setFile(null)
          toast({
            title: 'File uploaded successfully',
            description: '(Demo mode - file not actually uploaded)',
            status: 'success',
            duration: 2000,
          })
        }
      }, 200)

    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
      setUploading(false)
      setProgress(0)
      setFile(null)
    }
  }, [file, toast])

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <HStack>
          <Button
            as="label"
            htmlFor="file-upload"
            cursor="pointer"
            leftIcon={<Icon as={AttachmentIcon} />}
            isDisabled={uploading}
            size="sm"
          >
            Attach File
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              data-testid="file-input"
            />
          </Button>
          {file && (
            <Button
              onClick={uploadFile}
              isLoading={uploading}
              data-testid="upload-button"
              size="sm"
              colorScheme="blue"
            >
              Upload
            </Button>
          )}
        </HStack>

        {file && (
          <Text fontSize="sm" color="gray.500">
            Selected: {file.name}
          </Text>
        )}

        {uploading && (
          <Progress
            value={progress}
            size="sm"
            colorScheme="blue"
            data-testid="upload-progress"
          />
        )}
      </VStack>
    </Box>
  )
} 