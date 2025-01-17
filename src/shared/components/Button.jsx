import React from 'react';

export function Button({ 
  children, 
  disabled, 
  isLoading, 
  variant = 'primary',
  ...props 
}) {
  const baseClasses = 'px-4 py-2 rounded-lg text-white transition-colors';
  
  const variantClasses = {
    primary: disabled 
      ? 'bg-gray-400' 
      : 'bg-blue-500 hover:bg-blue-600',
    secondary: disabled
      ? 'bg-gray-300'
      : 'bg-gray-500 hover:bg-gray-600'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}

Button.displayName = 'Button'; 