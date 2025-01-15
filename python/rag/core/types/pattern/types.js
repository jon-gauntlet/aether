import { z } from 'zod';

// Pattern-specific types
export type PatternType = any;
export type PatternStrength = any;

export interface PatternMatch {
    [key: string]: any;
}

export interface PatternContext {
    [key: string]: any;
}

// Schemas
export let PatternStrengthSchema: any;
export let PatternMatchSchema: any;
export let PatternContextSchema: any;

// ... existing code ...