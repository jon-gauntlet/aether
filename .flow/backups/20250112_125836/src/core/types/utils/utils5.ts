import { useEffect, useState } from 'react';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';
import { useAutonomicValidation } from './useAutonomicValidation';

interface TypeError {
  message: string;
  path: string[];
  timestamp: number;
}

export function useTypeValidation(predictiveValidation: PredictiveValidation) {
  const [errors, setErrors] = useState<TypeError[]>([]);

  useEffect(() => {
    const subscription = predictiveValidation.observeTypeErrors().subscribe(
      validationResults => {
        const newErrors = validationResults.flatMap(result => 
          result.errors.map(error => ({
            message: error,
            path: result.path,
            timestamp: Date.now()
          }))
        );

        setErrors(prev => {
          // Remove errors older than 5 minutes
          const filtered = prev.filter(
            error => Date.now() - error.timestamp < 5 * 60 * 1000
          );
          return [...filtered, ...newErrors];
        });

        // Log errors to console in development
        if (process.env.NODE_ENV === 'development' && newErrors.length > 0) {
          console.group('Type Validation Errors');
          newErrors.forEach(error => {
            console.error(`${error.path.join('.')}: ${error.message}`);
          });
          console.groupEnd();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [predictiveValidation]);

  return {
    errors,
    hasErrors: errors.length > 0,
    clearErrors: () => setErrors([])
  };

  return {};
}