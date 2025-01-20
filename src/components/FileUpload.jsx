import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../components/Auth/AuthProvider'
import ProgressIndicator, { useProgress } from './ProgressIndicator'
import styled from 'styled-components'
import { FolderIcon, SearchIcon } from '../icons'
import { useFolder } from '../hooks/useFolder'

const Container = styled(motion.div)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
`

const DropZone = styled(motion.div)`
  border: 2px dashed ${({ theme, isDragActive, error }) => 
    error ? theme.colors.error[500] :
    isDragActive ? theme.colors.primary[500] :
    theme.colors.neutral[300]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: 2rem;
  text-align: center;
  transition: all 0.2s ease;
  background: ${({ theme, isDragActive }) => 
    isDragActive ? theme.colors.primary[50] : 'transparent'};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`

const FileList = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: 1rem 0;
`

const FileItem = styled(motion.li)`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  margin: 0.5rem 0;
  background: ${({ theme }) => theme.colors.neutral[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
`

const Button = styled(motion.button)`
  padding: 0.5rem 1rem;
  background: ${({ theme, variant }) => 
    variant === 'error' ? theme.colors.error[500] :
    variant === 'success' ? theme.colors.success[500] :
    theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme, variant }) => 
      variant === 'error' ? theme.colors.error[600] :
      variant === 'success' ? theme.colors.success[600] :
      theme.colors.primary[600]};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

const Message = styled(motion.div)`
  padding: 1rem;
  margin: 1rem 0;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, type }) => 
    type === 'error' ? theme.colors.error[50] :
    type === 'success' ? theme.colors.success[50] :
    theme.colors.primary[50]};
  color: ${({ theme, type }) => 
    type === 'error' ? theme.colors.error[700] :
    type === 'success' ? theme.colors.success[700] :
    theme.colors.primary[700]};
  border-left: 4px solid ${({ theme, type }) => 
    type === 'error' ? theme.colors.error[500] :
    type === 'success' ? theme.colors.success[500] :
    theme.colors.primary[500]};
