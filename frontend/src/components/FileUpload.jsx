import React, { useCallback } from 'react'
import { Button, Input, useToast } from '@chakra-ui/react'
import { AttachmentIcon } from '@chakra-ui/icons'

export function FileUpload({ onUpload, isLoading }) {
  const toast = useToast()
  const fileInputRef = React.useRef()

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      await onUpload(file)
      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: 'Failed to upload file',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    }

    // Reset input
    event.target.value = ''
  }, [onUpload, toast])

  return (
    <>
      <Input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        display="none"
        data-testid="file-input"
      />
      <Button
        leftIcon={<AttachmentIcon />}
        onClick={() => fileInputRef.current?.click()}
        isLoading={isLoading}
        variant="ghost"
        size="sm"
        data-testid="file-upload-button"
      >
        Attach
      </Button>
    </>
  )
} 