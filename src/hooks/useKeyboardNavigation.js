import { useEffect, useCallback } from 'react'

export default function useKeyboardNavigation({
  messageContainerRef,
  messages,
  onReplyToMessage,
  onScrollToBottom,
  onEscape
}) {
  const handleKeyDown = useCallback((e) => {
    // Cmd/Ctrl + / to focus input
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault()
      const input = document.querySelector('[role="textbox"]')
      input?.focus()
    }

    // Escape to blur input or close modals
    if (e.key === 'Escape') {
      onEscape?.()
    }

    // Cmd/Ctrl + ArrowDown to scroll to bottom
    if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown') {
      e.preventDefault()
      onScrollToBottom?.()
    }

    // Cmd/Ctrl + ArrowUp to scroll to top
    if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp') {
      e.preventDefault()
      messageContainerRef.current?.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    // Cmd/Ctrl + R to reply to last message
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault()
      const lastMessage = messages[messages.length - 1]
      if (lastMessage) {
        onReplyToMessage?.(lastMessage)
      }
    }
  }, [messageContainerRef, messages, onReplyToMessage, onScrollToBottom, onEscape])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Add ARIA live region for new messages
  useEffect(() => {
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    document.body.appendChild(liveRegion)

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const lastMessage = messages[messages.length - 1]
          if (lastMessage) {
            liveRegion.textContent = `New message from ${lastMessage.role}: ${lastMessage.content}`
          }
        }
      })
    })

    const config = { childList: true, subtree: true }
    messageContainerRef.current && observer.observe(messageContainerRef.current, config)

    return () => {
      observer.disconnect()
      document.body.removeChild(liveRegion)
    }
  }, [messageContainerRef, messages])

  return {
    handleKeyDown
  }
} 