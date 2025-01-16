import React from 'react';

export function Input({ 
  value,
  onChange,
  disabled,
  placeholder,
  type = 'text',
  ...props
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={`
        flex-1 p-2 border rounded-lg
        focus:ring-2 focus:ring-blue-500
        disabled:bg-gray-100
        transition-colors
      `}
      {...props}
    />
  );
}

Input.displayName = 'Input'; 