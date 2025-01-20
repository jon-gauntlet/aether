import React from 'react';

export const withValidation = (Component, validationRules) => {
  return (props) => {
    const validate = () => {
      if (!validationRules) return true;
      
      for (const [key, rule] of Object.entries(validationRules)) {
        const value = props[key];
        
        // Check required fields
        if (rule.required && value === undefined) {
          console.error(`${key} is required`);
          return false;
        }
        
        // Check type
        if (rule.type && value !== undefined) {
          const type = rule.type.toLowerCase();
          const actualType = typeof value;
          
          if (type === 'function' && actualType !== 'function') {
            console.error(`${key} must be a function`);
            return false;
          }
          
          if (type === 'boolean' && actualType !== 'boolean') {
            console.error(`${key} must be a boolean`);
            return false;
          }
        }
      }
      
      return true;
    };

    if (!validate()) {
      return null;
    }

    return <Component {...props} />;
  };
}; 