import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const FileUpload = () => {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

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

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      validateFile(file)

      const { data, error: uploadError } = await supabase.storage
        .from('files')
        .upload(`${Date.now()}-${file.name}`, file)

      if (uploadError) {
        throw new Error('Upload failed')
      }
      
      setSuccess('File uploaded successfully')
      await listFiles()
    } catch (err) {
      setError(err.message)
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
    <div className="p-4">
      {error && (
        <div className="text-red-500 mb-4" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="text-green-500 mb-4" role="alert">
          {success}
        </div>
      )}
      <div className="mb-4">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="mb-2"
          data-testid="file-input"
          disabled={loading}
        />
        <button
          onClick={listFiles}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          data-testid="list-button"
          disabled={loading}
        >
          Refresh Files
        </button>
      </div>
      <div className="space-y-2">
        {files.map((file) => (
          <div key={file.name} className="flex items-center space-x-2">
            <span>{file.name}</span>
            <button
              onClick={() => handleDownload(file.name)}
              className="bg-green-500 text-white px-2 py-1 rounded"
              data-testid="download-button"
              disabled={loading}
            >
              Download
            </button>
            <button
              onClick={() => handleDelete(file.name)}
              className="bg-red-500 text-white px-2 py-1 rounded"
              data-testid="delete-button"
              disabled={loading}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileUpload 