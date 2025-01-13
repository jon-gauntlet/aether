


import { Message, isUserMessage } from '../../core/types/chat';
import { Theme } from '../../styles/theme';

interface Props {
  theme: Theme;
  threadId: string;
  userId: string;
}

const ;


  padding: {props => props.theme.spacing.sm};

`;


  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.sm};
`;


  display: flex;
flex-direction: {props => props.isUser ? 'row-reverse' : 'row'};
  margin: {props => props.theme.spacing.sm} 0;
`;


  background: ${props => props.isUser ? props.theme.colors.primary : props.theme.colors.messageBackground};
  color: ${props => props.isUser ? props.theme.colors.onPrimary : props.theme.colors.messageText};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  max-width: 70%;
`;


  width: 100%;
  padding: {props => props.theme.spacing.sm};

border-radius: {props => props.theme.borderRadius.md};
margin-top: {props => props.theme.spacing.sm};
  
  &: any {
    outline: none;
border-color: {props => props.theme.colors.primary};
  }
`;


  const [input, setInput] = useState('');


  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input, userId);
      setInput('');
    }
  };


    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>Natural Chat</ChatHeader>
      <ChatMessages>
        {messages.map((message: Message) => (
          <MessageContainer key={message.id} isUser={isUserMessage(message)}>
            <MessageContent isUser={isUserMessage(message)}>
              {message.content}
            </MessageContent>
          </MessageContainer>
        ))}
      </ChatMessages>
      <ChatInput
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        
      />
    </ChatContainer>
  );
};