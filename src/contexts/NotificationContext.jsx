import { createContext, useContext, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const NotificationContext = createContext({})

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((notification) => {
    const id = uuidv4()
    const newNotification = {
      id,
      createdAt: new Date(),
      duration: 5000, // Default duration
      type: 'info', // Default type
      ...notification
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto remove notification after duration
    if (newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
} 