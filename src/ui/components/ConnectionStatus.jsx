import React from 'react'
import PropTypes from 'prop-types'

function ConnectionStatus({ isConnected, reconnectAttempts = 0, className = '' }) {
  const statusText = isConnected 
    ? 'Connected' 
    : reconnectAttempts > 0 
      ? `Reconnecting (${reconnectAttempts})...`
      : 'Disconnected'

  const dotClass = `
    w-2 h-2 rounded-full 
    ${isConnected 
      ? 'bg-green-500 animate-pulse' 
      : reconnectAttempts > 0
        ? 'bg-yellow-500 animate-bounce'
        : 'bg-red-500'
    }
  `

  const containerClass = `
    flex items-center space-x-2 px-3 py-1.5 rounded-full
    font-medium text-sm transition-all duration-200
    ${isConnected 
      ? 'bg-green-50 text-green-700' 
      : reconnectAttempts > 0
        ? 'bg-yellow-50 text-yellow-700'
        : 'bg-red-50 text-red-700'
    }
    ${className}
  `

  return (
    <div 
      className={containerClass}
      role="status"
      aria-live="polite"
    >
      <div className={dotClass} />
      <span>{statusText}</span>
    </div>
  )
}

ConnectionStatus.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  reconnectAttempts: PropTypes.number,
  className: PropTypes.string
}

export default ConnectionStatus 