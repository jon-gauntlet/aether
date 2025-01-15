import type { Observable } from 'rxjs';
import type { 
    BaseState, 
    FlowState, 
    FlowMetrics, 
    Protection, 
    Resonance, 
    NaturalPattern, 
    Nullable, 
    Optional, 
    SystemUpdate 
} from './base';
import { 
    isFlowMetrics, 
    isProtection, 
    isNaturalPattern 
} from './base';

// Flow state values
export interface FLOW_STATES {
    [key: string]: any;
}

export interface FlowProtection {
    [key: string]: any;
}

export interface FlowOption {
    [key: string]: any;
}

// Validation utilities
export const isValidHistory = (history) => {
    if (!history || typeof history !== 'object') return false;
    return (
        'transitions' in history && 
        'patterns' in history && 
        'metrics' in history && 
        Array.isArray(history.transitions)
    );
};

export const isValidTransition = (transition) => {
    if (!transition || typeof transition !== 'object') return false;
    return (
        'from' in transition &&
        'to' in transition &&
        'timestamp' in transition
    );
};

export const validateMetrics = (metrics) => {
    if (!isFlowMetrics(metrics)) {
        throw new Error('Invalid flow metrics');
    }
    return metrics;
};

// ... existing code ...