import { useState, useEffect } from 'react';
import { PredictiveValidation } from '../../autonomic/PredictiveValidation';

export function useAutonomicValidation() {
  const [validation] = useState(() => new PredictiveValidation());
  const [errors, setErrors] = useState<any[]>([]);

  useEffect(() => {
    const subscription = validation.observeTypeErrors().subscribe((newErrors: any[]) => {
      setErrors(newErrors);
    });

    return () => subscription.unsubscribe();
  }, [validation]);

  return {
    validation,
    errors
  };
} 