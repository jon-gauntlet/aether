import React from 'react'
import PropTypes from 'prop-types'

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const colorClasses = {
  blue: 'text-blue-500',
  green: 'text-green-500',
  red: 'text-red-500',
  yellow: 'text-yellow-500',
  gray: 'text-gray-500'
}

const speedClasses = {
  slow: 'animate-spin-slow',
  normal: 'animate-spin',
  fast: 'animate-spin-fast'
}

const LoadingSpinner = React.forwardRef(({
  size = 'md',
  color = 'blue',
  speed = 'normal',
  label = 'Loading',
  showTrack = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div 
      ref={ref}
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center transition-opacity duration-200 ${className}`}
      {...props}
    >
      <svg
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          ${speedClasses[speed]}
          ${showTrack ? 'ring-2 ring-gray-200 ring-opacity-50 rounded-full' : ''}
        `}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {label && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  )
})

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['blue', 'green', 'red', 'yellow', 'gray']),
  speed: PropTypes.oneOf(['slow', 'normal', 'fast']),
  label: PropTypes.string,
  showTrack: PropTypes.bool,
  className: PropTypes.string
}

export default LoadingSpinner 