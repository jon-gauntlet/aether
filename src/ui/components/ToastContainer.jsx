import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import Toast from './Toast'

const ToastContainer = forwardRef((props, ref) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  useImperativeHandle(ref, () => ({
    addToast
  }))

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 space-y-2"
      {...props}
    >
      {toasts.map(({ id, message, type, duration }) => (
        <Toast
          key={id}
          message={message}
          type={type}
          duration={duration}
          onClose={() => removeToast(id)}
        />
      ))}
    </div>
  )
})

// Create a singleton instance for global toast management
let toastContainer = null

export function showToast(options) {
  if (toastContainer) {
    return toastContainer.addToast(options)
  }
  console.warn('ToastContainer not initialized')
  return null
}

export function setToastContainer(container) {
  toastContainer = container
}

export default ToastContainer 