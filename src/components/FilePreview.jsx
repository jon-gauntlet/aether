import { useState, useEffect, useCallback } from 'react'
import { formatFileSize } from '../utils/fileUpload'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Map file extensions to languages for syntax highlighting
const LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  rb: 'ruby',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  html: 'html',
  css: 'css',
  scss: 'scss',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  xml: 'xml'
}

function FilePreview({ file }) {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dimensions, setDimensions] = useState(null)
  const [duration, setDuration] = useState(null)

  const generatePreview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const fileExt = file.name.split('.').pop().toLowerCase()
      
      // Handle images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        const img = new Image()
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            setDimensions({ width: img.width, height: img.height })
            resolve()
          }
          img.onerror = reject
          img.src = url
        })
        
        setPreview({ type: 'image', url })
        return
      }
      
      // Handle PDFs
      if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file)
        setPreview({ type: 'pdf', url })
        return
      }
      
      // Handle video
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file)
        const video = document.createElement('video')
        
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            setDimensions({ width: video.videoWidth, height: video.videoHeight })
            setDuration(video.duration)
            resolve()
          }
          video.onerror = reject
          video.src = url
        })
        
        setPreview({ type: 'video', url })
        return
      }
      
      // Handle audio
      if (file.type.startsWith('audio/')) {
        const url = URL.createObjectURL(file)
        const audio = new Audio()
        
        await new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            setDuration(audio.duration)
            resolve()
          }
          audio.onerror = reject
          audio.src = url
        })
        
        setPreview({ type: 'audio', url })
        return
      }
      
      // Handle text and code files
      if (file.type.startsWith('text/') || LANGUAGE_MAP[fileExt]) {
        const text = await file.text()
        const firstLine = text.split('\n')[0]
        const preview = text.length > 500 ? text.slice(0, 500) + '...' : text
        
        setPreview({
          type: 'code',
          content: preview,
          language: LANGUAGE_MAP[fileExt] || 'text',
          firstLine
        })
        return
      }
      
      // Handle Office documents
      if (file.type.includes('word')) {
        setPreview({ type: 'word' })
      } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
        setPreview({ type: 'excel' })
      } else if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
        setPreview({ type: 'powerpoint' })
      } else {
        // Default preview
        setPreview({ type: 'default' })
      }
    } catch (err) {
      console.error('Error generating preview:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [file])

  useEffect(() => {
    generatePreview()
    
    return () => {
      // Cleanup object URLs
      if (preview?.url) {
        URL.revokeObjectURL(preview.url)
      }
    }
  }, [file, generatePreview])

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[100px]">
          <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-red-500 text-sm">
          Error previewing file: {error}
        </div>
      )
    }

    if (!preview) return null

    switch (preview.type) {
      case 'image':
        return (
          <div className="relative group">
            <img
              src={preview.url}
              alt={file.name}
              className="max-w-full h-auto rounded-lg"
            />
            {dimensions && (
              <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {dimensions.width} × {dimensions.height}
              </div>
            )}
          </div>
        )

      case 'pdf':
        return (
          <div className="flex items-center space-x-2 text-red-500">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 16H8V8h4a4 4 0 110 8zm0-6h-2v4h2a2 2 0 100-4z"/>
            </svg>
            <span className="text-sm font-medium">{file.name}</span>
          </div>
        )

      case 'video':
        return (
          <div className="relative group">
            <video
              src={preview.url}
              className="max-w-full h-auto rounded-lg"
              controls={false}
              onMouseOver={e => e.target.play()}
              onMouseOut={e => e.target.pause()}
              muted
            />
            {(dimensions || duration) && (
              <div className="absolute bottom-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                {dimensions && `${dimensions.width} × ${dimensions.height}`}
                {duration && ` • ${Math.round(duration)}s`}
              </div>
            )}
          </div>
        )

      case 'audio':
        return (
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v18M8 8v8M4 10v4M16 7v10M20 5v14"/>
            </svg>
            <div className="text-sm">
              <div className="font-medium">{file.name}</div>
              {duration && (
                <div className="text-gray-500">{Math.round(duration)}s</div>
              )}
            </div>
          </div>
        )

      case 'code':
        return (
          <div className="max-h-[200px] overflow-auto rounded-lg text-sm">
            <SyntaxHighlighter
              language={preview.language}
              style={vscDarkPlus}
              customStyle={{ margin: 0, padding: '1rem' }}
            >
              {preview.content}
            </SyntaxHighlighter>
          </div>
        )

      case 'word':
        return (
          <div className="flex items-center space-x-2 text-blue-500">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 14H8v-2h8v2zm0-4H8v-2h8v2zm0-4H8V7h8v2z"/>
            </svg>
            <span className="text-sm font-medium">{file.name}</span>
          </div>
        )

      case 'excel':
        return (
          <div className="flex items-center space-x-2 text-green-500">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 14h-3v-3h3v3zm0-5h-3V9h3v3zm0-5h-3V4h3v3zm-5 10H8v-3h3v3zm0-5H8V9h3v3zm0-5H8V4h3v3z"/>
            </svg>
            <span className="text-sm font-medium">{file.name}</span>
          </div>
        )

      case 'powerpoint':
        return (
          <div className="flex items-center space-x-2 text-orange-500">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h2v8z"/>
            </svg>
            <span className="text-sm font-medium">{file.name}</span>
          </div>
        )

      default:
        return (
          <div className="flex items-center space-x-2 text-gray-500">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            <div className="text-sm">
              <div className="font-medium">{file.name}</div>
              <div className="text-gray-500">{formatFileSize(file.size)}</div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-full">
      {renderPreview()}
    </div>
  )
}

export default FilePreview 