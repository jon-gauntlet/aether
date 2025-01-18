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
import { supabase } from '../services/supabase'

export function FileUpload({ channel }) {
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
      const fileExt = file.name.split('.').pop()
      const filePath = `${channel}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setProgress(percent)
          },
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl }, error: urlError } = await supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath)

      if (urlError) throw urlError

      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 2000,
      })

      // TODO: Send file message to chat
      console.log('File URL:', publicUrl)

    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      })
    } finally {
      setUploading(false)
      setProgress(0)
      setFile(null)
    }
  }, [file, channel, toast])

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
          >
            Choose File
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