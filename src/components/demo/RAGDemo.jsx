import React, { useState } from 'react';
import { useRAG } from '../../hooks/useRAG';

const RAGDemo = () => {
  const [question, setQuestion] = useState('');
  const [demoText, setDemoText] = useState('');
  const { query, ingestText, answer, loading, error } = useRAG();

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    await query(question);
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!demoText.trim()) return;
    await ingestText(demoText);
    setDemoText('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Aether RAG Demo</h1>
        
        {/* Query Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
          <form onSubmit={handleQuery} className="space-y-4">
            <div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question here..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className={`px-4 py-2 rounded-lg text-white ${
                loading || !question.trim()
                  ? 'bg-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Processing...' : 'Ask Question'}
            </button>
          </form>
        </div>

        {/* Answer Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
            {error.message}
          </div>
        )}
        
        {answer && (
          <div className="mb-8 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Answer:</h3>
              <p className="text-gray-800">{answer.answer}</p>
            </div>
            
            {answer.sources.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Sources:</h3>
                <div className="space-y-2">
                  {answer.sources.map((source, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{source.content}</p>
                      {source.metadata && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(source.metadata).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ingestion Section */}
        <div className="pt-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Add Knowledge</h2>
          <form onSubmit={handleIngest} className="space-y-4">
            <div>
              <textarea
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                placeholder="Enter text to add to the knowledge base..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !demoText.trim()}
              className={`px-4 py-2 rounded-lg text-white ${
                loading || !demoText.trim()
                  ? 'bg-gray-400'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Processing...' : 'Add to Knowledge Base'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RAGDemo; 