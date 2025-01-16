import React, { useState } from 'react';

interface InputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export const Input: React.FC<InputProps> = ({ onSubmit, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask a question..."
        disabled={isLoading}
        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className={`px-4 py-2 rounded-lg bg-blue-500 text-white font-medium
          ${(!text.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
      >
        {isLoading ? 'Searching...' : 'Send'}
      </button>
    </form>
  );
}; 