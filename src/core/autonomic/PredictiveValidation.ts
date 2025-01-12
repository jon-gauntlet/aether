import { Observable, Subject } from 'rxjs';
import type { FlowMetrics } from '../types/base';

export class PredictiveValidation {
  private typeErrors = new Subject<any[]>();

  observeTypeErrors(): Observable<any[]> {
    return this.typeErrors.asObservable();
  }

  validateType(value: any, expectedType: string): boolean {
    const errors: any[] = [];
    const actualType = typeof value;

    if (actualType !== expectedType) {
      errors.push({
        value,
        expectedType,
        actualType,
        message: `Expected ${expectedType} but got ${actualType}`
      });
      this.typeErrors.next(errors);
      return false;
    }

    return true;
  }

  validateMetrics(metrics: FlowMetrics): boolean {
    const errors: any[] = [];
    const requiredFields = ['velocity', 'resistance', 'momentum', 'conductivity'];

    for (const field of requiredFields) {
      if (!(field in metrics)) {
        errors.push({
          field,
          message: `Missing required field: ${field}`
        });
      } else if (typeof metrics[field as keyof FlowMetrics] !== 'number') {
        errors.push({
          field,
          value: metrics[field as keyof FlowMetrics],
          message: `Field ${field} must be a number`
        });
      }
    }

    if (errors.length > 0) {
      this.typeErrors.next(errors);
      return false;
    }

    return true;
  }
} 