import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import ReactionDisplay from '../../../components/reactions/ReactionDisplay';
import { ReactionProvider } from '../../../core/reactions/ReactionProvider';
import { AuthProvider } from '../../../core/auth/AuthProvider';
import { SpaceProvider } from '../../../core/spaces/SpaceProvider';
import { mockFirebase } from '../../mocks/firebase';

describe('ReactionDisplay', () => {
  const mockMessageId = 'msg1';
  const mockReactions = [
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
  ];

  beforeEach(() => {
    mockFirebase.mockCollection('messages').mockQuery({
      where: ['reactions', '!=', null],
      orderBy: ['timestamp', 'desc']
    }, [{
      id: mockMessageId,
      reactions: mockReactions
    }]);
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
        '--pattern-strength': '0.6666666666666666' // 2/3 reactions are love
      });
    });
  });

  it('shows reaction buttons with correct counts', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const buttons = container.querySelectorAll('.reaction-button');
      expect(buttons).toHaveLength(8); // All emotion types
      
      const loveButton = Array.from(buttons)
        .find(button => button.textContent.includes('❤️'));
      const count = loveButton.querySelector('.count');
      expect(count).toHaveTextContent('2');
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
        '--energy-level': expect.any(String)
      });
    });
  });

  it('handles adding new reactions', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const buttons = container.querySelectorAll('.reaction-button');
      const sparkleButton = Array.from(buttons)
        .find(button => button.textContent.includes('✨'));
      fireEvent.click(sparkleButton);
      
      expect(mockFirebase.mockCollection('messages').mockDoc(mockMessageId).mockUpdate)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            reactions: expect.arrayContaining([
              expect.objectContaining({
                type: '✨',
                energy: 0.9 // Inspiration energy
              })
            ])
          })
        );
    });
  });

  it('handles removing reactions', async () => {
    const { container } = renderComponent();
    
    await waitFor(() => {
      const buttons = container.querySelectorAll('.reaction-button.active');
      const loveButton = Array.from(buttons)
        .find(button => button.textContent.includes('❤️'));
      fireEvent.click(loveButton);
      
      expect(mockFirebase.mockCollection('messages').mockDoc(mockMessageId).mockUpdate)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            reactions: expect.not.arrayContaining([
              expect.objectContaining({
                type: '❤️',
                userId: 'user1'
              })
            ])
          })
        );
    });
  });

  it('shows sustained patterns with special styling', async () => {
    const sustainedMock = {
      id: 'msg2',
      reactions: [
        {
          type: '❤️',
          userId: 'user1',
          timestamp: { toMillis: () => Date.now() - 1000 * 60 * 40 }
        },
        {
          type: '❤️',
          userId: 'user2',
          timestamp: { toMillis: () => Date.now() - 1000 * 60 * 35 }
        },
        {
          type: '❤️',
          userId: 'user3',
          timestamp: { toMillis: () => Date.now() - 1000 * 60 * 5 }
        }
      ]
    };

    mockFirebase.mockCollection('messages').mockQuery({
      where: ['reactions', '!=', null],
      orderBy: ['timestamp', 'desc']
    }, [sustainedMock]);

    const { container } = render(
      <AuthProvider>
        <SpaceProvider>
          <ReactionProvider>
            <ReactionDisplay messageId="msg2" />
          </ReactionProvider>
        </SpaceProvider>
      </AuthProvider>
    );
    
    await waitFor(() => {
      const sustainedPattern = container.querySelector('.pattern-indicator.sustained');
      expect(sustainedPattern).toBeInTheDocument();
    });
  });
}); 