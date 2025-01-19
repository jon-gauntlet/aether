import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'
import ProgressIndicator, { useProgress } from './ProgressIndicator'

const FileUpload = () => {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const { isDarkMode } = useTheme()
  const { 
    progress, 
    status, 
    updateProgress, 
    complete, 
    error: setProgressError, 
    reset: resetProgress 
  } = useProgress()

  const validateFile = (file) => {
    const maxSize = 10 // 10MB
    const allowedTypes = ['.pdf', '.doc', '.docx']
    
    if (file.size > maxSize * 1024 * 1024) {
      throw new Error(`File size exceeds ${maxSize}MB limit`)
    }
    
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(ext)) {
      throw new Error('Invalid file type. Allowed types: PDF, DOC, DOCX')
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      try {
        setLoading(true)
        setError(null)
        setSuccess(null)
        resetProgress()
        validateFile(file)
        await handleUpload(file)
      } catch (err) {
        setError(err.message)
        setProgressError()
      } finally {
        setLoading(false)
      }
    }
  }

  const simulateProgress = () => {
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15
      if (currentProgress > 95) {
        clearInterval(interval)
        currentProgress = 95
      }
      updateProgress(currentProgress)
    }, 200)
    return interval
  }

  const handleUpload = async (file) => {
    const progressInterval = simulateProgress()
    
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('files')
        .upload(`${Date.now()}-${file.name}`, file)

      if (uploadError) {
        throw new Error('Upload failed')
      }
      
      clearInterval(progressInterval)
      complete()
      setSuccess('File uploaded successfully')
      await listFiles()
    } catch (err) {
      clearInterval(progressInterval)
      setProgressError()
      throw err
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      resetProgress()
      validateFile(file)
      await handleUpload(file)
    } catch (err) {
      setError(err.message)
      setProgressError()
    } finally {
      setLoading(false)
    }
  }

  const listFiles = async () => {
    try {
      setError(null)
      setSuccess(null)
      setLoading(true)
      const { data, error } = await supabase.storage.from('files').list()
      if (error) {
        throw new Error('Failed to list files')
      }
      setFiles(data || [])
    } catch (err) {
      setError(err.message)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (path) => {
    try {
      setError(null)
      setSuccess(null)
      setLoading(true)
      const { data, error } = await supabase.storage.from('files').download(path)
      if (error) {
        throw new Error('File not found')
      }
      
      // Handle URL.createObjectURL in test environment
      const url = typeof URL.createObjectURL === 'function' 
        ? URL.createObjectURL(data)
        : '#test-download-url'
        
      const a = document.createElement('a')
      a.href = url
      a.download = path.split('/').pop()
      a.click()
      
      if (typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(url)
      }
      
      setSuccess('File downloaded successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (path) => {
    try {
      setError(null)
      setSuccess(null)
      setLoading(true)
      const { error } = await supabase.storage.from('files').remove([path])
      if (error) {
        throw new Error('Failed to delete file')
      }
      setSuccess('File deleted successfully')
      await listFiles()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    listFiles()
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 max-w-4xl mx-auto"
    >
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded"
            role="alert"
          >
            <p className="font-bold">Success</p>
            <p>{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className={`mb-6 p-8 border-2 border-dashed rounded-lg transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : isDarkMode ? 'border-gray-600' : 'border-gray-300'
        } ${isDarkMode ? 'dark:bg-gray-800' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            data-testid="file-input"
            id="file-input"
            disabled={loading}
          />
          <label 
            htmlFor="file-input"
            className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
              loading ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors duration-200`}
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {loading ? 'Uploading...' : 'Choose File or Drop Here'}
          </label>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Supported formats: PDF, DOC, DOCX (Max 10MB)
          </p>
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <ProgressIndicator
                progress={progress}
                status={status}
                isDark={isDarkMode}
                size="sm"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Uploaded Files
        </h2>
        <button
          onClick={listFiles}
          className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
            loading ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors duration-200`}
          data-testid="list-button"
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          Refresh Files
        </button>
      </div>

      <motion.div 
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {files.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            No files uploaded yet
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <motion.div
                key={file.name}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                className={`flex items-center justify-between p-4 rounded-lg shadow hover:shadow-md transition-shadow ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <span className={`flex-1 truncate mr-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {file.name}
                </span>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownload(file.name)}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                      loading ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                    } text-white transition-colors duration-200`}
                    data-testid="download-button"
                    disabled={loading}
                  >
                    Download
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(file.name)}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                      loading ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                    } text-white transition-colors duration-200`}
                    data-testid="delete-button"
                    disabled={loading}
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  )
}

export default FileUpload 