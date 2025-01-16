const QuerySection = React.memo(({ question, setQuestion, handleQuery, loading }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
    <form onSubmit={handleQuery} className="space-y-4">
      <div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question here"
          disabled={loading}
          className="w-full p-2 border rounded-lg resize-none"
          rows={4}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !question.trim()}
        className={`px-4 py-2 rounded-lg text-white ${
          loading || !question.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : 'Ask'}
      </button>
    </form>
  </div>
));

const IngestSection = React.memo(({ demoText, setDemoText, handleIngest, loading }) => (
  <div className="pt-6 border-t">
    <h2 className="text-xl font-semibold mb-4">Add Knowledge</h2>
    <form onSubmit={handleIngest} className="space-y-4">
      <div>
        <textarea
          value={demoText}
          onChange={(e) => setDemoText(e.target.value)}
          placeholder="Enter text to add to the knowledge base"
          disabled={loading}
          className="w-full p-2 border rounded-lg resize-none"
          rows={4}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !demoText.trim()}
        className={`px-4 py-2 rounded-lg text-white ${
          loading || !demoText.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : 'Add'}
      </button>
    </form>
  </div>
));

export const RAGDemo = () => {
  const [question, setQuestion] = React.useState('');
  const [demoText, setDemoText] = React.useState('');
  const { query, ingestText, answer, loading, error } = useRAG();

  const handleQuery = React.useCallback((e) => {
    e.preventDefault();
    if (!question.trim()) return;
    query(question);
  }, [question, query]);

  const handleIngest = React.useCallback((e) => {
    e.preventDefault();
    if (!demoText.trim()) return;
    ingestText(demoText);
  }, [demoText, ingestText]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <QuerySection
        question={question}
        setQuestion={setQuestion}
        handleQuery={handleQuery}
        loading={loading}
      />
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
          {error.message}
        </div>
      )}
      {answer && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Answer:</h3>
          <p className="text-gray-800">{answer.answer}</p>
          {answer.sources?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Sources:</h4>
              <ul className="space-y-2">
                {answer.sources.map((source, index) => (
                  <li key={index} className="bg-white p-3 rounded shadow-sm">
                    <p className="text-sm">{source.content}</p>
                    {source.metadata && (
                      <div className="mt-1 text-xs text-gray-500">
                        {Object.entries(source.metadata).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <IngestSection
        demoText={demoText}
        setDemoText={setDemoText}
        handleIngest={handleIngest}
        loading={loading}
      />
    </div>
  );
}; 