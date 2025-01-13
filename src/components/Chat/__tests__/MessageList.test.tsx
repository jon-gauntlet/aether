
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
iist } rom '../MessageList';
import {  } from '../../../styles/theme';

// Mock useFlowState hook
jest.mock('../../../hooks/useFlowState', () => ({
  useFlowState: () => ({
    flowState: {
      energy: 0.8,
      type: 'FLOW'
    },
    isProtected: true
  })
}));

const mockMessages = [
  {
    id: '1',
    content: 'Test message 1',
    author: 'User 1',
    timestamp: Date.now()
  },
  {
    id: '2',
    content: 'Test message 2',
    author: 'User 2',
    timestamp: Date.now()
  }
];

describe('MessageList', () => {
  const mockSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders messages correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <MessageList messages={mockMessages} onMessageSelect={mockSelect} />
      </ThemeProvider>
    );

    expect(screen.getByText('Test message 1')).toBeInTheDocument();
    expect(screen.getByText('Test message 2')).toBeInTheDocument();
  });

  it('calls onMessageSelect when message is clicked', () => {
    render(
      <ThemeProvider theme={theme}>
        <MessageList messages={mockMessages} onMessageSelect={mockSelect} />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Test message 1'));
    expect(mockSelect).toHaveBeenCalledWith('1');
  });

  it('shows protection state correctly', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <MessageList messages={mockMessages} onMessageSelect={mockSelect} />
      </ThemeProvider>
    );

    const listContainer = container.firstChild;
    expect(listContainer).toHaveStyle(`border: 1px solid ${theme.colors.primary}`);
  });
}); 