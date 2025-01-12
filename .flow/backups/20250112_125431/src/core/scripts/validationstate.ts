import { FlowState, FlowMetrics, Protection, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';

export interface ValidationState {
  id: string;
  type: string;
  flow: FlowState;
  metrics: ValidationMetrics;
  protection: Protection;
  patterns: Pattern[];
  timestamp: number;
}

export interface ValidationMetrics extends FlowMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  coverage: number;
}

export interface ValidationPattern extends Pattern {
  accuracy: number;
  precision: number;
  recall: number;
  coverage: number;
  developmentPhase: DevelopmentPhase;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  metrics: ValidationMetrics;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'critical';
  context: string[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'warning' | 'suggestion';
  context: string[];
}

export interface ValidationSuggestion {
  code: string;
  message: string;
  priority: number;
  context: string[];
}

export interface ValidationSystem {
  state$: Observable<ValidationState>;
  validate(state: any): Promise<ValidationResult>;
  predictValidation(context: string[]): Promise<ValidationResult>;
  getValidationMetrics(): ValidationMetrics;
}

export interface TypeValidation {
  validateType(value: any, type: string): ValidationResult;
  validateInterface(value: any, interfaceName: string): ValidationResult;
  validatePattern(value: any, pattern: ValidationPattern): ValidationResult;
}

export interface ValidationAnalytics {
  accuracy: number;
  precision: number;
  recall: number;
  coverage: number;
  patterns: ValidationPattern[];
  results: ValidationResult[];
}