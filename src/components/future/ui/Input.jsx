import React from 'react';
import PropTypes from 'prop-types';
import { createDebugger } from '../../utils/debug';
import { withValidation } from '../../utils/validation';

const debug = createDebugger('Input');

const SubmitButton = React.memo(({ isLoading, disabled }) => (
  <button
    type="submit"
    disabled={isLoading || disabled}
    className={`px-4 py-2 rounded-lg text-white ${
      isLoading || disabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
    }`}
  >
    {isLoading ? 'Sending...' : 'Send'}
  </button>
));

const InputComponent = ({ onSubmit, isLoading }) => {
  const [text, setText] = React.useState('');
  const inputRef = React.useRef(null);

  const handleSubmit = React.useCallback((e) => {
    e.preventDefault();
    const trimmedText = text.trim();
    if (!trimmedText) return;

    debug.log('Submitting text:', trimmedText);
    try {
      onSubmit(trimmedText);
      setText('');
      inputRef.current?.focus();
    } catch (error) {
      debug.error(error);
    }
  }, [text, onSubmit]);

  const handleKeyPress = React.useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleChange = React.useCallback((e) => {
    setText(e.target.value);
  }, []);

  const isDisabled = React.useMemo(() => {
    return !text.trim();
  }, [text]);

  // Log render with props in development
  debug.log('Rendering with:', { text, isLoading, isDisabled });

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        disabled={isLoading}
        className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <SubmitButton isLoading={isLoading} disabled={isDisabled} />
    </form>
  );
};

// Validation rules for props
const validationRules = {
  onSubmit: {
    type: 'Function',
    required: true,
    message: 'onSubmit must be a function'
  },
  isLoading: {
    type: 'Boolean',
    message: 'isLoading must be a boolean'
  }
};

// Apply validation
const Input = withValidation(InputComponent, validationRules);

// PropTypes for development checks
Input.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

// Display names for debugging
Input.displayName = 'Input';
SubmitButton.displayName = 'SubmitButton';

export default Input; 