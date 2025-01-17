import React from 'react'
import PropTypes from 'prop-types'

const TypingIndicator = ({ className = '' }) => {
  return (
    <div 
      role="status" 
      aria-label="User is typing"
      className={`flex items-center space-x-2 ${className}`}
    >
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
    </div>
  )
}

TypingIndicator.propTypes = {
  className: PropTypes.string
}

export default TypingIndicator 