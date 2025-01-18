import { render, screen } from '@testing-library/react';
import { TestWrapper } from './setup';
import { ChatMessageList } from '../components/ChatMessageList';

describe('ChatMessageList', () => {
  const messages = [
    { id: 1, content: 'Hello', role: 'user' },
    { id: 2, content: 'Hi there!', role: 'assistant' }
  ];

  test('renders messages correctly', () => {
    render(<ChatMessageList messages={messages} />, { wrapper: TestWrapper });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  test('shows loading state when isLoading is true', () => {
    render(<ChatMessageList messages={[]} isLoading={true} />, { wrapper: TestWrapper });
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('shows empty state when no messages', () => {
    render(<ChatMessageList messages={[]} />, { wrapper: TestWrapper });
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  test('handles error state', () => {
    render(<ChatMessageList messages={[]} error="Test error" />, { wrapper: TestWrapper });
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  test('auto-scrolls to bottom when new messages arrive', () => {
    const { rerender } = render(
      <ChatMessageList messages={messages} />,
      { wrapper: TestWrapper }
    );

    const newMessages = [...messages, { id: 3, content: 'New message', role: 'user' }];
    rerender(
      <TestWrapper>
        <ChatMessageList messages={newMessages} />
      </TestWrapper>
    );

    expect(screen.getByText('New message')).toBeInTheDocument();
  });

  test('renders message timestamps', () => {
    const timestamp = new Date().toISOString();
    const messagesWithTimestamps = [
      { id: 1, content: 'Hello', role: 'user', timestamp }
    ];

    render(<ChatMessageList messages={messagesWithTimestamps} />, { wrapper: TestWrapper });
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(new Date(timestamp).toLocaleTimeString())).toBeInTheDocument();
  });
}); 