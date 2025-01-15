import { renderHook, act } from '@testing-library/react-hooks';
import { useRAG } from '../useRAG';
import { RAGService } from '../../services/ragService';
import '@testing-library/jest-dom';

// Mock the RAGService
jest.mock('../../services/ragService', () => ({
  RAGService: {
    getInstance: jest.fn(),
  },
}));

describe('useRAG', () => {
  const mockQuery = jest.fn();
  const mockIngestText = jest.fn();
  const mockGetInstance = RAGService.getInstance as jest.Mock;

  beforeEach(() => {
    mockGetInstance.mockReturnValue({
      query: mockQuery,
      ingestText: mockIngestText,
    });
    mockQuery.mockReset();
    mockIngestText.mockReset();
  });

  it('should handle successful query', async () => {
    const mockResponse = {
      answer: 'Test answer',
      sources: [{ content: 'source content', metadata: {} }],
    };
    mockQuery.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useRAG());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.answer).toBeNull();

    await act(async () => {
      await result.current.query('test question');
    });

    expect(mockQuery).toHaveBeenCalledWith({
      question: 'test question',
      context: undefined,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.answer).toEqual(mockResponse);
  });

  it('should handle query error', async () => {
    const error = new Error('Query failed');
    mockQuery.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useRAG());

    await act(async () => {
      await result.current.query('test question');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(error);
    expect(result.current.answer).toBeNull();
  });

  it('should handle successful text ingestion', async () => {
    const { result } = renderHook(() => useRAG());

    await act(async () => {
      await result.current.ingestText('test text', { source: 'test' });
    });

    expect(mockIngestText).toHaveBeenCalledWith('test text', { source: 'test' });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle ingestion error', async () => {
    const error = new Error('Ingestion failed');
    mockIngestText.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useRAG());

    await act(async () => {
      await result.current.ingestText('test text');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(error);
  });
}); 