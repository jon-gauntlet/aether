import React from 'react'
import PropTypes from 'prop-types'
import { format } from 'date-fns'

const roleStyles = {
  user: {
    container: 'justify-end',
    message: 'bg-blue-500 text-white',
    arrow: 'border-blue-500',
  },
  assistant: {
    container: 'justify-start',
    message: 'bg-white border border-gray-200',
    arrow: 'border-gray-200',
  },
  system: {
    container: 'justify-center',
    message: 'bg-gray-100 border border-gray-200 text-gray-600 text-sm',
    arrow: 'border-gray-200',
  },
}

const Message = React.forwardRef(({
  content,
  role = 'user',
  timestamp,
  replyTo,
  isSelected,
  onReply,
  className = '',
  ...props
}, ref) => {
  const styles = roleStyles[role]
  const formattedTime = timestamp ? format(new Date(timestamp), 'h:mm a') : ''

  return (
    <div 
      ref={ref}
      className={`
        flex items-end space-x-2 group
        ${styles.container}
        ${className}
        ${isSelected ? 'opacity-75' : ''}
      `}
      {...props}
    >
      {role === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
          A
        </div>
      )}

      <div className="max-w-[70%] space-y-1">
        {replyTo && (
          <div className="ml-4 -mb-1 text-xs text-gray-500 flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>Replying to message</span>
          </div>
        )}

        <div 
          className={`
            relative rounded-lg px-4 py-2
            ${styles.message}
          `}
        >
          <div className="whitespace-pre-wrap break-words">
            {content}
          </div>

          <div className="absolute bottom-0 right-0 translate-y-full mt-1 hidden group-hover:flex items-center space-x-2">
            <button
              onClick={onReply}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1 bg-white rounded-md shadow-sm border border-gray-200 px-2 py-1 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Reply</span>
            </button>
            <span className="text-xs text-gray-400">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
      )}
    </div>
  )
})

Message.propTypes = {
  content: PropTypes.string.isRequired,
  role: PropTypes.oneOf(['user', 'assistant', 'system']),
  timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  replyTo: PropTypes.string,
  isSelected: PropTypes.bool,
  onReply: PropTypes.func,
  className: PropTypes.string,
}

export default Message
