import { renderHook, act } from '@testing-library/react-hooks';
import { useRAG } from '../useRAG';
import { RAGService } from '../../services/rag';
import { RAGError } from '../../utils/errors';
import { createMockRAGResponse, createMockError } from '../../test/utils/test-utils';

// Mock the RAGService
jest.mock('../../services/rag', () => ({
  RAGService: {
    getInstance: jest.fn(),
  },
}));

describe('useRAG', () => {
  const mockQuery = jest.fn();
  const mockIngestText = jest.fn();
  const mockGetInstance = RAGService.getInstance;

  beforeEach(() => {
    mockGetInstance.mockReturnValue({
      query: mockQuery,
      ingestText: mockIngestText,
    });
    mockQuery.mockReset();
    mockIngestText.mockReset();
  });

  it('should handle successful query', async () => {
    const mockResponse = createMockRAGResponse({
      answer: 'Test answer',
      sources: [{ content: 'source content', metadata: {} }],
    });
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
    const error = createMockError('QUERY_ERROR', 'Query failed');
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
    const error = createMockError('INGEST_ERROR', 'Ingestion failed');
    mockIngestText.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useRAG());

    await act(async () => {
      await result.current.ingestText('test text');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(error);
  });
}); 