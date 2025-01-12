import { useEffect, useRef } from 'react';
import { Observable, Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { EnergySystem, EnergyState } from '../energy/EnergySystem';

interface ValidationState {
  type: 'code' | 'test' | 'build' | 'runtime';
  status: 'valid' | 'invalid' | 'evolving';
  context: string[];
  energy: number;
  resonance: number;
}

interface ValidationPattern {
  id: string;
  type: ValidationState['type'];
  signature: string[];
  success_rate: number;
  evolution: {
    iterations: number;
    last_success: number;
    strength: number;
  };
}

export function useAutonomicValidation(
  energySystem: EnergySystem,
  initialPatterns: ValidationPattern[] = []
) {
  const patterns = useRef<ValidationPattern[]>(initialPatterns);
  const validationState$ = useRef(new Subject<ValidationState>());
  
  useEffect(() => {
    // Connect to energy system
    const energySub = energySystem.observeEnergy().subscribe(energy => {
      handleEnergyChange(energy);
    });

    // Initialize continuous validation
    const validationSub = merge(
      // Code validation stream
      createValidationStream('code'),
      // Test validation stream
      createValidationStream('test'),
      // Build validation stream
      createValidationStream('build'),
      // Runtime validation stream
      createValidationStream('runtime')
    ).pipe(
      debounceTime(100), // Coalesce rapid changes
      distinctUntilChanged()
    ).subscribe(async state => {
      await validateState(state);
    });

    return () => {
      energySub.unsubscribe();
      validationSub.unsubscribe();
    };
  }, [energySystem]);

  const handleEnergyChange = (energy: EnergyState) => {
    // Adjust validation intensity based on energy
    if (energy.type === 'flow' && energy.level > 0.8) {
      // In flow state, reduce validation frequency
      validationState$.current.pipe(
        debounceTime(500)
      );
    } else {
      // Normal validation frequency
      validationState$.current.pipe(
        debounceTime(100)
      );
    }
  };

  const createValidationStream = (type: ValidationState['type']): Observable<ValidationState> => {
    return validationState$.current.pipe(
      filter(state => state.type === type)
    );
  };

  const validateState = async (state: ValidationState) => {
    // Find matching patterns
    const matchingPatterns = findMatchingPatterns(state);

    if (matchingPatterns.length > 0) {
      // Evolve existing patterns
      await evolvePatterns(matchingPatterns, state);
    } else {
      // Emerge new pattern
      await emergeNewPattern(state);
    }

    // Update energy system
    await updateEnergy(state);
  };

  const findMatchingPatterns = (state: ValidationState): ValidationPattern[] => {
    return patterns.current.filter(pattern => {
      const typeMatch = pattern.type === state.type;
      const contextMatch = state.context.some(ctx => pattern.signature.includes(ctx));
      return typeMatch && contextMatch;
    });
  };

  const evolvePatterns = async (matchingPatterns: ValidationPattern[], state: ValidationState) => {
    const evolved = matchingPatterns.map(pattern => ({
      ...pattern,
      success_rate: state.status === 'valid' 
        ? (pattern.success_rate * pattern.evolution.iterations + 1) / (pattern.evolution.iterations + 1)
        : (pattern.success_rate * pattern.evolution.iterations) / (pattern.evolution.iterations + 1),
      evolution: {
        iterations: pattern.evolution.iterations + 1,
        last_success: state.status === 'valid' ? Date.now() : pattern.evolution.last_success,
        strength: state.status === 'valid' 
          ? Math.min(pattern.evolution.strength + 0.1, 1)
          : Math.max(pattern.evolution.strength - 0.1, 0)
      }
    }));

    patterns.current = [
      ...patterns.current.filter(p => !matchingPatterns.includes(p)),
      ...evolved
    ];
  };

  const emergeNewPattern = async (state: ValidationState) => {
    const newPattern: ValidationPattern = {
      id: `validation-${Date.now()}`,
      type: state.type,
      signature: [...state.context],
      success_rate: state.status === 'valid' ? 1 : 0,
      evolution: {
        iterations: 1,
        last_success: state.status === 'valid' ? Date.now() : 0,
        strength: state.status === 'valid' ? 0.6 : 0.4
      }
    };

    patterns.current = [...patterns.current, newPattern];
  };

  const updateEnergy = async (state: ValidationState) => {
    if (state.status === 'valid') {
      await energySystem.elevateEnergy(state.context);
    }
    
    if (state.status === 'evolving') {
      await energySystem.enterFlow(state.context);
    }
  };

  return {
    validate: (state: ValidationState) => validationState$.current.next(state),
    getPatterns: () => patterns.current,
    observeValidation: () => validationState$.current.asObservable()
  };
} 