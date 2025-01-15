import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RAGDemo from '../RAGDemo';
import { useRAG } from '../../../hooks/useRAG';

// Mock the useRAG hook
jest.mock('../../../hooks/useRAG');

describe('RAGDemo', () => {
  const mockQuery = jest.fn();
  const mockIngestText = jest.fn();
  
  beforeEach(() => {
    (useRAG as jest.Mock).mockReturnValue({
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
    const submitButton = screen.getByText('Ask Question');

    await userEvent.type(textarea, question);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith(question);
    });
  });

  it('handles text ingestion', async () => {
    render(<RAGDemo />);
    
    const text = 'New knowledge to add';
    const textarea = screen.getByPlaceholderText('Enter text to add to the knowledge base...');
    const submitButton = screen.getByText('Add to Knowledge Base');

    await userEvent.type(textarea, text);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockIngestText).toHaveBeenCalledWith(text);
    });
  });

  it('displays loading state', () => {
    (useRAG as jest.Mock).mockReturnValue({
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
    const mockAnswer = {
      answer: 'This is the answer',
      sources: [
        {
          content: 'Source content',
          metadata: { type: 'document' },
        },
      ],
    };

    (useRAG as jest.Mock).mockReturnValue({
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
    const error = new Error('Test error message');
    
    (useRAG as jest.Mock).mockReturnValue({
      query: mockQuery,
      ingestText: mockIngestText,
      answer: null,
      loading: false,
      error,
    });

    render(<RAGDemo />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });
}); 