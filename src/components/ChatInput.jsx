import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useTypingStatus } from '../hooks/useTypingStatus'
import FormattedMessage from './FormattedMessage'
import EmojiPicker from 'emoji-picker-react'
import MentionSuggestions from './MentionSuggestions'
import { useUsers } from '../hooks/useUsers'

function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [mentionSuggestionsPos, setMentionSuggestionsPos] = useState(null)
  const { setTyping } = useTypingStatus()
  const { users } = useUsers()
  const textareaRef = useRef(null)
  const emojiButtonRef = useRef(null)
  
  // Filter users based on mention search
  const mentionSuggestions = useMemo(() => {
    if (!mentionSearch) return []
    const searchLower = mentionSearch.toLowerCase()
    return users.filter(user => 
      user.name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    ).slice(0, 5) // Limit to 5 suggestions
  }, [users, mentionSearch])

  // Handle message changes and detect @ mentions
  const handleMessageChange = (e) => {
    const newValue = e.target.value
    setMessage(newValue)

    // Check for @ mentions
    const textarea = e.target
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const mentionText = mentionMatch[1]
      setMentionSearch(mentionText)

      // Calculate mention suggestions position
      const textareaRect = textarea.getBoundingClientRect()
      const caretCoords = getCaretCoordinates(textarea, cursorPos)
      
      setMentionSuggestionsPos({
        top: textareaRect.top + caretCoords.top + 20,
        left: textareaRect.left + caretCoords.left
      })
    } else {
      setMentionSearch('')
      setMentionSuggestionsPos(null)
    }
  }

  // Handle mention selection
  const handleMentionSelect = (user) => {
    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const textBeforeMention = message.slice(0, cursorPos).replace(/@\w*$/, '')
    const textAfterMention = message.slice(cursorPos)
    const mentionText = `@${user.email.split('@')[0]} `
    
    const newMessage = textBeforeMention + mentionText + textAfterMention
    setMessage(newMessage)
    setMentionSearch('')
    setMentionSuggestionsPos(null)
    
    // Set cursor position after mention
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = textBeforeMention.length + mentionText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Handle key navigation for mentions
  const handleKeyDown = (e) => {
    // Submit on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSubmit(e)
      return
    }

    // Close mention suggestions on Escape
    if (e.key === 'Escape' && mentionSuggestionsPos) {
      e.preventDefault()
      setMentionSearch('')
      setMentionSuggestionsPos(null)
      return
    }

    // Markdown shortcuts
    if (e.key === 'b' && e.ctrlKey) {
      e.preventDefault()
      insertMarkdown('**', '**', 'bold text')
    } else if (e.key === 'i' && e.ctrlKey) {
      e.preventDefault()
      insertMarkdown('*', '*', 'italic text')
    } else if (e.key === 'k' && e.ctrlKey) {
      e.preventDefault()
      insertMarkdown('[', '](url)', 'link text')
    } else if (e.key === '`' && e.ctrlKey) {
      e.preventDefault()
      if (e.shiftKey) {
        insertMarkdown('```\n', '\n```', 'code block')
      } else {
        insertMarkdown('`', '`', 'code')
      }
    }
  }

  // Debounced typing status
  useEffect(() => {
    if (!message || isComposing) return
    
    // Set typing status to true when user starts typing
    setTyping(true)
    
    // Set typing status to false after 1 second of no typing
    const timeout = setTimeout(() => {
      setTyping(false)
    }, 1000)
    
    return () => clearTimeout(timeout)
  }, [message, isComposing, setTyping])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    try {
      await onSendMessage({ text: message.trim() })
      setMessage('')
      setTyping(false)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const insertMarkdown = (prefix, suffix, placeholder) => {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = message.substring(start, end)
    const replacement = selectedText || placeholder
    const newMessage = 
      message.substring(0, start) + 
      prefix +
      replacement +
      suffix +
      message.substring(end)
    
    setMessage(newMessage)
    
    // Set cursor position
    const newCursorPos = selectedText ? 
      start + prefix.length + selectedText.length + suffix.length :
      start + prefix.length
    
    // Need to wait for React to update the textarea
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        selectedText ? start + prefix.length : start + prefix.length,
        selectedText ? end + prefix.length : start + prefix.length + placeholder.length
      )
    }, 0)
  }

  const handleEmojiClick = (emojiData) => {
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMessage = 
      message.substring(0, start) + 
      emojiData.emoji +
      message.substring(end)
    
    setMessage(newMessage)
    setShowEmojiPicker(false)
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + emojiData.emoji.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertTable = () => {
    const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`
    insertMarkdown(tableTemplate, '', '')
  }

  const insertTaskList = () => {
    const taskListTemplate = `
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
`
    insertMarkdown(taskListTemplate, '', '')
  }

  const renderToolbar = () => (
    <div className="flex items-center gap-2 px-2 py-1 border-b">
      <button
        type="button"
        onClick={() => insertMarkdown('**', '**', 'bold text')}
        className="p-1 hover:bg-gray-100 rounded"
        title="Bold (Ctrl+B)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('*', '*', 'italic text')}
        className="p-1 hover:bg-gray-100 rounded"
        title="Italic (Ctrl+I)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4M12 4v16M8 20h8" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('`', '`', 'code')}
        className="p-1 hover:bg-gray-100 rounded"
        title="Code (Ctrl+`)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('```\n', '\n```', 'code block')}
        className="p-1 hover:bg-gray-100 rounded"
        title="Code Block (Ctrl+Shift+`)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => insertMarkdown('[', '](url)', 'link text')}
        className="p-1 hover:bg-gray-100 rounded"
        title="Link (Ctrl+K)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
      <button
        type="button"
        onClick={insertTable}
        className="p-1 hover:bg-gray-100 rounded"
        title="Insert Table"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 18h18M3 6h18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={insertTaskList}
        className="p-1 hover:bg-gray-100 rounded"
        title="Insert Task List"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </button>
      <div className="relative">
        <button
          type="button"
          ref={emojiButtonRef}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 hover:bg-gray-100 rounded"
          title="Insert Emoji"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 z-10">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              lazyLoadEmojis
              searchPlaceholder="Search emoji..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className={`p-1 rounded ${showPreview ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
        title="Toggle Preview"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </button>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="border-t">
      {renderToolbar()}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={`Type a message... (Use @ to mention users)\n\nShortcuts:\nCtrl+B: Bold\nCtrl+I: Italic\nCtrl+K: Link\nCtrl+`: Code\nCtrl+Shift+`: Code Block`}
              className="w-full resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              rows={4}
            />
            {mentionSuggestionsPos && (
              <MentionSuggestions
                suggestions={mentionSuggestions}
                onSelect={handleMentionSelect}
                style={{
                  position: 'fixed',
                  top: mentionSuggestionsPos.top,
                  left: mentionSuggestionsPos.left
                }}
              />
            )}
          </div>
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
          >
            Send
          </button>
        </div>
        {showPreview && message && (
          <div className="mt-4 p-3 border rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500 mb-2">Preview:</div>
            <FormattedMessage content={message} isOwnMessage={false} />
          </div>
        )}
      </div>
    </form>
  )
}

export default ChatInput 