import React from 'react';

export function Input({ onSubmit, isLoading, disabled, placeholder }) {
  const [text, setText] = React.useState('');

  const handleSubmit = React.useCallback((e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSubmit(text);
    setText('');
  }, [text, onSubmit, disabled]);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || 'Type a message...'}
        disabled={disabled}
        className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className={`
          px-4 py-2 rounded-lg text-white
          ${(!text.trim() || disabled) 
            ? 'bg-gray-400' 
            : 'bg-blue-500 hover:bg-blue-600'}
        `}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}

Input.displayName = 'Input'; 