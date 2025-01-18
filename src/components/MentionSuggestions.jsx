import { memo } from 'react'

function MentionSuggestions({ suggestions, onSelect, style }) {
  if (!suggestions.length) return null

  return (
    <div 
      className="absolute z-10 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto"
      style={style}
    >
      {suggestions.map((user) => (
        <button
          key={user.id}
          className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
          onClick={() => onSelect(user)}
        >
          <div className="flex items-center gap-2">
            {user.avatar && (
              <img 
                src={user.avatar} 
                alt={user.name || user.email}
                className="w-6 h-6 rounded-full"
              />
            )}
            <div>
              {user.name && (
                <div className="font-medium">{user.name}</div>
              )}
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default memo(MentionSuggestions) 