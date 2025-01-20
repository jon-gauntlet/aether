import { useEffect, useState } from 'react';
import { TypeGuardian } from '../guardian/TypeGuardian';

/**
 * @typedef {Object} TypeGuardianHook
 * @property {boolean} isValidating
 * @property {boolean} hasErrors
 * @property {number} errorCount
 * @property {number} lastValidation
 */

/** @type {TypeGuardian|null} */
let globalGuardian = null;

/**
 * Hook for managing type validation
 * @returns {TypeGuardianHook & { validateFile: (file: string) => Promise<void> }}
 */
export function useTypeGuardian() {
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

  /**
   * Validate a specific file
   * @param {string} file - File path to validate
   * @returns {Promise<void>}
   */
  const validateFile = async (file) => {
    if (!globalGuardian) return;

    setState(prev => ({ ...prev, isValidating: true }));
    await globalGuardian.validateFile(file);
  };

  return {
    ...state,
    validateFile
  };
} 