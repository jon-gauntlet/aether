import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  Alert,
  AlertIcon,
  Progress,
  useToast
} from '@chakra-ui/react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../components/Auth/AuthProvider'
import ProgressIndicator, { useProgress } from './ProgressIndicator'
import styled from 'styled-components'
import { FolderIcon, SearchIcon } from '../icons'
import { useFolder } from '../hooks/useFolder'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const BUCKET_NAME = 'documents'

export function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    listFiles()
  }, [])

  const listFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list()
      
      if (error) throw error
      
      setFiles(data || [])
    } catch (err) {
      setError('Failed to list files')
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit')
      return
    }

    setSelectedFile(file)
    setError('')
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(selectedFile.name, selectedFile)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      await listFiles()
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setSelectedFile(null)
      setLoading(false)
    }
  }

  const handleDownload = async (fileName) => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(fileName)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      
      toast({
        title: 'Success',
        description: 'File downloaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileName) => {
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName])

      if (error) throw error

      toast({
        title: 'Success',
        description: 'File deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true
      })
      
      await listFiles()
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        {loading && <Progress size="xs" isIndeterminate />}
        
        {error && (
          <Alert status="error" data-testid="message">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box className="upload-section">
          <Input
            type="file"
            onChange={handleFileChange}
            data-testid="file-input"
            disabled={loading}
            accept="image/*,application/pdf,.doc,.docx,.txt"
          />
          {selectedFile && (
            <Button
              mt={2}
              colorScheme="blue"
              onClick={handleUpload}
              isLoading={loading}
              data-testid="upload-button"
            >
              Upload
            </Button>
          )}
        </Box>

        <VStack spacing={2} align="stretch">
          {files.map((file) => (
            <Box
              key={file.name}
              p={2}
              borderWidth={1}
              borderRadius="md"
              data-testid="file-item"
            >
              <HStack justify="space-between">
                <Text data-testid="file-name">{file.name}</Text>
                <HStack>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => handleDownload(file.name)}
                    isLoading={loading}
                    data-testid="download-button"
                  >
                    Download
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(file.name)}
                    isLoading={loading}
                    data-testid="delete-button"
                  >
                    Delete
                  </Button>
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Box>
  )
} 