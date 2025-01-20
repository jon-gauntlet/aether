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
  VALIDATION
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
  const [uploadStatus, setUploadStatus] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)
  const uploadCancelTokens = useRef({})
  const { currentFolder, folders, createFolder, navigateToFolder, refreshFolders } = useFolder(bucket)
  const { startProgress, updateProgress, completeProgress } = useProgress()

  // Validate file
  const validateFile = useCallback((file) => {
    // Check file size
    if (file.size > maxSize) {
      throw new Error(VALIDATION.file.maxSize.message)
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.split('/')[0])
      }
      return file.type === type || `.${file.name.split('.').pop()}` === type
    })

    if (!isValidType) {
      throw new Error(VALIDATION.file.allowedTypes.message)
    }

    // Check for duplicates
    if (files.some(f => f.name === file.name)) {
      throw new Error('File already selected')
    }
  }, [files, maxSize, acceptedTypes])

  // Handle file selection
  const handleFiles = useCallback((newFiles) => {
    const validFiles = []
    const errors = []

    Array.from(newFiles).forEach(file => {
      try {
        validateFile(file)
        validFiles.push(file)
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`)
      }
    })

    if (validFiles.length > 0) {
      setFiles(prev => multiple ? [...prev, ...validFiles] : [validFiles[0]])
      setError(null)
    }

    if (errors.length > 0) {
      setError(errors.join('\n'))
    }
  }, [validateFile, multiple])

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }, [])

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Upload single file
  const uploadFile = useCallback(async (file) => {
    if (!session) throw new Error('Please sign in to upload files')

    const filePath = currentFolder 
      ? `${currentFolder}/${file.name}`
      : file.name

    const cancelToken = new AbortController()
    uploadCancelTokens.current[filePath] = cancelToken

    try {
      startProgress(file.name)
      setUploadStatus(prev => ({ ...prev, [file.name]: UPLOAD_STATES.UPLOADING }))

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          signal: cancelToken.signal,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            updateProgress(file.name, percent)
            setUploadProgress(prev => ({ ...prev, [file.name]: percent }))
          }
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      completeProgress(file.name)
      setUploadStatus(prev => ({ ...prev, [file.name]: UPLOAD_STATES.SUCCESS }))
      onSuccess?.({ file, path: data.path, url: publicUrl })

      return { path: data.path, url: publicUrl }
    } catch (err) {
      setUploadStatus(prev => ({ ...prev, [file.name]: UPLOAD_STATES.ERROR }))
      throw err
    } finally {
      delete uploadCancelTokens.current[filePath]
    }
  }, [session, bucket, currentFolder, startProgress, updateProgress, completeProgress, onSuccess])

  // Upload all files
  const uploadAll = useCallback(async () => {
    if (files.length === 0) return

    const uploadPromises = files.map(async (file) => {
      try {
        const result = await uploadFile(file)
        return { file, result, error: null }
      } catch (err) {
        return { file, result: null, error: err }
      }
    })

    try {
      const results = await Promise.all(uploadPromises)
      const errors = results.filter(r => r.error)
      const successes = results.filter(r => !r.error)

      if (errors.length > 0) {
        setError(`Failed to upload ${errors.length} files:\n${
          errors.map(({ file, error }) => `${file.name}: ${error.message}`).join('\n')
        }`)
      }

      if (successes.length > 0) {
        setFiles(prev => prev.filter(f => !successes.find(s => s.file.name === f.name)))
        onUpload?.(successes.map(s => s.result))
      }
    } catch (err) {
      setError(err.message)
      onError?.(err)
    }
  }, [files, uploadFile, onUpload, onError])

  // Cancel upload
  const cancelUpload = useCallback((fileName) => {
    const filePath = currentFolder 
      ? `${currentFolder}/${fileName}`
      : fileName

    const cancelToken = uploadCancelTokens.current[filePath]
    if (cancelToken) {
      cancelToken.abort()
      setUploadStatus(prev => ({ ...prev, [fileName]: UPLOAD_STATES.CANCELLED }))
      setError(`Upload cancelled: ${fileName}`)
    }
  }, [currentFolder])

  // Remove file
  const removeFile = useCallback((fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
    setUploadStatus(prev => {
      const { [fileName]: removed, ...rest } = prev
      return rest
    })
    setUploadProgress(prev => {
      const { [fileName]: removed, ...rest } = prev
      return rest
    })
    cancelUpload(fileName)
  }, [cancelUpload])

  // Clear all
  const clearAll = useCallback(() => {
    files.forEach(file => {
      cancelUpload(file.name)
    })
    setFiles([])
    setUploadStatus({})
    setUploadProgress({})
    setError(null)
  }, [files, cancelUpload])

  // Filter files by search
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files
    const query = searchQuery.toLowerCase()
    return files.filter(file => 
      file.name.toLowerCase().includes(query)
    )
  }, [files, searchQuery])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(uploadCancelTokens.current).forEach(token => token.abort())
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
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        isDragActive={dragActive}
        error={error}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        <p>
          {dragActive 
            ? 'Drop files here...'
            : `Click or drag files to upload (Max size: ${formatFileSize(maxSize)})`
          }
        </p>
      </DropZone>

      {filteredFiles.length > 0 && (
        <>
          <BatchActions>
            <Button onClick={uploadAll}>Upload All</Button>
            <Button onClick={clearAll} variant="secondary">Clear All</Button>
          </BatchActions>

          <FileList>
            {filteredFiles.map(file => (
              <FileItem key={file.name}>
                <FileIcon type={getFileType(file)} />
                <FileDetails>
                  <span>{file.name}</span>
                  <small>{formatFileSize(file.size)}</small>
                </FileDetails>
                {uploadStatus[file.name] === UPLOAD_STATES.UPLOADING && (
                  <ProgressIndicator
                    progress={uploadProgress[file.name] || 0}
                    size="small"
                  />
                )}
                <ButtonGroup>
                  {uploadStatus[file.name] === UPLOAD_STATES.UPLOADING ? (
                    <Button
                      onClick={() => cancelUpload(file.name)}
                      variant="danger"
                      size="small"
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      onClick={() => removeFile(file.name)}
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