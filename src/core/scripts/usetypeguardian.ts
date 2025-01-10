import { useEffect, useState } from 'react';
import { TypeGuardian } from '../guardian/TypeGuardian';

interface TypeGuardianHook {
  isValidating: boolean;
  hasErrors: boolean;
  errorCount: number;
  lastValidation: number;
  validateFile: (file: string) => Promise<void>;
}

let globalGuardian: TypeGuardian | null = null;

export function useTypeGuardian(): TypeGuardianHook {
  const [state, setState] = useState({
    isValidating: false,
    hasErrors: false,
    errorCount: 0,
    lastValidation: Date.now()
  });

  useEffect(() => {
    // Initialize global guardian if needed
    if (!globalGuardian) {
      globalGuardian = new TypeGuardian(process.cwd());
    }

    // Subscribe to validation results
    const subscription = globalGuardian.observeValidation().subscribe(errors => {
      setState({
        isValidating: false,
        hasErrors: errors.length > 0,
        errorCount: errors.length,
        lastValidation: Date.now()
      });

      // If we have errors in development, block the process
      if (errors.length > 0 && process.env.NODE_ENV === 'development') {
        console.error('\n🚨 Type Guardian detected errors:');
        errors.forEach(error => {
          console.error(`\n${error.file}:`);
          error.errors.forEach(e => console.error(`  - ${e}`));
        });
        
        // This will prevent npm start from proceeding with errors
        process.exit(1);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateFile = async (file: string) => {
    if (!globalGuardian) return;

    setState(prev => ({ ...prev, isValidating: true }));
    const result = await globalGuardian.validateFile(file);
    
    setState(prev => ({
      ...prev,
      isValidating: false,
      hasErrors: !result.isValid,
      errorCount: result.errors.length,
      lastValidation: Date.now()
    }));
  };

  return {
    ...state,
    validateFile
  };
} 