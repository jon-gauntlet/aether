import React from 'react'
import { Box, Button, Input } from '@chakra-ui/react'

export const FileUpload = ({ channel }) => {
  const handleFileChange = async (e) => {
    // TODO: Implement file upload logic
    console.log('File selected:', e.target.files[0])
    console.log('Channel:', channel)
  }

  return (
    <Box>
      <Input
        type="file"
        onChange={handleFileChange}
        display="none"
        id="file-upload"
      />
      <Button as="label" htmlFor="file-upload">
        Upload File
      </Button>
    </Box>
  )
} 