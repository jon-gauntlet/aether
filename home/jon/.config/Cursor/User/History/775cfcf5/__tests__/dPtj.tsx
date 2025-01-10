import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PersistentPatternGuided } from '../PersistentPatternGuided';

jest.mock('../../core/autonomic/usePersistentPattern', () => ({
  usePersistentPattern: () => ({
    pattern: {
      id: 'test-pattern',
      name: 'Test Pattern',
      description: 'A test pattern',
      meta: {
        successRate: 0.75,
        useCount: 10,
        learnings: []
      }
    },
    isLoading: false,
    error: null,
    stats: {
      totalPatterns: 5,
      totalLearnings: 20,
      averageSuccessRate: 0.8,
      recentLearnings: [
        {
          timestamp: new Date(),
          insight: 'Recent test learning'
        }
      ]
    },
    actions: {
      recordLearning: jest.fn(),
      exportPatterns: jest.fn(() => '{}'),
      importPatterns: jest.fn(),
      clearPatterns: jest.fn()
    },
    getters: {
      getActivePattern: jest.fn(),
      getContextHistory: jest.fn(),
      getStats: jest.fn()
    }
  })
}));

describe('PersistentPatternGuided', () => {
  let mockStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockStorage = {};
    global.localStorage = {
      getItem: jest.fn(key => mockStorage[key] || null),
      setItem: jest.fn((key, value) => {
        mockStorage[key] = value.toString();
      }),
      removeItem: jest.fn(key => {
        delete mockStorage[key];
      }),
      clear: jest.fn(() => {
        mockStorage = {};
      }),
      length: 0,
      key: jest.fn((index: number) => null)
    };

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
  });

  it('renders with pattern information', () => {
    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('Test Pattern')).toBeInTheDocument();
    expect(screen.getByText('A test pattern')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('displays system stats', () => {
    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('System Stats')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('80.0%')).toBeInTheDocument();
  });

  it('shows recent learnings', () => {
    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('Recent Learnings')).toBeInTheDocument();
    expect(screen.getByText('Recent test learning')).toBeInTheDocument();
  });

  it('handles pattern feedback', async () => {
    const onStateChange = jest.fn();
    render(
      <PersistentPatternGuided
        task="test-task"
        onStateChange={onStateChange}
      >
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    const successButton = screen.getByText('Record Success');
    const improveButton = screen.getByText('Suggest Improvement');

    await act(async () => {
      fireEvent.click(successButton);
    });

    await act(async () => {
      fireEvent.click(improveButton);
    });

    expect(onStateChange).toHaveBeenCalled();
  });

  it('handles pattern export', () => {
    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    const exportButton = screen.getByText('Export Patterns');
    fireEvent.click(exportButton);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles pattern import', async () => {
    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    const file = new File(['{}'], 'patterns.json', { type: 'application/json' });
    const input = screen.getByLabelText('Import Patterns');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // FileReader mock would be needed for full testing
  });

  it('renders children content', () => {
    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    jest.spyOn(require('../../core/autonomic/usePersistentPattern'), 'usePersistentPattern')
      .mockImplementation(() => ({
        isLoading: true,
        error: null,
        pattern: null,
        stats: null,
        actions: {},
        getters: {}
      }));

    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('Loading pattern...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    jest.spyOn(require('../../core/autonomic/usePersistentPattern'), 'usePersistentPattern')
      .mockImplementation(() => ({
        isLoading: false,
        error: new Error('Test error'),
        pattern: null,
        stats: null,
        actions: {},
        getters: {}
      }));

    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });

  it('handles empty stats gracefully', () => {
    jest.spyOn(require('../../core/autonomic/usePersistentPattern'), 'usePersistentPattern')
      .mockImplementation(() => ({
        pattern: null,
        isLoading: false,
        error: null,
        stats: {
          totalPatterns: 0,
          totalLearnings: 0,
          averageSuccessRate: 0,
          recentLearnings: []
        },
        actions: {},
        getters: {}
      }));

    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('No active pattern')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles failed pattern import', async () => {
    const mockImport = jest.fn().mockRejectedValue(new Error('Import failed'));
    jest.spyOn(require('../../core/autonomic/usePersistentPattern'), 'usePersistentPattern')
      .mockImplementation(() => ({
        pattern: null,
        isLoading: false,
        error: null,
        stats: null,
        actions: {
          importPatterns: mockImport
        },
        getters: {}
      }));

    render(
      <PersistentPatternGuided task="test-task">
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    const file = new File(['invalid json'], 'patterns.json', { type: 'application/json' });
    const input = screen.getByLabelText('Import Patterns');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(mockImport).toHaveBeenCalled();
  });

  it('handles state changes during pattern evolution', async () => {
    const onStateChange = jest.fn();
    const mockRecordLearning = jest.fn().mockResolvedValue({
      id: 'evolved-pattern',
      name: 'Evolved Pattern',
      description: 'An evolved pattern',
      meta: {
        successRate: 0.8,
        useCount: 11,
        learnings: []
      }
    });

    jest.spyOn(require('../../core/autonomic/usePersistentPattern'), 'usePersistentPattern')
      .mockImplementation(() => ({
        pattern: {
          id: 'test-pattern',
          name: 'Test Pattern',
          description: 'A test pattern',
          meta: {
            successRate: 0.75,
            useCount: 10,
            learnings: []
          }
        },
        isLoading: false,
        error: null,
        stats: {
          totalPatterns: 1,
          totalLearnings: 10,
          averageSuccessRate: 0.75,
          recentLearnings: []
        },
        actions: {
          recordLearning: mockRecordLearning
        },
        getters: {}
      }));

    render(
      <PersistentPatternGuided
        task="test-task"
        onStateChange={onStateChange}
      >
        <div>Test Content</div>
      </PersistentPatternGuided>
    );

    const successButton = screen.getByText('Record Success');

    await act(async () => {
      fireEvent.click(successButton);
    });

    expect(mockRecordLearning).toHaveBeenCalled();
    expect(onStateChange).toHaveBeenCalled();
  });

  it('preserves children rendering during state transitions', async () => {
    const { rerender } = render(
      <PersistentPatternGuided task="test-task">
        <div data-testid="test-content">Test Content</div>
      </PersistentPatternGuided>
    );

    // Initial render
    expect(screen.getByTestId('test-content')).toBeInTheDocument();

    // Simulate loading state
    jest.spyOn(require('../../core/autonomic/usePersistentPattern'), 'usePersistentPattern')
      .mockImplementation(() => ({
        pattern: null,
        isLoading: true,
        error: null,
        stats: null,
        actions: {},
        getters: {}
      }));

    rerender(
      <PersistentPatternGuided task="test-task">
        <div data-testid="test-content">Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('Loading pattern...')).toBeInTheDocument();

    // Simulate error state
    jest.spyOn(require('../../core/autonomic/usePersistentPattern'), 'usePersistentPattern')
      .mockImplementation(() => ({
        pattern: null,
        isLoading: false,
        error: new Error('Test error'),
        stats: null,
        actions: {},
        getters: {}
      }));

    rerender(
      <PersistentPatternGuided task="test-task">
        <div data-testid="test-content">Test Content</div>
      </PersistentPatternGuided>
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
  });
}); 