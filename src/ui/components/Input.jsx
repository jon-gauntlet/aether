import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

function Input({ onSubmit, isLoading, error, maxLength = 1000 }) {
  const [input, setInput] = useState('')
  const [charCount, setCharCount] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  const handleSubmit = e => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSubmit(input.trim())
      setInput('')
      setCharCount(0)
    }
  }

  const handleKeyDown = e => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const handleChange = e => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setInput(value)
      setCharCount(value.length)
    }
  }

  return (
    <div className="space-y-2">
      <form 
        onSubmit={handleSubmit} 
        className="flex gap-2 relative"
      >
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Cmd/Ctrl + Enter to send)"
            className={`
              w-full px-4 py-2 pr-12 min-h-[50px] max-h-[200px]
              border rounded-lg resize-y
              focus:outline-none focus:ring-2 
              ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
              ${isLoading ? 'bg-gray-50' : 'bg-white'}
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            `}
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {charCount}/{maxLength}
          </div>
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`
            px-6 py-2 rounded-lg font-medium
            transition-all duration-200
            ${isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
            }
            text-white shadow-sm hover:shadow
            disabled:opacity-50 disabled:cursor-not-allowed
            min-w-[100px]
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100" />
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200" />
            </div>
          ) : (
            'Send'
          )}
        </button>
      </form>
      {error && (
        <div className="text-sm text-red-500 px-2">
          {error}
        </div>
      )}
    </div>
  )
}

Input.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  maxLength: PropTypes.number,
}

Input.defaultProps = {
  isLoading: false,
  error: null,
  maxLength: 1000,
}

export default Input
