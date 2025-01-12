# Systematic Type Fixes

## Current Issues

### 1. Module Resolution
- Missing module declarations for imports
- Inconsistent path references
- Missing type declarations for external deps

### 2. Type Definition Gaps  
- Missing exports of key types
- Incomplete interface definitions
- Type vs value confusion

### 3. Implicit Any Types
- Missing parameter types
- Unsafe array operations
- Callback type safety

### 4. Dead Code
- Unused imports
- Unreferenced declarations
- Dead code paths

## Solutions

### 1. Module Resolution
```typescript
// 1. Standardize module structure
src/
  core/
    types/
      base/
        index.ts  // Core type definitions
      flow/
        index.ts  // Flow-specific types
      space/
        index.ts  // Space-specific types
    
// 2. Create type declaration files
declare module '@core/types/base' {
  export interface BaseState { ... }
  export type ValidationResult = { ... }
}

// 3. Update tsconfig.json paths
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["./src/core/*"],
      "@types": ["./src/core/types"],
      "@modules/*": ["./src/core/modules/*"]
    }
  }
}
```

### 2. Type Definition Gaps
```typescript
// 1. Type export pattern
export interface BaseState {
  id: string;
  type: string;
  metrics: BaseMetrics;
}

// 2. Type guards
export const isBaseState = (value: unknown): value is BaseState => {
  return value != null &&
    typeof value === 'object' &&
    'id' in value &&
    'type' in value;
}

// 3. Validation utilities
export const validateState = (state: unknown): ValidationResult => {
  if (!isBaseState(state)) {
    return { valid: false, errors: ['Invalid state structure'] };
  }
  return { valid: true };
}
```

### 3. Implicit Any Types
```typescript
// 1. Strict function types
const reducer = (sum: number, value: number): number => sum + value;

// 2. Array type safety
const values: number[] = [1, 2, 3];
const total = values.reduce(reducer, 0);

// 3. Type inference helpers
type Reducer<T, U> = (accumulator: U, current: T) => U;
const safeReduce = <T, U>(arr: T[], fn: Reducer<T, U>, initial: U): U => {
  return arr.reduce(fn, initial);
}
```

### 4. Dead Code Elimination
```typescript
// 1. Import cleanup
import type { BaseState } from './types';
// Remove: import { unused } from './types';

// 2. Code coverage
"jest": {
  "coverageThreshold": {
    "global": {
      "statements": 80,
      "branches": 80,
      "functions": 80,
      "lines": 80
    }
  }
}

// 3. ESLint rules
"rules": {
  "no-unused-vars": "error",
  "@typescript-eslint/no-unused-vars": "error"
}
```

## Implementation Strategy

### Phase 1: Module Structure
1. Reorganize type definitions into proper directory structure
2. Create type declaration files for core modules
3. Update tsconfig.json paths configuration

### Phase 2: Type Definitions
1. Export all required types from base
2. Implement type guards for core interfaces
3. Add validation utilities

### Phase 3: Type Safety
1. Add explicit types to all parameters
2. Implement type-safe array operations
3. Add generic type constraints

### Phase 4: Cleanup
1. Remove unused imports
2. Delete dead code
3. Add test coverage

## Best Practices
1. Always export types explicitly
2. Use type guards for runtime validation
3. Prefer explicit types over inference
4. Keep type definitions close to usage
5. Document type constraints

## Success Metrics
1. Zero TypeScript errors
2. 100% type coverage
3. No implicit any
4. No unused code
5. Test coverage > 80% 