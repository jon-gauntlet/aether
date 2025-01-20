import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../../lib/supabaseClient'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useProgress } from '../ProgressIndicator'
import { useFolder } from '../../hooks/useFolder'
import { formatFileSize, getFileType } from '../../utils/fileUtils'
import { FILE_ICONS } from '../../constants/fileIcons'
import { AnimatePresence } from 'framer-motion'
import {
  UPLOAD_STATES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  UPLOAD_BUCKET,
  PERFORMANCE,
  VALIDATION,
  UPLOAD_CONFIG,
  UI
} from '../../config/constants'
import {
  Container,
  DropZone,
  FileList,
  FileItem,
  Button,
  Message,
  FilePreview,
  FileIcon,
  FileDetails,
  ButtonGroup,
  BatchActions,
  FolderNavigation,
  FolderPath,
  SearchBar,
  ProgressIndicator
} from './FileUpload.styles'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { uploadFile } from '../../lib/supabase'

export const FileUpload = ({ 
  onUpload,
  onError,
  onSuccess,
  maxSize = MAX_FILE_SIZE,
  acceptedTypes = ALLOWED_FILE_TYPES,
  multiple = false,
  bucket = UPLOAD_BUCKET
}) => {
  const { session } = useAuth()
  const { theme } = useTheme()
  const [files, setFiles] = useState([])
  const [uploadState, setUploadState] = useState(UPLOAD_STATES.IDLE)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)
  const uploadTimeoutRef = useRef(null)
  const { currentFolder, folders, createFolder, navigateToFolder, refreshFolders } = useFolder(bucket)
  const { startProgress, updateProgress, completeProgress } = useProgress()

  const validateFile = useCallback((file) => {
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      throw new Error(`File size must not exceed ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }
    if (!UPLOAD_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported`)
    }
    if (files.some(f => f.name === file.name)) {
      throw new Error(`File ${file.name} already exists`)
    }
  }, [files])

  const handleDrop = useCallback(async (acceptedFiles) => {
    setUploadState(UPLOAD_STATES.VALIDATING)
    setError(null)
    
    try {
      // Validate each file
      acceptedFiles.forEach(validateFile)
      
      // Add files to state with upload progress
      const newFiles = acceptedFiles.map(file => ({
        file,
        progress: 0,
        state: UPLOAD_STATES.IDLE
      }))
      
      setFiles(prev => [...prev, ...newFiles])
      setUploadState(UPLOAD_STATES.IDLE)
    } catch (err) {
      setError(err.message)
      setUploadState(UPLOAD_STATES.ERROR)
      
      // Clear error after timeout
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current)
      }
      uploadTimeoutRef.current = setTimeout(() => {
        setError(null)
        setUploadState(UPLOAD_STATES.IDLE)
      }, UI.ERROR_DISPLAY_DURATION)
    }
  }, [validateFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: UPLOAD_CONFIG.ALLOWED_FILE_TYPES.join(','),
    maxSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    multiple: true
  })

  const uploadFiles = useCallback(async () => {
    setUploadState(UPLOAD_STATES.UPLOADING)
    setError(null)

    try {
      await Promise.all(
        files.map(async ({ file }, index) => {
          // Skip already uploaded files
          if (files[index].state === UPLOAD_STATES.SUCCESS) {
            return
          }

          // Update file state to uploading
          setFiles(prev => {
            const newFiles = [...prev]
            newFiles[index] = {
              ...newFiles[index],
              state: UPLOAD_STATES.UPLOADING,
              progress: 0
            }
            return newFiles
          })

          try {
            // Upload file
            const path = `${Date.now()}-${file.name}`
            await uploadFile(UPLOAD_CONFIG.UPLOAD_BUCKET, path, file)

            // Update file state to success
            setFiles(prev => {
              const newFiles = [...prev]
              newFiles[index] = {
                ...newFiles[index],
                state: UPLOAD_STATES.SUCCESS,
                progress: 100
              }
              return newFiles
            })
          } catch (err) {
            // Update file state to error
            setFiles(prev => {
              const newFiles = [...prev]
              newFiles[index] = {
                ...newFiles[index],
                state: UPLOAD_STATES.ERROR,
                error: err.message
              }
              return newFiles
            })
            throw err
          }
        })
      )

      setUploadState(UPLOAD_STATES.SUCCESS)
    } catch (err) {
      setError('One or more files failed to upload')
      setUploadState(UPLOAD_STATES.ERROR)
      
      // Clear error after timeout
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current)
      }
      uploadTimeoutRef.current = setTimeout(() => {
        setError(null)
        setUploadState(UPLOAD_STATES.IDLE)
      }, UI.ERROR_DISPLAY_DURATION)
    }
  }, [files])

  const clearAll = useCallback(() => {
    setFiles([])
    setUploadState(UPLOAD_STATES.IDLE)
    setError(null)
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current)
    }
  }, [])

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Filter files by search
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files
    const query = searchQuery.toLowerCase()
    return files.filter(file => 
      file.file.name.toLowerCase().includes(query)
    )
  }, [files, searchQuery])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current)
      }
    }
  }, [])

  // Require authentication
  if (!session) {
    return (
      <Container>
        <Message type="error">
          Please sign in to upload files
        </Message>
      </Container>
    )
  }

  return (
    <Container>
      <AnimatePresence>
        {error && (
          <Message
            type="error"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {error}
          </Message>
        )}
      </AnimatePresence>

      <FolderNavigation>
        <FolderPath>
          <span onClick={() => navigateToFolder('')}>Root</span>
          {currentFolder.split('/').map((segment, index, array) => (
            <React.Fragment key={segment}>
              <span>/</span>
              <span 
                onClick={() => 
                  navigateToFolder(array.slice(0, index + 1).join('/'))
                }
              >
                {segment}
              </span>
            </React.Fragment>
          ))}
        </FolderPath>
        <Button
          onClick={() => {
            const folderName = window.prompt('Enter folder name:')
            if (folderName) {
              createFolder(currentFolder 
                ? `${currentFolder}/${folderName}`
                : folderName
              )
            }
          }}
        >
          New Folder
        </Button>
      </FolderNavigation>

      <SearchBar
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <DropZone
        {...getRootProps()}
        isDragActive={isDragActive}
        state={uploadState}
        data-testid="dropzone"
      >
        <input {...getInputProps()} data-testid="file-input" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: UI.ANIMATION_DURATION / 1000 }}
        >
          {isDragActive ? (
            <p>Drop files here...</p>
          ) : (
            <p>
              Drag & drop files here, or click to select files<br />
              <small>
                Supported files: {UPLOAD_CONFIG.ALLOWED_FILE_TYPES.join(', ')}<br />
                Max size: {UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB
              </small>
            </p>
          )}
        </motion.div>
      </DropZone>

      {filteredFiles.length > 0 && (
        <>
          <BatchActions>
            <Button
              onClick={uploadFiles}
              disabled={
                uploadState === UPLOAD_STATES.UPLOADING ||
                files.every(f => f.state === UPLOAD_STATES.SUCCESS)
              }
              data-testid="upload-button"
            >
              {uploadState === UPLOAD_STATES.UPLOADING ? 'Uploading...' : 'Upload All'}
            </Button>
            <Button
              onClick={clearAll}
              disabled={uploadState === UPLOAD_STATES.UPLOADING}
              data-testid="clear-button"
            >
              Clear All
            </Button>
          </BatchActions>

          <FileList>
            {filteredFiles.map((file, index) => (
              <FileItem
                key={index}
                variant={file.state}
                data-testid={`file-item-${index}`}
              >
                <FilePreview type={file.file.type} />
                <div>
                  <p>{file.file.name}</p>
                  <small>
                    {(file.file.size / 1024).toFixed(1)}KB
                  </small>
                </div>
                {file.state === UPLOAD_STATES.UPLOADING && (
                  <ProgressIndicator
                    value={file.progress}
                    max="100"
                    data-testid={`progress-${index}`}
                  />
                )}
                <ButtonGroup>
                  {file.state === UPLOAD_STATES.UPLOADING ? (
                    <Button
                      onClick={() => removeFile(index)}
                      variant="danger"
                      size="small"
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      onClick={() => removeFile(index)}
                      variant="secondary"
                      size="small"
                    >
                      Remove
                    </Button>
                  )}
                </ButtonGroup>
              </FileItem>
            ))}
          </FileList>
        </>
      )}
    </Container>
  )
}

FileUpload.propTypes = {
  onUpload: PropTypes.func,
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
  maxSize: PropTypes.number,
  acceptedTypes: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  bucket: PropTypes.string
}

export default FileUpload 