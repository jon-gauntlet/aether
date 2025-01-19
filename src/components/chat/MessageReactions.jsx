import React, { memo } from 'react'

const REACTIONS = {
  '👍': 'thumbs up',
  '❤️': 'heart',
  '😄': 'smile',
  '🎉': 'celebrate',
  '🤔': 'thinking',
  '👀': 'eyes'
}

const MemoizedReactionPicker = memo(function ReactionPicker({ onSelect, onClose }) {
  return (
    <div 
      className="absolute bottom-full left-0 mb-1 p-1 bg-white rounded-full shadow-lg border flex gap-1"
      role="dialog"
      aria-label="Reaction picker"
      onClick={e => e.stopPropagation()}
    >
      {Object.entries(REACTIONS).map(([emoji, name]) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          role="option"
          aria-label={`React with ${name}`}
        >
          <span className="text-sm">{emoji}</span>
        </button>
      ))}
    </div>
  )
})

const ReactionGroup = memo(function ReactionGroup({ reaction, count, isSelected, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm
        transition-all hover:scale-110 active:scale-95
        ${isSelected 
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
      aria-label={`${REACTIONS[reaction] || 'React'} (${count} ${count === 1 ? 'reaction' : 'reactions'})`}
      aria-pressed={isSelected}
    >
      <span className="text-sm">{reaction}</span>
      <span className="text-xs font-medium">{count}</span>
    </button>
  )
})

export default memo(function MessageReactions({ 
  reactions = {}, 
  userReactions = new Set(), 
  onReact,
  disabled = false 
}) {
  const [showPicker, setShowPicker] = React.useState(false)
  const pickerRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }

    if (showPicker) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showPicker])

  const handleReact = (reaction) => {
    if (!disabled) {
      onReact(reaction)
      setShowPicker(false)
    }
  }

  const sortedReactions = Object.entries(reactions)
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="flex flex-wrap gap-1 relative" ref={pickerRef}>
      {sortedReactions.map(([reaction, count]) => (
        <ReactionGroup
          key={reaction}
          reaction={reaction}
          count={count}
          isSelected={userReactions.has(reaction)}
          onToggle={() => handleReact(reaction)}
        />
      ))}
      <button
        onClick={() => setShowPicker(!showPicker)}
        disabled={disabled}
        className={`
          inline-flex items-center px-2 py-1 rounded-full text-sm
          transition-all hover:scale-110 active:scale-95
          ${disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
        aria-label="Add reaction"
        aria-expanded={showPicker}
        aria-haspopup="dialog"
      >
        <span className="text-sm">+</span>
      </button>
      {showPicker && (
        <MemoizedReactionPicker
          onSelect={handleReact}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}) 