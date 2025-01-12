import { useEffect, useState, useCallback } from 'react';
import { AutonomicDevelopment, DevelopmentState } from '../core/autonomic/AutonomicDevelopment';
import { PatternState } from '../core/patterns/PatternEvolution';
import { TypeValidationResult } from '../core/autonomic/PredictiveValidation';

interface DevelopmentHookState extends DevelopmentState {
  patterns: PatternState[];
  validationErrors: TypeValidationResult[];
  isInitialized: boolean;
}

let globalDevelopment: AutonomicDevelopment | null = null;

export function useAutonomicDevelopment() {
  const [state, setState] = useState<DevelopmentHookState>({
    id: '',
    timestamp: Date.now(),
    energy: 1.0,
    context: [],
    activePatterns: [],
    validationStatus: {
      isValid: true,
      errors: []
    },
    metrics: {
      patternStrength: 0,
      patternCoherence: 0,
      evolutionProgress: 0,
      validationSuccess: 1.0
    },
    patterns: [],
    validationErrors: [],
    isInitialized: false
  });

  useEffect(() => {
    if (!globalDevelopment) {
      globalDevelopment = new AutonomicDevelopment();
    }

    const subscriptions = [
      globalDevelopment.observeDevelopment().subscribe(development => {
        setState(prev => ({
          ...prev,
          ...development,
          isInitialized: true
        }));
      }),

      globalDevelopment.getPatternEvolution().observeAllPatterns().subscribe(patterns => {
        setState(prev => ({
          ...prev,
          patterns
        }));
      }),

      globalDevelopment.getPredictiveValidation().observeTypeErrors().subscribe(errors => {
        setState(prev => ({
          ...prev,
          validationErrors: errors,
          validationStatus: {
            isValid: errors.length === 0,
            errors: errors.flatMap(e => e.errors)
          }
        }));
      })
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const getInsights = useCallback(() => {
    if (!globalDevelopment) return null;
    return globalDevelopment.getDevelopmentInsights();
  }, []);

  const getPatternInsights = useCallback((patternId: string) => {
    if (!globalDevelopment) return null;
    return globalDevelopment.getPatternEvolution().getEvolutionInsights(patternId);
  }, []);

  const updateContext = useCallback((context: string[]) => {
    if (!globalDevelopment) return;
    globalDevelopment.getPredictiveValidation().setValidationContext(context);
  }, []);

  return {
    ...state,
    getInsights,
    getPatternInsights,
    updateContext,
    isReady: state.isInitialized
  };
}

export function useDevelopmentPattern(patternId: string) {
  const [pattern, setPattern] = useState<PatternState | null>(null);

  useEffect(() => {
    if (!globalDevelopment) return;

    const subscription = globalDevelopment.getPatternEvolution()
      .observePattern(patternId)
      .subscribe(p => setPattern(p || null));

    return () => subscription.unsubscribe();
  }, [patternId]);

  const updateMetrics = useCallback((metrics: Partial<PatternState['metrics']>) => {
    if (!globalDevelopment || !pattern) return;
    globalDevelopment.getPatternEvolution().updateMetrics(pattern.id, metrics);
  }, [pattern]);

  return {
    pattern,
    updateMetrics,
    isLoaded: !!pattern
  };
}

export function useDevelopmentValidation() {
  const [validationErrors, setValidationErrors] = useState<TypeValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!globalDevelopment) return;

    const subscription = globalDevelopment.getPredictiveValidation()
      .observeTypeErrors()
      .subscribe(errors => {
        setValidationErrors(errors);
        setIsValidating(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const validate = useCallback(async (state: any) => {
    if (!globalDevelopment) return;
    setIsValidating(true);
    await globalDevelopment.getPredictiveValidation().validateState(state);
  }, []);

  return {
    validationErrors,
    isValidating,
    validate,
    hasErrors: validationErrors.length > 0
  };

  return {};
}