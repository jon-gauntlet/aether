import React, { useState } from 'react'
import styled from 'styled-components'
import { useMessages } from '@/core/messaging/MessageProvider'
import { useAuth } from '@/core/auth/AuthProvider'
import { StyledContainerProps } from '@/components/shared/types'

interface Metric {
  value: number
  label: string
}

interface FieldProps extends StyledContainerProps {
  metrics?: Metric[]
}

const FieldContainer = styled.div<StyledContainerProps>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: all ${({ theme }) => theme.transitions.normal};
  transform: scale(${({ isActive }) => (isActive ? 1.05 : 1)});
`

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.backgroundAlt};
`

const Message = styled.div<{ isOwn: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: ${({ theme, isOwn }) => isOwn ? theme.colors.primary : theme.colors.secondary};
  align-self: ${({ isOwn }) => isOwn ? 'flex-end' : 'flex-start'};
  max-width: 80%;
`

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textAlt};
`

const MessageText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`

const MessageInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  color: ${({ theme }) => theme.colors.text};
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary};
  }
`

const MetricsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: space-around;
  margin-bottom: 1rem;
`

const MetricBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`

const MetricValue = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
`

const MetricLabel = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textAlt};
`

export const FieldComponent: React.FC<FieldProps> = ({
  isActive = false,
  metrics = []
}) => {
  const [messageText, setMessageText] = useState('')
  const { messages, sendMessage } = useMessages()
  const { user } = useAuth()

  const handleSendMessage = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && messageText.trim()) {
      await sendMessage(messageText.trim())
      setMessageText('')
    }
  }

  return (
    <FieldContainer isActive={isActive}>
      <MetricsContainer>
        {metrics.map((metric, index) => (
          <MetricBox key={index}>
            <MetricValue>{metric.value}</MetricValue>
            <MetricLabel>{metric.label}</MetricLabel>
          </MetricBox>
        ))}
      </MetricsContainer>

      <MessageList>
        {messages.map((message) => (
          <Message key={message.id} isOwn={message.userId === user?.uid}>
            <MessageHeader>
              <span>{message.userName}</span>
              <span>E:{message.energyLevel} C:{message.coherenceLevel}</span>
            </MessageHeader>
            <MessageText>{message.text}</MessageText>
          </Message>
        ))}
      </MessageList>

      <MessageInput
        type="text"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        onKeyPress={handleSendMessage}
        placeholder="Type a message..."
      />
    </FieldContainer>
  )
} 