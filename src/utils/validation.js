import { ValidationError } from './errors';
import { DEBUG } from './debug';

export const validators = {
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' && !isNaN(value),
  boolean: (value) => typeof value === 'boolean',
  array: (value) => Array.isArray(value),
  object: (value) => value && typeof value === 'object' && !Array.isArray(value),
  function: (value) => typeof value === 'function',
  
  required: (value) => value !== undefined && value !== null,
  minLength: (min) => (value) => value && value.length >= min,
  maxLength: (max) => (value) => value && value.length <= max,
  min: (min) => (value) => value >= min,
  max: (max) => (value) => value <= max,
  pattern: (regex) => (value) => regex.test(value),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
};

export const validateProps = (props, validationRules) => {
  if (!DEBUG) return [];
  
  const errors = [];
  Object.entries(validationRules).forEach(([prop, rule]) => {
    const value = props[prop];
    
    // Handle required props
    if (rule.required && !validators.required(value)) {
      errors.push(`${prop} is required`);
      return;
    }
    
    // Skip validation if value is undefined/null and not required
    if (!validators.required(value) && !rule.required) {
      return;
    }
    
    // Type validation
    if (rule.type && !validators[rule.type](value)) {
      errors.push(`${prop} must be a ${rule.type}`);
    }
    
    // Custom validation
    if (rule.validate && !rule.validate(value)) {
      errors.push(rule.message || `${prop} is invalid`);
    }
  });
  
  return errors;
};

export const createRules = (rules) => {
  return Object.entries(rules).reduce((acc, [prop, rule]) => {
    acc[prop] = {
      test: (value) => {
        if (rule.required && !validators.required(value)) return false;
        if (!validators.required(value) && !rule.required) return true;
        if (rule.type && !validators[rule.type](value)) return false;
        if (rule.validate && !rule.validate(value)) return false;
        return true;
      },
      message: rule.message || `Invalid ${prop}`
    };
    return acc;
  }, {});
};

export const withValidation = (Component, validationRules) => {
  if (!DEBUG) return Component;
  
  const ValidatedComponent = (props) => {
    const errors = validateProps(props, validationRules);
    
    if (errors.length > 0) {
      console.error(
        `Validation failed for ${Component.name}:`,
        errors.join(', ')
      );
      throw new ValidationError(
        `Props validation failed for ${Component.name}: ${errors.join(', ')}`
      );
    }
    
    return <Component {...props} />;
  };
  
  ValidatedComponent.displayName = `WithValidation(${Component.displayName || Component.name})`;
  return ValidatedComponent;
}

/**
 * Validates an API request payload
 * 
 * @param {Object} payload - Request payload to validate
 * @param {Object} schema - Validation schema
 * @throws {ValidationError} If validation fails
 */
export function validateRequest(payload, schema) {
  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];
    
    // Required field check
    if (rules.required && !validators.required(value)) {
      errors.push(`${field} is required`);
      return;
    }
    
    // Skip validation if value is undefined/null and not required
    if (!validators.required(value) && !rules.required) {
      return;
    }
    
    // Type validation
    if (rules.type && !validators[rules.type](value)) {
      errors.push(`${field} must be a ${rules.type}`);
    }
    
    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors.push(rules.message || `${field} is invalid`);
    }
  });
  
  if (errors.length > 0) {
    throw new ValidationError(`Request validation failed: ${errors.join(', ')}`);
  }
  
  return true;
} 