`

const FilePreview = styled(motion.div)`
  width: 40px;
  height: 40px;
  margin-right: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  position: relative;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  margin-right: 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, type }) => 
    type === 'pdf' ? theme.colors.error[50] :
    type === 'doc' ? theme.colors.primary[50] :
    theme.colors.neutral[50]};
  color: ${({ theme, type }) => 
    type === 'pdf' ? theme.colors.error[500] :
    type === 'doc' ? theme.colors.primary[500] :
    theme.colors.neutral[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: uppercase;
  flex-shrink: 0;
`

const FileDetails = styled.div`
  flex: 1;
  min-width: 0;

  p {
    margin: 0;
    &:first-child {
      font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
      color: ${({ theme }) => theme.colors.neutral[900]};
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &:last-child {
      font-size: ${({ theme }) => theme.typography.fontSize.sm};
      color: ${({ theme }) => theme.colors.neutral[500]};
    }
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
`

const BatchActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`

const FolderNavigation = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: ${({ theme }) => theme.colors.neutral[100]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`

const FolderPath = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0.25rem;

  span {
    color: ${({ theme }) => theme.colors.neutral[600]};
    cursor: pointer;
    &:hover {
      color: ${({ theme }) => theme.colors.primary[600]};
    }
    &:last-child {
      color: ${({ theme }) => theme.colors.neutral[900]};
      cursor: default;
    }
  }
`

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 1rem;

  input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary[500]};
    }
  }

  svg {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.neutral[400]};
  }
`

// File type icons map
const FILE_ICONS = {
  pdf: '📄',
  doc: '📝',
  docx: '📝',
  image: '🖼️',
  default: '📁'
}

// Get file type for icon display
const getFileType = (file) => {
  if (file.type.startsWith('image/')) return 'image'
  const ext = file.name.split('.').pop().toLowerCase()
  return ext || 'default'
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const FileUpload = ({ 
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['.pdf', '.doc', '.docx'],
  multiple = true,
  bucket = 'files',
  onUploadComplete
}) => {
  const { session, error: authError } = useAuth()
  const { isDarkMode } = useTheme()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const uploadCancelTokens = useRef({})
  const fileInputRef = useRef(null)
  const [previews, setPreviews] = useState({})
  const [failedUploads, setFailedUploads] = useState({})
  const [retrying, setRetrying] = useState(false)
  const [currentFolder, setCurrentFolder] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const { folders, createFolder, deleteFolder } = useFolder(bucket)

  const resetMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const validateFile = useCallback((file) => {
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`)
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!acceptedTypes.includes(ext) && !acceptedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${acceptedTypes.join(', ')}`)
    }

    if (files.some(f => f.name === file.name)) {
      throw new Error('File already selected')
    }
  }, [maxSize, acceptedTypes, files])

  // Generate preview for image files
  const generatePreview = useCallback((file) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviews(prev => ({
        ...prev,
        [file.name]: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFiles = useCallback(async (newFiles) => {
    resetMessages()
    
    try {
      const validFiles = []
      for (const file of newFiles) {
        try {
          validateFile(file)
          validFiles.push(file)
          generatePreview(file)
        } catch (err) {
          setError(`${file.name}: ${err.message}`)
        }
      }

      if (validFiles.length > 0) {
        setFiles(prev => multiple ? [...prev, ...validFiles] : [validFiles[0]])
      }
    } catch (err) {
      setError(err.message)
    }
  }, [validateFile, multiple, resetMessages, generatePreview])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = [...e.dataTransfer.files]
    handleFiles(droppedFiles)
  }, [handleFiles])

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = [...e.target.files]
    handleFiles(selectedFiles)
  }, [handleFiles])

  const uploadFile = useCallback(async (file) => {
    if (!session) {
      throw new Error('Please sign in to upload files')
    }

    const filePath = currentFolder 
      ? `${currentFolder}/${Date.now()}-${file.name}`
      : `${Date.now()}-${file.name}`
    
    const cancelToken = new AbortController()
    uploadCancelTokens.current[filePath] = cancelToken

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          signal: cancelToken.signal,
          onUploadProgress: (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [filePath]: Math.round((progress.loaded / progress.total) * 100)
            }))
          }
        })

      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return { path: data.path, url: publicUrl }
    } finally {
      delete uploadCancelTokens.current[filePath]
    }
  }, [session, bucket, currentFolder])

  const handleUpload = useCallback(async (filesToUpload = files) => {
    if (filesToUpload.length === 0) return

    setUploading(true)
    resetMessages()
    setFailedUploads({})
    
    try {
      const results = await Promise.all(
        filesToUpload.map(async (file) => {
          try {
            const result = await uploadFile(file)
            return { file, result, error: null }
          } catch (err) {
            return { file, result: null, error: err }
          }
        })
      )

      const errors = results.filter(r => r.error)
      const successes = results.filter(r => !r.error)

      if (errors.length > 0) {
        const failedMap = {}
        errors.forEach(({ file, error }) => {
          failedMap[file.name] = error
        })
        setFailedUploads(failedMap)
        setError(`Failed to upload ${errors.length} files`)
      }

      if (successes.length > 0) {
        setSuccess(`Successfully uploaded ${successes.length} files`)
        setFiles(prev => prev.filter(f => !successes.find(s => s.file.name === f.name)))
        if (onUploadComplete) {
          onUploadComplete(successes.map(s => s.result))
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      setRetrying(false)
      setUploadProgress({})
    }
  }, [files, uploadFile, resetMessages, onUploadComplete])

  const retryFailed = useCallback(async () => {
    const failedFiles = files.filter(f => failedUploads[f.name])
    if (failedFiles.length === 0) return

    setRetrying(true)
    await handleUpload(failedFiles)
  }, [files, failedUploads, handleUpload])

  const cancelAll = useCallback(() => {
    Object.keys(uploadCancelTokens.current).forEach(fileName => {
      cancelUpload(fileName)
    })
    setUploading(false)
    setUploadProgress({})
  }, [cancelUpload])

  const removeAll = useCallback(() => {
    files.forEach(file => {
      if (previews[file.name]?.startsWith('blob:')) {
        URL.revokeObjectURL(previews[file.name])
      }
    })
    setFiles([])
    setPreviews({})
    setFailedUploads({})
    setUploadProgress({})
    resetMessages()
  }, [files, previews, resetMessages])

  const cancelUpload = useCallback((fileName) => {
    const cancelToken = uploadCancelTokens.current[fileName]
    if (cancelToken) {
      cancelToken.abort()
      setError(`Upload cancelled: ${fileName}`)
    }
  }, [])

  const removeFile = useCallback((fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
    setPreviews(prev => {
      const { [fileName]: removed, ...rest } = prev
      if (removed?.startsWith('blob:')) {
        URL.revokeObjectURL(removed)
      }
      return rest
    })
    cancelUpload(fileName)
  }, [cancelUpload])

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
    }
  }, [previews])

  useEffect(() => {
    return () => {
      // Cleanup any ongoing uploads
      Object.values(uploadCancelTokens.current).forEach(token => token.abort())
    }
  }, [])

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files
    const query = searchQuery.toLowerCase()
    return files.filter(file => 
      file.name.toLowerCase().includes(query)
    )
  }, [files, searchQuery])

  // Navigate to folder
  const navigateToFolder = useCallback((folderPath) => {
    setCurrentFolder(folderPath)
    setFiles([])
    setPreviews({})
    setFailedUploads({})
    setUploadProgress({})
    resetMessages()
  }, [resetMessages])

  // Get folder path segments
  const folderSegments = useMemo(() => {
    if (!currentFolder) return []
    return currentFolder.split('/')
  }, [currentFolder])

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
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence>
        {error && (
          <Message
            type="error"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            role="alert"
          >
            {error}
          </Message>
        )}
        {success && (
          <Message
            type="success"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            role="alert"
          >
            {success}
          </Message>
        )}
      </AnimatePresence>

      <FolderNavigation>
        <FolderPath>
          <span onClick={() => navigateToFolder('')}>
            <FolderIcon /> Root
          </span>
          {folderSegments.map((segment, index) => (
            <React.Fragment key={segment}>
              <span>/</span>
              <span 
                onClick={() => 
                  navigateToFolder(
                    folderSegments.slice(0, index + 1).join('/')
                  )
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
              const newPath = currentFolder 
                ? `${currentFolder}/${folderName}`
                : folderName
              createFolder(newPath)
            }
          }}
          whileTap={{ scale: 0.95 }}
        >
          New Folder
        </Button>
      </FolderNavigation>

      <SearchBar>
        <SearchIcon />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchBar>

      <DropZone
        isDragActive={dragActive}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        aria-label="Upload files"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label="Upload files"
        />
        <p>Drop files here or click to select</p>
        <p>
          Accepted formats: {acceptedTypes.join(', ')}
          <br />
          Max size: {maxSize / (1024 * 1024)}MB
        </p>
      </DropZone>

      <AnimatePresence>
        {filteredFiles.length > 0 && (
          <>
            <BatchActions>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                whileTap={{ scale: 0.95 }}
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </Button>
              {Object.keys(failedUploads).length > 0 && (
                <Button
                  onClick={retryFailed}
                  disabled={uploading || retrying}
                  whileTap={{ scale: 0.95 }}
                >
                  {retrying ? 'Retrying...' : 'Retry Failed'}
                </Button>
              )}
              {uploading && (
                <Button
                  variant="error"
                  onClick={cancelAll}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel All
                </Button>
              )}
              <Button
                variant="error"
                onClick={removeAll}
                disabled={uploading}
                whileTap={{ scale: 0.95 }}
              >
                Remove All
              </Button>
            </BatchActions>

            <FileList>
              {filteredFiles.map((file) => (
                <FileItem
                  key={file.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {file.type.startsWith('image/') && previews[file.name] ? (
                    <FilePreview>
                      <img src={previews[file.name]} alt={`Preview of ${file.name}`} />
                    </FilePreview>
                  ) : (
                    <FileIcon type={getFileType(file)}>
                      {FILE_ICONS[getFileType(file)]}
                    </FileIcon>
                  )}
                  <FileDetails>
                    <p>{file.name}</p>
                    <p>
                      {formatFileSize(file.size)}
                      {failedUploads[file.name] && (
                        <span style={{ color: 'red', marginLeft: '0.5rem' }}>
                          Failed: {failedUploads[file.name].message}
                        </span>
                      )}
                    </p>
                  </FileDetails>
                  {uploadProgress[file.name] !== undefined && (
                    <ProgressIndicator 
                      progress={uploadProgress[file.name]}
                      status={uploadProgress[file.name] === 100 ? 'complete' : 'uploading'}
                    />
                  )}
                  <ButtonGroup>
                    {failedUploads[file.name] && (
                      <Button
                        onClick={() => handleUpload([file])}
                        disabled={uploading}
                        whileTap={{ scale: 0.95 }}
                      >
                        Retry
                      </Button>
                    )}
                    <Button
                      variant="error"
                      onClick={() => removeFile(file.name)}
                      disabled={uploading}
                      whileTap={{ scale: 0.95 }}
                    >
                      Remove
                    </Button>
                  </ButtonGroup>
                </FileItem>
              ))}
            </FileList>
          </>
        )}
      </AnimatePresence>
    </Container>
  )
}

FileUpload.propTypes = {
  maxSize: PropTypes.number,
  acceptedTypes: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  bucket: PropTypes.string,
  onUploadComplete: PropTypes.func
}

export default FileUpload 