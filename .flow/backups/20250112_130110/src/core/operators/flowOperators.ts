import { Observable, OperatorFunction, pipe } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import type { FlowStateUpdate, FlowContext } from '../types/flow';
import type { FlowMetrics, FlowState } from '../types/base';
import type { Nullable } from '../types/base';
import { validateFlowStateUpdate, validateFlowMetrics } from '../types/flow';

/**
 * Filters out null values and validates flow state updates
 */
export const filterValidUpdates = (): OperatorFunction<Nullable<FlowStateUpdate>, FlowStateUpdate> => 
  pipe(
    filter((update): update is FlowStateUpdate => update !== null),
    map(update => validateFlowStateUpdate(update))
  );

/**
 * Extracts and validates metrics from flow updates
 */
export const extractMetrics = (): OperatorFunction<FlowStateUpdate, FlowMetrics> =>
  pipe(
    filter(update => update.type === 'metrics' && !!update.payload.metrics),
    map(update => validateFlowMetrics(update.payload.metrics!))
  );

/**
 * Extracts state changes from flow updates
 */
export const extractStateChanges = (): OperatorFunction<FlowStateUpdate, FlowState> =>
  pipe(
    filter(update => update.type === 'state' && !!update.payload.state),
    map(update => update.payload.state!)
  );

/**
 * Combines multiple updates into a single context update
 */
export const combineUpdates = (initial: FlowContext): OperatorFunction<FlowStateUpdate, FlowContext> =>
  pipe(
    map(update => {
      switch (update.type) {
        case 'metrics':
          return {
            ...initial,
            metrics: update.payload.metrics || initial.metrics,
            timestamp: update.timestamp
          };
        case 'state':
          return {
            ...initial,
            state: update.payload.state || initial.state,
            timestamp: update.timestamp
          };
        case 'protection':
          return {
            ...initial,
            protection: update.payload.protection || initial.protection,
            timestamp: update.timestamp
          };
        case 'pattern':
          return {
            ...initial,
            patterns: update.payload.patterns || initial.patterns,
            timestamp: update.timestamp
          };
        default:
          return initial;
      }
    })
  );

/**
 * Type-safe error handling for flow streams
 */
export const handleFlowError = <T>(fallback: T): OperatorFunction<T, T> =>
  pipe(
    map(value => {
      try {
        return value;
      } catch (error) {
        console.error('Flow stream error:', error);
        return fallback;
      }
    })
  ); 