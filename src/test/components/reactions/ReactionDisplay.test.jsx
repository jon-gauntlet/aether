import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ReactionDisplay from '../../../components/reactions/ReactionDisplay';
import { ReactionProvider } from '../../../core/reactions/ReactionProvider';
import { AuthProvider } from '../../../core/auth/AuthProvider';
import { SpaceProvider } from '../../../core/spaces/SpaceProvider';

// Mock handlers
const mockAddReaction = vi.fn();
const mockRemoveReaction = vi.fn();

// Mock the providers with natural state alignment
vi.mock('../../../core/reactions/ReactionProvider', () => ({
  ReactionProvider: ({ children }) => <div data-testid="reaction-provider">{children}</div>,
  useReactions: () => ({
    messageReactions: {
      msg1: [
        {
          type: '❤️',
          userId: 'user1',
          timestamp: { toMillis: () => Date.now() - 1000 * 60 * 5 }
        },
        {
          type: '❤️',
          userId: 'user2',
          timestamp: { toMillis: () => Date.now() - 1000 * 60 * 4 }
        },
        {
          type: '👍',
          userId: 'user3',
          timestamp: { toMillis: () => Date.now() - 1000 * 60 * 3 }
        }
      ]
    },
    emotionalPatterns: {
      msg1: [
        { type: '❤️', strength: 0.67, sustained: true },
        { type: '👍', strength: 0.33, sustained: false }
      ]
    },
    EMOTION_PATTERNS: {
      '❤️': { energy: 0.8, resonance: 0.9 },
      '👍': { energy: 0.6, resonance: 0.7 },
      '🎉': { energy: 0.9, resonance: 0.8 },
      '🤔': { energy: 0.4, resonance: 0.5 },
      '👏': { energy: 0.7, resonance: 0.6 }
    },
    addReaction: mockAddReaction,
    removeReaction: mockRemoveReaction
  })
}));

vi.mock('../../../core/auth/AuthProvider', () => ({
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    user: { uid: 'test-user' }
  })
}));

vi.mock('../../../core/spaces/SpaceProvider', () => ({
  SpaceProvider: ({ children }) => <div data-testid="space-provider">{children}</div>,
  useSpaces: () => ({
    currentSpace: { energy: { intensity: 0.5 } }
  })
}));

describe('ReactionDisplay', () => {
  const mockMessageId = 'msg1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <AuthProvider>
      <SpaceProvider>
        <ReactionProvider>
          <ReactionDisplay messageId={mockMessageId} />
        </ReactionProvider>
      </SpaceProvider>
    </AuthProvider>
  );

  it('displays reaction patterns with correct strengths', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const patterns = container.querySelectorAll('.pattern-indicator');
      expect(patterns).toHaveLength(2); // Love and approval patterns
      
      const lovePattern = patterns[0];
      expect(lovePattern).toHaveStyle({
        '--pattern-strength': '0.67'
      });
    });
  });

  it('shows reaction buttons with correct counts', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const buttons = container.querySelectorAll('.reaction-button');
      expect(buttons).toHaveLength(5); // All emotion types
      
      const loveButton = Array.from(buttons)
        .find(button => button.textContent.includes('❤️'));
      expect(loveButton).toHaveTextContent('❤️2');
    });
  });

  it('applies energy-based styling to active reactions', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const activeButtons = container.querySelectorAll('.reaction-button.active');
      expect(activeButtons).toHaveLength(2); // Love and thumbs up
      
      const loveButton = Array.from(activeButtons)
        .find(button => button.textContent.includes('❤️'));
      expect(loveButton).toHaveStyle({
        '--energy-level': '0.4'
      });
    });
  });

  it('handles adding new reactions', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const buttons = container.querySelectorAll('.reaction-button');
      const sparkleButton = Array.from(buttons)
        .find(button => button.textContent.includes('🎉'));
      fireEvent.click(sparkleButton);
      
      expect(mockAddReaction).toHaveBeenCalledWith(mockMessageId, '🎉');
    });
  });

  it('handles removing reactions', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const buttons = container.querySelectorAll('.reaction-button');
      const loveButton = Array.from(buttons)
        .find(button => button.textContent.includes('❤️'));
      fireEvent.click(loveButton);
      
      expect(mockRemoveReaction).toHaveBeenCalledWith(
        mockMessageId,
        expect.any(Number)
      );
    });
  });

  it('shows sustained patterns with special styling', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const sustainedPattern = container.querySelector('.pattern-indicator.sustained');
      expect(sustainedPattern).toBeInTheDocument();
      expect(sustainedPattern).toHaveStyle({
        '--pattern-strength': '0.67'
      });
    });
  });
}); 