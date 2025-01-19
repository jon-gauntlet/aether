import { useEffect } from 'react'

const shortcuts = {
  'mod+k': 'Search',
  'mod+/': 'Show shortcuts',
  'mod+j': 'Toggle dark mode',
  'mod+,': 'Open settings',
  'mod+[': 'Previous channel',
  'mod+]': 'Next channel',
  'mod+shift+f': 'Toggle fullscreen',
  'esc': 'Close modal/cancel',
  'mod+enter': 'Send message',
  'mod+shift+u': 'Upload file',
  'mod+shift+m': 'Toggle mute',
  'mod+shift+h': 'Toggle sidebar'
}

export const useKeyboardShortcuts = (handlers) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Build key combo string
      const combo = []
      if (event.metaKey || event.ctrlKey) combo.push('mod')
      if (event.shiftKey) combo.push('shift')
      if (event.altKey) combo.push('alt')
      
      // Add the key if it's not a modifier
      const key = event.key.toLowerCase()
      if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
        combo.push(key)
      }
      
      const shortcutKey = combo.join('+')
      
      // Check if this combo has a handler
      if (handlers[shortcutKey]) {
        event.preventDefault()
        handlers[shortcutKey](event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}

export const useShortcutsHelp = (isOpen, setIsOpen) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setIsOpen])

  return { shortcuts }
}

// Helper to format shortcut for display
export const formatShortcut = (shortcut) => {
  return shortcut
    .split('+')
    .map(key => {
      switch (key) {
        case 'mod':
          return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'
        case 'shift':
          return '⇧'
        case 'alt':
          return navigator.platform.includes('Mac') ? '⌥' : 'Alt'
        case 'enter':
          return '↵'
        case 'esc':
          return '⎋'
        default:
          return key.toUpperCase()
      }
    })
    .join(' + ')
}

// Helper to check if a shortcut is available
export const isShortcutAvailable = (shortcut) => {
  const keys = shortcut.split('+')
  return !keys.some(key => {
    // Check if required browser features are available
    if (key === 'mod' && !('metaKey' in new KeyboardEvent('keydown'))) {
      return true
    }
    return false
  })
} 