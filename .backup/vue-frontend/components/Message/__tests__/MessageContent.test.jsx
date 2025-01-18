import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '../../../test/utils';
import { useToast } from '@chakra-ui/react';
import MessageContent from '../MessageContent';

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: vi.fn(),
  };
});

describe('MessageContent', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.mocked(useToast).mockReturnValue(mockToast);
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders code blocks correctly', () => {
    const content = '```javascript\nconst test = "code";\n```';
    renderWithProviders(<MessageContent content={content} timestamp={new Date().toISOString()} />);
    
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText(/const/)).toBeInTheDocument();
    expect(screen.getByText(/test/)).toBeInTheDocument();
    expect(screen.getByText(/"code"/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
  });

  it('handles copy functionality', async () => {
    const content = '```javascript\nconst test = "code";\n```';
    renderWithProviders(<MessageContent content={content} timestamp={new Date().toISOString()} />);
    
    fireEvent.click(screen.getByRole('button', { name: /copy code/i }));
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const test = "code";');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Copied!',
      status: 'success',
    }));
  });

  it('displays attachments when provided', () => {
    const attachments = [{ name: 'test.txt', url: 'http://test.com/test.txt' }];
    renderWithProviders(
      <MessageContent 
        content="Test message" 
        timestamp={new Date().toISOString()}
        attachments={attachments}
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('test.txt')).toBeInTheDocument();
  });
}); 