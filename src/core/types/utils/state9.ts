import { useEffect, useState } from 'react';
import { TypeGuardian } from '../guardian/TypeGuardian';
import { ProtectionState } from '../guardian/ProtectionGuardian';
import { combineLatest } from 'rxjs';

interface GuardianState {
  isValidating: boolean;
  hasErrors: boolean;
  errorCount: number;
  lastValidation: number;
  energy: number;
  mode: 'active' | 'passive' | 'protective';
  protection: ProtectionState;
}

let globalGuardian: TypeGuardian | null = null;

export function useGuardian(): GuardianState {
  const [state, setState] = useState<GuardianState>({
    isValidating: false,
    hasErrors: false,
    errorCount: 0,
    lastValidation: Date.now(),
    energy: 1.0,
    mode: 'active',
    protection: {
      mode: 'active',
      energy: 1.0,
      context: [],
      patterns: [],
      invariants: {
        types: new Set(),
        patterns: new Set(),
        relationships: new Set()
      },
      streams: []
    }
  });

  useEffect(() => {
    // Initialize global guardian if needed
    if (!globalGuardian) {
      globalGuardian = new TypeGuardian(process.cwd());
    }

    // Subscribe to all guardian observables
    const subscription = combineLatest([
      globalGuardian.observeValidation(),
      globalGuardian.observeEnergy(),
      globalGuardian.observeMode(),
      globalGuardian.observeProtection()
    ]).subscribe(([errors, energy, mode, protection]) => {
      setState({
        isValidating: false,
        hasErrors: errors.length > 0,
        errorCount: errors.length,
        lastValidation: Date.now(),
        energy,
        mode,
        protection
      });

      // If we have errors in development, block the process
      if (errors.length > 0 && process.env.NODE_ENV === 'development') {
        console.error('\n🚨 Guardian detected errors:');
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

  return state;

  return {};
}