import React, { useState, useRef, useEffect, memo } from 'react'
import { 
  Box, 
  Input, 
  Button, 
  HStack,
  IconButton,
  useColorModeValue,
  Text,
  Textarea,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { SmallAddIcon, ArrowUpIcon } from '@chakra-ui/icons'

const EMOJI_SHORTCUTS = {
  ':)': '😊',
  ':(': '😢',
  ':D': '😃',
  ';)': '😉',
  ':p': '😛',
  '<3': '❤️',
  ':+1:': '👍',
  ':wave:': '👋',
}

const MemoizedEmojiPicker = memo(function EmojiPicker({ onSelect, onClose }) {
  return (
    <div 
      className="absolute bottom-full right-0 mb-2 p-2 bg-white rounded-lg shadow-lg border"
      role="dialog"
      aria-label="Emoji picker"
    >
      <div 
        className="grid grid-cols-8 gap-1"
        role="listbox"
        aria-label="Available emojis"
      >
        {Object.entries(EMOJI_SHORTCUTS).map(([shortcut, emoji]) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="p-1 hover:bg-gray-100 rounded"
            role="option"
            aria-label={`${emoji} (${shortcut})`}
            title={shortcut}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
})

export default function ChatInput({ onSendMessage, placeholder = 'Type a message...', disabled = false }) {
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const inputRef = useRef(null)
  const emojiButtonRef = useRef(null)
  const bgColor = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  useEffect(() => {
    // Focus input on mount and when connection is restored
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker && 
        !emojiButtonRef.current?.contains(event.target)
      ) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e) => {
    let newMessage = e.target.value

    // Replace emoji shortcuts
    Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
      newMessage = newMessage.replace(shortcut, emoji)
    })

    setMessage(newMessage)
  }

  const insertEmoji = (emoji) => {
    const input = inputRef.current
    const start = input.selectionStart
    const end = input.selectionEnd
    const newMessage = message.substring(0, start) + emoji + message.substring(end)
    setMessage(newMessage)
    
    // Move cursor after emoji
    setTimeout(() => {
      input.selectionStart = input.selectionEnd = start + emoji.length
      input.focus()
    }, 0)
  }

  const messageLength = message.length
  const isOverLimit = messageLength > 900
  const remainingChars = 1000 - messageLength

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <InputGroup size="lg">
        <Input
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          pr="4.5rem"
        />
        <InputRightElement width="4.5rem">
          <IconButton
            h="1.75rem"
            size="sm"
            type="submit"
            icon={<ArrowUpIcon />}
            disabled={!message.trim() || disabled}
          />
        </InputRightElement>
      </InputGroup>
      {!disabled && (
        <Text fontSize="xs" color="gray.500" mt={2} px={2}>
          Press Enter to send
        </Text>
      )}
    </form>
  )
} 