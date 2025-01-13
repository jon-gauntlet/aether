import { useEffect, useCallback, useRef } from 'react';
import { Observable, Subject } from 'rxjs';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';
import { EnergySystem } from '../energy/EnergySystem';
import { AutonomicSystem } from '../autonomic/Autonomic';

interface ValidationContext {
  path: string;
  type: string;
  energy: number;
}

export function useAutonomicValidation(
  context: ValidationContext,
  energySystem: EnergySystem,
  autonomic: AutonomicSystem
) {
  const predictive = useRef<PredictiveValidation>();
  const validation$ = useRef(new Subject<boolean>());

  useEffect(() => {
    // Initialize predictive validation if needed
    if (!predictive.current) {
      predictive.current = new PredictiveValidation(autonomic, energySystem);
    }

    // Subscribe to predictions
    const sub = predictive.current
      .predictValidation([context.path, context.type])
      .subscribe(pattern => {
        // Adjust validation timing based on predictions
        const timing = pattern.predictions.optimal_timing;
        
        // Schedule next validation
        setTimeout(() => {
          const success = Math.random() > 0.2; // Placeholder for actual validation
          validation$.current.next(success);
        }, timing);

        // Handle predicted issues
        if (pattern.predictions.likely_issues.length > 0) {
          console.warn('Predicted validation issues:', pattern.predictions.likely_issues);
        }
      });

    return () => sub.unsubscribe();
  }, [context, energySystem, autonomic]);

  const validate = useCallback(async () => {
    if (!predictive.current) return false;

    const probability = await predictive.current
      .getSuccessProbability([context.path, context.type])
      .toPromise();

    // Use probability to inform validation, default to false if undefined
    return probability !== undefined && probability > 0.7;
  }, [context]);

  return {
    validation$: validation$.current.asObservable(),
    validate,
    predictive: predictive.current
  };
} // Merged from 1_useautonomicvalidation.ts
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
} // Merged from 2_useautonomicvalidation.ts
import { useEffect, useRef } from 'react';
import { Observable, Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { EnergySystem, EnergyState } from '../energy/EnergySystem';
import { AutonomicSystem } from '../autonomic/Autonomic';

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
  const autonomic = useRef<AutonomicSystem>(new AutonomicSystem(energySystem));
  
  useEffect(() => {
    // Connect to energy system
    const energySub = energySystem.observeEnergy().subscribe(energy => {
      handleEnergyChange(energy);
    });

    // Initialize continuous validation with autonomic capabilities
    const validationSub = merge(
      createValidationStream('code'),
      createValidationStream('test'),
      createValidationStream('build'),
      createValidationStream('runtime')
    ).pipe(
      debounceTime(100),
      distinctUntilChanged()
    ).subscribe(async state => {
      if (autonomic.current.shouldActAutonomously(state.context)) {
        // Autonomous validation
        await autoValidateState(state);
      } else {
        // Normal validation
        await validateState(state);
      }
    });

    return () => {
      energySub.unsubscribe();
      validationSub.unsubscribe();
    };
  }, [energySystem]);

  const handleEnergyChange = (energy: EnergyState) => {
    const confidence = autonomic.current.getConfidence(['energy_change']);
    
    // Adjust validation intensity based on energy and confidence
    if (energy.type === 'flow' && energy.level > 0.8 && confidence > 0.7) {
      validationState$.current.pipe(
        debounceTime(500)
      );
    } else {
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

  const autoValidateState = async (state: ValidationState) => {
    try {
      // Get recommended action from autonomic system
      const recommendedContext = autonomic.current.getRecommendedAction(state.context);
      
      // Apply recommended context
      const enhancedState = {
        ...state,
        context: [...state.context, ...recommendedContext]
      };

      // Perform validation
      await validateState(enhancedState);

      // Record successful autonomous decision
      autonomic.current.recordDecision(
        state.context,
        true,
        state.status === 'valid' ? 1 : 0.5
      );
    } catch (error) {
      // Record failed autonomous decision
      autonomic.current.recordDecision(
        state.context,
        false,
        0
      );
      
      // Fall back to normal validation
      await validateState(state);
    }
  };

  const validateState = async (state: ValidationState) => {
    const matchingPatterns = findMatchingPatterns(state);

    if (matchingPatterns.length > 0) {
      await evolvePatterns(matchingPatterns, state);
    } else {
      await emergeNewPattern(state);
    }

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
    observeValidation: () => validationState$.current.asObservable(),
    getAutonomicState: () => autonomic.current.observeAutonomicState()
  };
} // Merged from 1_useautonomicvalidation.ts
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
} // Merged from 2_useautonomicvalidation.ts
import { useEffect, useRef } from 'react';
import { Observable, Subject, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { EnergySystem, EnergyState } from '../energy/EnergySystem';
import { AutonomicSystem } from '../autonomic/Autonomic';

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
  const autonomic = useRef<AutonomicSystem>(new AutonomicSystem(energySystem));
  
  useEffect(() => {
    // Connect to energy system
    const energySub = energySystem.observeEnergy().subscribe(energy => {
      handleEnergyChange(energy);
    });

    // Initialize continuous validation with autonomic capabilities
    const validationSub = merge(
      createValidationStream('code'),
      createValidationStream('test'),
      createValidationStream('build'),
      createValidationStream('runtime')
    ).pipe(
      debounceTime(100),
      distinctUntilChanged()
    ).subscribe(async state => {
      if (autonomic.current.shouldActAutonomously(state.context)) {
        // Autonomous validation
        await autoValidateState(state);
      } else {
        // Normal validation
        await validateState(state);
      }
    });

    return () => {
      energySub.unsubscribe();
      validationSub.unsubscribe();
    };
  }, [energySystem]);

  const handleEnergyChange = (energy: EnergyState) => {
    const confidence = autonomic.current.getConfidence(['energy_change']);
    
    // Adjust validation intensity based on energy and confidence
    if (energy.type === 'flow' && energy.level > 0.8 && confidence > 0.7) {
      validationState$.current.pipe(
        debounceTime(500)
      );
    } else {
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

  const autoValidateState = async (state: ValidationState) => {
    try {
      // Get recommended action from autonomic system
      const recommendedContext = autonomic.current.getRecommendedAction(state.context);
      
      // Apply recommended context
      const enhancedState = {
        ...state,
        context: [...state.context, ...recommendedContext]
      };

      // Perform validation
      await validateState(enhancedState);

      // Record successful autonomous decision
      autonomic.current.recordDecision(
        state.context,
        true,
        state.status === 'valid' ? 1 : 0.5
      );
    } catch (error) {
      // Record failed autonomous decision
      autonomic.current.recordDecision(
        state.context,
        false,
        0
      );
      
      // Fall back to normal validation
      await validateState(state);
    }
  };

  const validateState = async (state: ValidationState) => {
    const matchingPatterns = findMatchingPatterns(state);

    if (matchingPatterns.length > 0) {
      await evolvePatterns(matchingPatterns, state);
    } else {
      await emergeNewPattern(state);
    }

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
    observeValidation: () => validationState$.current.asObservable(),
    getAutonomicState: () => autonomic.current.observeAutonomicState()
  };
} 