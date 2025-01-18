import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  createMockRAGResponse,
  createMockError,
  typeIntoField,
  waitForLoadingToComplete,
} from '../../../test/utils/test-utils';
import { RAGDemo } from '../../chat';
import { useRAG } from '../../../hooks';

// Mock the useRAG hook
jest.mock('../../../hooks', () => ({
  useRAG: jest.fn(),
}));

describe('RAGDemo', () => {
  const mockQuery = jest.fn();
  const mockIngestText = jest.fn();
  
  beforeEach(() => {
    useRAG.mockReturnValue({
      query: mockQuery,
      ingestText: mockIngestText,
      answer: null,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the demo interface', () => {
    render(<RAGDemo />);
    
    expect(screen.getByText('Aether RAG Demo')).toBeInTheDocument();
    expect(screen.getByText('Ask a Question')).toBeInTheDocument();
    expect(screen.getByText('Add Knowledge')).toBeInTheDocument();
  });

  it('handles question submission', async () => {
    render(<RAGDemo />);
    
    const question = 'What is RAG?';
    const textarea = screen.getByPlaceholderText('Enter your question here...');
    
    await typeIntoField(textarea, question);
    fireEvent.click(screen.getByText('Ask Question'));

    await waitForLoadingToComplete(() => {
      expect(mockQuery).toHaveBeenCalledWith(question);
    });
  });

  it('handles text ingestion', async () => {
    render(<RAGDemo />);
    
    const text = 'New knowledge to add';
    const textarea = screen.getByPlaceholderText('Enter text to add to the knowledge base...');
    
    await typeIntoField(textarea, text);
    fireEvent.click(screen.getByText('Add to Knowledge Base'));

    await waitForLoadingToComplete(() => {
      expect(mockIngestText).toHaveBeenCalledWith(text);
    });
  });

  it('displays loading state', () => {
    useRAG.mockReturnValue({
      query: mockQuery,
      ingestText: mockIngestText,
      answer: null,
      loading: true,
      error: null,
    });

    render(<RAGDemo />);
    
    expect(screen.getAllByText('Processing...')[0]).toBeInTheDocument();
  });

  it('displays answer when available', () => {
    const mockAnswer = createMockRAGResponse({
      answer: 'This is the answer',
      sources: [
        {
          content: 'Source content',
          metadata: { type: 'document' },
        },
      ],
    });

    useRAG.mockReturnValue({
      query: mockQuery,
      ingestText: mockIngestText,
      answer: mockAnswer,
      loading: false,
      error: null,
    });

    render(<RAGDemo />);
    
    expect(screen.getByText('This is the answer')).toBeInTheDocument();
    expect(screen.getByText('Source content')).toBeInTheDocument();
    expect(screen.getByText('type: document')).toBeInTheDocument();
  });

  it('displays error message when error occurs', () => {
    const error = createMockError('QUERY_ERROR', 'Test error message');
    
    useRAG.mockReturnValue({
      query: mockQuery,
      ingestText: mockIngestText,
      answer: null,
      loading: false,
      error,
    });

    render(<RAGDemo />);
    
    expect(screen.getByText('QUERY_ERROR: Test error message')).toBeInTheDocument();
  });
}); 