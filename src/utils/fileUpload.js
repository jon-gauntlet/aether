import { supabase } from './supabase'

const MAX_CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
const ALLOWED_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'application/pdf': ['pdf'],
  'text/plain': ['txt'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'text/markdown': ['md'],
  'application/json': ['json'],
  'text/javascript': ['js'],
  'text/html': ['html', 'htm'],
  'text/css': ['css']
}
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function validateFile(file) {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Check file type
  const fileExt = file.name.split('.').pop().toLowerCase()
  const isValidType = Object.entries(ALLOWED_TYPES).some(([mimeType, extensions]) => 
    file.type === mimeType && extensions.includes(fileExt)
  )

  if (!isValidType) {
    throw new Error('Invalid file type. Allowed types: ' + 
      Object.entries(ALLOWED_TYPES)
        .map(([_, exts]) => exts.join(', '))
        .join(', ')
    )
  }

  return true
}

async function initMultipartUpload(filePath) {
  const { data, error } = await supabase.storage
    .from('uploads')
    .createMultipartUpload(filePath)
  
  if (error) throw error
  return data.uploadId
}

async function uploadChunk(file, uploadId, chunkNumber, chunk, onProgress) {
  const { data, error } = await supabase.storage
    .from('uploads')
    .uploadChunk(file.name, uploadId, chunkNumber, chunk)
  
  if (error) throw error
  
  const progress = (chunkNumber * MAX_CHUNK_SIZE) / file.size * 100
  onProgress?.(Math.min(progress, 100))
  
  return data
}

async function completeMultipartUpload(filePath, uploadId, parts) {
  const { data, error } = await supabase.storage
    .from('uploads')
    .completeMultipartUpload(filePath, uploadId, parts)
  
  if (error) throw error
  return data
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function uploadWithRetry(fn, retries = MAX_RETRIES) {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0 && error.name !== 'AbortError') {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return uploadWithRetry(fn, retries - 1)
    }
    throw error
  }
}

// Save upload state to localStorage
function saveUploadState(file, uploadId, parts) {
  const key = `upload_${file.name}`
  localStorage.setItem(key, JSON.stringify({
    uploadId,
    parts,
    timestamp: Date.now(),
    size: file.size,
    type: file.type
  }))
}

// Get saved upload state
function getSavedUploadState(file) {
  const key = `upload_${file.name}`
  const saved = localStorage.getItem(key)
  if (!saved) return null

  const state = JSON.parse(saved)
  // Verify the file hasn't changed
  if (state.size !== file.size || state.type !== file.type) return null
  // Expire saved state after 24 hours
  if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) return null

  return state
}

// Clear saved upload state
function clearUploadState(file) {
  const key = `upload_${file.name}`
  localStorage.removeItem(key)
}

export async function uploadFile(file, onProgress) {
  validateFile(file)

  // Check for saved upload state
  const savedState = getSavedUploadState(file)
  if (savedState) {
    try {
      const result = await resumeUpload(file, savedState.uploadId, savedState.parts, onProgress)
      clearUploadState(file)
      return result
    } catch (error) {
      console.warn('Failed to resume upload:', error)
      clearUploadState(file)
      // Fall through to start new upload
    }
  }

  const fileExt = file.name.split('.').pop().toLowerCase()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `uploads/${fileName}`

  // For small files, use direct upload with retry
  if (file.size <= MAX_CHUNK_SIZE) {
    return await uploadWithRetry(async () => {
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            onProgress?.(Math.round((progress.loaded / progress.total) * 100))
          }
        })

      if (error) throw error
      return data
    })
  }

  // For large files, use multipart upload with state persistence
  const uploadId = await uploadWithRetry(() => initMultipartUpload(filePath))
  const parts = []
  const chunks = Math.ceil(file.size / MAX_CHUNK_SIZE)

  try {
    for (let i = 0; i < chunks; i++) {
      const start = i * MAX_CHUNK_SIZE
      const end = Math.min(start + MAX_CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      
      const part = await uploadWithRetry(async () => {
        const result = await uploadChunk(file, uploadId, i + 1, chunk, onProgress)
        return result
      })

      parts.push({ partNumber: i + 1, etag: part.etag })
      // Save progress after each successful chunk
      saveUploadState(file, uploadId, parts)
    }

    const result = await uploadWithRetry(() => completeMultipartUpload(filePath, uploadId, parts))
    clearUploadState(file)
    return result
  } catch (error) {
    // Save state on error for later resume
    if (error.name !== 'AbortError') {
      saveUploadState(file, uploadId, parts)
    }
    throw error
  }
}

export async function resumeUpload(file, uploadId, completedParts = [], onProgress) {
  validateFile(file)
  
  const chunks = Math.ceil(file.size / MAX_CHUNK_SIZE)
  const parts = [...completedParts]
  const completedChunks = new Set(completedParts.map(p => p.partNumber))

  for (let i = 0; i < chunks; i++) {
    if (completedChunks.has(i + 1)) continue

    const start = i * MAX_CHUNK_SIZE
    const end = Math.min(start + MAX_CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)
    
    const part = await uploadChunk(file, uploadId, i + 1, chunk, onProgress)
    parts.push({ partNumber: i + 1, etag: part.etag })
  }

  const filePath = `uploads/${file.name}`
  return await completeMultipartUpload(filePath, uploadId, parts)
}

// Format file size for display
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export { ALLOWED_TYPES, MAX_FILE_SIZE } 