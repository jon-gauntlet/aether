import { memo, useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import Message from './Message'
import MessageGroup from './MessageGroup'
import { measureRender } from '../utils/performance'

const ITEM_SIZE = 72 // Approximate height of a message

function MessageList({ messages, onMessageRead }) {
  // Memoize expensive message grouping computation
  const messageGroups = useMemo(() => {
    // Group messages by date
    const groups = messages.reduce((groups, message) => {
      const date = new Date(message.created_at)
      const day = date.toLocaleDateString()
      
      if (!groups[day]) {
        groups[day] = []
      }
      groups[day].push(message)
      return groups
    }, {})

    // Convert grouped messages to array format for virtualization
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      timestamp: new Date(messages[0].created_at),
      messages
    }))
  }, [messages])

  // Memoize row renderer to prevent unnecessary re-renders
  const Row = useCallback(({ index, style }) => {
    const group = messageGroups[index]
    return (
      <div style={style}>
        <MessageGroup
          messages={group.messages}
          timestamp={group.timestamp}
          onMessageRead={onMessageRead}
        />
      </div>
    )
  }, [messageGroups, onMessageRead])

  return (
    <div className="h-full">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={messageGroups.length}
            itemSize={ITEM_SIZE}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  )
}

// Wrap with performance monitoring and memoization
export default measureRender(memo(MessageList)) 