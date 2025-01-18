import { useState, useRef, useCallback, useEffect } from 'react'
import { uploadFile, validateFile, resumeUpload, formatFileSize, ALLOWED_TYPES } from '../utils/fileUpload'
import FilePreview from './FilePreview'

function FileUpload({ onFileUpload, maxFiles = 10 }) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({})
  const [errors, setErrors] = useState({})
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadQueue, setUploadQueue] = useState([])
  const [pausedUploads, setPausedUploads] = useState({})
  const inputRef = useRef(null)
  const abortControllerRef = useRef({})

  const handleProgress = useCallback((file, percentage) => {
    setProgress(prev => ({
      ...prev,
      [file.name]: percentage
    }))
  }, [])

  const handleError = useCallback((file, error) => {
    setErrors(prev => ({
      ...prev,
      [file.name]: error.message
    }))
    setTimeout(() => {
      setErrors(prev => {
        const { [file.name]: removed, ...rest } = prev
        return rest
      })
    }, 5000)
  }, [])

  const handleRemoveFile = useCallback((file) => {
    setSelectedFiles(prev => prev.filter(f => f !== file))
    setProgress(prev => {
      const { [file.name]: removed, ...rest } = prev
      return rest
    })
    setErrors(prev => {
      const { [file.name]: removed, ...rest } = prev
      return rest
    })
    // Cancel ongoing upload if exists
    if (abortControllerRef.current[file.name]) {
      abortControllerRef.current[file.name].abort()
      delete abortControllerRef.current[file.name]
    }
  }, [])

  const handlePauseUpload = useCallback((file) => {
    if (abortControllerRef.current[file.name]) {
      abortControllerRef.current[file.name].abort()
      delete abortControllerRef.current[file.name]
      
      setPausedUploads(prev => ({
        ...prev,
        [file.name]: {
          file,
          progress: progress[file.name] || 0,
          uploadId: uploadQueue.find(f => f.name === file.name)?.uploadId
        }
      }))
      
      setUploadQueue(prev => prev.filter(f => f.name !== file.name))
    }
  }, [progress, uploadQueue])

  const handleResumeUpload = useCallback(async (file) => {
    const pausedUpload = pausedUploads[file.name]
    if (!pausedUpload) return

    setPausedUploads(prev => {
      const { [file.name]: removed, ...rest } = prev
      return rest
    })

    try {
      const controller = new AbortController()
      abortControllerRef.current[file.name] = controller

      const result = await resumeUpload(
        file,
        pausedUpload.uploadId,
        [],
        (percentage) => handleProgress(file, percentage)
      )

      delete abortControllerRef.current[file.name]
      onFileUpload?.(result)
    } catch (error) {
      if (error.name === 'AbortError') return
      handleError(file, error)
    }
  }, [pausedUploads, handleProgress, handleError, onFileUpload])

  const processFiles = useCallback(async (files) => {
    const newFiles = Array.from(files)
    const totalFiles = selectedFiles.length + newFiles.length

    if (totalFiles > maxFiles) {
      handleError({ name: 'multiple' }, new Error(`Maximum ${maxFiles} files allowed`))
      return
    }

    const validFiles = []
    for (const file of newFiles) {
      try {
        await validateFile(file)
        validFiles.push(file)
      } catch (error) {
        handleError(file, error)
      }
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    setUploadQueue(prev => [...prev, ...validFiles])
  }, [selectedFiles.length, maxFiles, handleError])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files)
    }
  }, [processFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  // Process upload queue
  useEffect(() => {
    if (uploading || uploadQueue.length === 0) return

    const uploadNext = async () => {
      const file = uploadQueue[0]
      setUploading(true)

      try {
        const controller = new AbortController()
        abortControllerRef.current[file.name] = controller

        const result = await uploadFile(file, (percentage) => handleProgress(file, percentage))
        
        delete abortControllerRef.current[file.name]
        onFileUpload?.(result)
      } catch (error) {
        if (error.name === 'AbortError') return
        handleError(file, error)
      } finally {
        setUploading(false)
        setUploadQueue(prev => prev.slice(1))
      }
    }

    uploadNext()
  }, [uploading, uploadQueue, handleProgress, handleError, onFileUpload])

  return (
    <div className="w-full">
      <div 
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          transition-colors duration-200
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
          accept={Object.keys(ALLOWED_TYPES).join(',')}
        />
        
        <div className="space-y-4">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <div className="text-gray-600">
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600 font-medium"
              onClick={() => inputRef.current?.click()}
            >
              Choose files
            </button>
            {' or drag them here'}
          </div>
          
          <div className="text-xs text-gray-500">
            Maximum {maxFiles} files. Supported formats: {
              Object.entries(ALLOWED_TYPES)
                .map(([_, exts]) => exts.join(', '))
                .join(', ')
            }
          </div>
        </div>
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <FilePreview file={file} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  {errors[file.name] && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors[file.name]}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Progress */}
                {progress[file.name] > 0 && progress[file.name] < 100 && (
                  <div className="w-24">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${progress[file.name]}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1">
                      {Math.round(progress[file.name])}%
                    </p>
                  </div>
                )}

                {/* Pause/Resume */}
                {progress[file.name] > 0 && progress[file.name] < 100 && (
                  <button
                    onClick={() => 
                      pausedUploads[file.name]
                        ? handleResumeUpload(file)
                        : handlePauseUpload(file)
                    }
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {pausedUploads[file.name] ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Remove */}
                <button
                  onClick={() => handleRemoveFile(file)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload 