import { useState, useCallback, memo } from 'react'
import { useFiles } from '../../contexts/FileContext'

function FileUpload({ currentTeam }) {
  const { uploadFile } = useFiles()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else {
      setDragActive(false)
    }
  }, [])

  const handleUpload = useCallback(async (files) => {
    setUploading(true)
    const fileIds = Array.from(files).map(file => file.name) // Use filename as ID
    
    // Initialize progress for each file
    setUploadProgress(prev => ({
      ...prev,
      ...Object.fromEntries(fileIds.map(id => [id, 0]))
    }))

    try {
      await Promise.all(
        Array.from(files).map(async file => {
          const onProgress = (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }))
          }

          await uploadFile(file, currentTeam?.id, onProgress)
          
          // Set final progress
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }))
        })
      )
    } finally {
      // Clear progress after a delay
      setTimeout(() => {
        setUploading(false)
        setUploadProgress({})
      }, 1000)
    }
  }, [uploadFile, currentTeam])

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files?.length) {
      await handleUpload(e.dataTransfer.files)
    }
  }, [handleUpload])

  const handleFileSelect = useCallback(async (e) => {
    if (e.target.files?.length) {
      await handleUpload(e.target.files)
    }
  }, [handleUpload])

  return (
    <>
      <div className="flex justify-end mb-4">
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <span className={`px-4 py-2 rounded-lg inline-flex items-center ${
            uploading 
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}>
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : 'Upload Files'}
          </span>
        </label>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center relative
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v20c0 4.418 3.582 8 8 8h16c4.418 0 8-3.582 8-8V14m-16 0v24m0-24L16 6m8 8l8-8" />
          </svg>
          <p className="text-gray-600">
            Drag and drop files here, or click to select files
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && Object.keys(uploadProgress).length > 0 && (
          <div className="absolute inset-x-0 bottom-0 p-4 bg-white bg-opacity-90">
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="text-sm">
                  <div className="flex justify-between text-gray-600 mb-1">
                    <span className="truncate">{filename}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default memo(FileUpload) 