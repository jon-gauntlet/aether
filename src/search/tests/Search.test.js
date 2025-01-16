import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Search } from '../components/Search';
import * as searchApi from '../api/search';

// Mock API
jest.mock('../api/search', () => ({
  search: jest.fn()
}));

describe('Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Natural flow: setup → action → verify
  describe('Search Flow', () => {
    it('performs search and displays results', async () => {
      // Setup
      searchApi.search.mockResolvedValueOnce({
        results: [{
          id: '1',
          text: 'Test result',
          score: 0.95
        }],
        metrics: { latency: 50 }
      });

      render(<Search />);
      
      // Action
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('Search...'), {
          target: { value: 'test query' }
        });
        fireEvent.click(screen.getByRole('button'));
      });

      // Verify
      expect(screen.getByText('Test result')).toBeInTheDocument();
      expect(screen.getByText('Score: 0.95')).toBeInTheDocument();
      expect(screen.getByText('Search completed in 50ms')).toBeInTheDocument();
    });

    it('shows loading state', async () => {
      // Setup
      let resolveApi;
      searchApi.search.mockImplementationOnce(
        () => new Promise(resolve => { resolveApi = resolve; })
      );

      render(<Search />);
      
      // Action
      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: 'test query' }
      });
      fireEvent.click(screen.getByRole('button'));

      // Verify loading
      expect(screen.getByText('Searching...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByPlaceholderText('Search...')).toBeDisabled();
      
      // Complete loading
      await act(async () => {
        resolveApi({ 
          results: [], 
          metrics: { latency: 50 } 
        });
      });
    });

    it('handles errors', async () => {
      // Setup
      searchApi.search.mockRejectedValueOnce(new Error('Search failed'));

      render(<Search />);
      
      // Action
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('Search...'), {
          target: { value: 'test query' }
        });
        fireEvent.click(screen.getByRole('button'));
      });

      // Verify
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });
  });

  describe('UI Flow', () => {
    it('disables search with empty query', () => {
      render(<Search />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('enables search with valid query', () => {
      render(<Search />);
      
      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: 'test' }
      });
      
      expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('displays multiple results', async () => {
      // Setup
      searchApi.search.mockResolvedValueOnce({
        results: [
          { id: '1', text: 'Result 1', score: 0.95 },
          { id: '2', text: 'Result 2', score: 0.85 }
        ],
        metrics: { latency: 50 }
      });

      render(<Search />);
      
      // Action
      await act(async () => {
        fireEvent.change(screen.getByPlaceholderText('Search...'), {
          target: { value: 'test query' }
        });
        fireEvent.click(screen.getByRole('button'));
      });

      // Verify
      expect(screen.getByText('Result 1')).toBeInTheDocument();
      expect(screen.getByText('Result 2')).toBeInTheDocument();
      expect(screen.getByText('Score: 0.95')).toBeInTheDocument();
      expect(screen.getByText('Score: 0.85')).toBeInTheDocument();
    });
  });
}); 