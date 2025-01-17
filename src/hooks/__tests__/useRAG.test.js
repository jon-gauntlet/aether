import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useRAG } from '../useRAG';

// Mock RAG service
const mockRAGService = {
  search: vi.fn(),
  initialize: vi.fn(),
  cleanup: vi.fn(),
};

vi.mock('../../services/rag', () => ({
  RAGService: {
    getInstance: vi.fn(() => mockRAGService),
  },
}));

describe('useRAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRAGService.search.mockResolvedValue([]);
    mockRAGService.initialize.mockResolvedValue(undefined);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useRAG());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.results).toEqual([]);
  });

  it('handles search operations', async () => {
    const mockResults = [{ id: 1, text: 'Test result' }];
    mockRAGService.search.mockResolvedValueOnce(mockResults);

    const { result } = renderHook(() => useRAG());

    await act(async () => {
      await result.current.search('test query');
    });

    expect(mockRAGService.search).toHaveBeenCalledWith('test query');
    expect(result.current.results).toEqual(mockResults);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles search errors', async () => {
    const error = new Error('Search failed');
    mockRAGService.search.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useRAG());

    await act(async () => {
      await result.current.search('test query');
    });

    expect(result.current.error).toBe(error);
    expect(result.current.isLoading).toBe(false);
  });

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useRAG());
    unmount();
    expect(mockRAGService.cleanup).toHaveBeenCalled();
  });
}); 