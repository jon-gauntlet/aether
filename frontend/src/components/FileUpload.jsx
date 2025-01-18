import React, { useCallback } from 'react'
import { Box, Button, Input, useToast } from '@chakra-ui/react'

export function FileUpload({ onUpload, isLoading }) {
  const toast = useToast()
  const fileInputRef = React.useRef()

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        status: 'error',
        duration: 3000,
      })
      return
    }

    onUpload(file)
    e.target.value = '' // Reset input
  }, [onUpload, toast])

  return (
    <Box mb={4}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".txt,.pdf,.doc,.docx"
      />
      <Button
        onClick={handleClick}
        isLoading={isLoading}
        size="sm"
        variant="outline"
        width="full"
      >
        Upload File
      </Button>
    </Box>
  )
} 