import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function FileUpload({ maxSize = 10, allowedTypes = ['pdf', 'doc', 'docx'] }) {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  // Load initial file list
  useEffect(() => {
    listFiles()
  }, [])

  const validateFile = (file) => {
    // Check file size (MB)
    if (file.size > maxSize * 1024 * 1024) {
      throw new Error(`File size exceeds ${maxSize}MB limit`)
    }

    // Check file type
    const extension = file.name.split('.').pop().toLowerCase()
    if (!allowedTypes.includes(extension)) {
      throw new Error('File type not allowed')
    }
  }

  const handleFileChange = async (e) => {
    try {
      setError(null)
      setSuccess(null)
      setLoading(true)
      const file = e.target.files[0]
      
      if (!file) return

      validateFile(file)

      const { data, error: uploadError } = await supabase
        .storage
        .from('files')
        .upload(file.name, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error('Upload failed')
      }

      setSuccess('File uploaded successfully')
      await listFiles() // Refresh file list
    } catch (err) {
      setError(err.message)
      throw err // Re-throw for test catching
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (fileName) => {
    try {
      setError(null)
      setLoading(true)
      const { data, error } = await supabase
        .storage
        .from('files')
        .download(fileName)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err.message)
      throw err // Re-throw for test catching
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileName) => {
    try {
      setError(null)
      setLoading(true)
      const { error } = await supabase
        .storage
        .from('files')
        .remove([fileName])

      if (error) throw error

      await listFiles() // Refresh file list
    } catch (err) {
      setError(err.message)
      throw err // Re-throw for test catching
    } finally {
      setLoading(false)
    }
  }

  const listFiles = async () => {
    try {
      setError(null)
      setLoading(true)
      const { data, error } = await supabase
        .storage
        .from('files')
        .list()

      if (error) throw error

      setFiles(data || [])
    } catch (err) {
      setError(err.message)
      throw err // Re-throw for test catching
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      {error && <div role="alert" className="text-red-500 mb-4">{error}</div>}
      {success && <div role="alert" className="text-green-500 mb-4">{success}</div>}
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