# Natural Patterns

This document outlines the core patterns that guide our codebase structure and development flow.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Core Principles](#core-principles)
   - [Feature Isolation](#feature-isolation)
   - [Natural Flows](#natural-flows)
3. [Pattern Examples](#pattern-examples)
   - [Component Pattern](#component-pattern)
   - [Hook Pattern](#hook-pattern)
   - [Test Pattern](#test-pattern)
4. [Usage Guidelines](#when-to-use-each-pattern)
5. [Maintenance](#maintaining-natural-flow)
6. [Anti-Patterns](#anti-patterns-to-avoid)
7. [Growth Model](#growing-naturally)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Edge Cases](#edge-cases)
10. [Migration Guide](#migration-guide)
11. [Pattern Relationships](#pattern-relationships)

## Quick Start

### Key Concepts
- Features are isolated and self-contained
- Data flows naturally through layers
- Components follow single responsibility
- Tests mirror natural behavior

### First Steps
1. Identify feature boundaries
2. Set up feature structure
3. Implement natural flows
4. Add tests that follow flows

### Common Patterns
- [Component Pattern](#component-pattern) for UI elements
- [Hook Pattern](#hook-pattern) for logic
- [Test Pattern](#test-pattern) for verification

[🔼 Back to top](#table-of-contents)

## Core Principles

### Feature Isolation
```
/feature
  /components  # UI layer
  /hooks       # Logic layer
  /api         # Data layer
  /tests       # Verification layer
```

Each feature is self-contained and follows a natural data flow:
1. Data enters through API
2. Logic processes in hooks
3. UI renders in components
4. Tests verify all layers

[🔼 Back to top](#table-of-contents)

### Natural Flows

#### Component Flow
```
State → Render → Update
- State changes trigger
- Component renders
- User interacts
- State updates naturally
```

#### Data Flow
```
Request → Process → Response
- API call initiated
- Data transformed
- Result returned naturally
```

#### Test Flow
```
Setup → Action → Verify
- Component mounted
- Action triggered
- Result verified naturally
```

[🔼 Back to top](#table-of-contents)

## Pattern Examples

### Component Pattern
```javascript
function Feature() {
  // 1. State layer
  const [state, setState] = useState(initial);
  
  // 2. Logic layer
  const handleAction = useCallback(() => {
    // Process
    setState(newState);
  }, []);
  
  // 3. Render layer
  return (
    <div>
      {/* Natural layout flow */}
      <Display value={state} />
      <Controls onAction={handleAction} />
    </div>
  );
}
```

**Related Patterns:**
- [Hook Pattern](#hook-pattern) for logic extraction
- [Test Pattern](#test-pattern) for verification

[🔼 Back to top](#table-of-contents)

### Hook Pattern
```javascript
function useFeature() {
  // 1. State management
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // 2. Data fetching
  const fetchData = useCallback(async () => {
    try {
      const result = await api.getData();
      setData(result);
    } catch (err) {
      setError(err);
    }
  }, []);
  
  // 3. Natural return shape
  return { data, error, fetchData };
}
```

**Related Patterns:**
- [Component Pattern](#component-pattern) for UI integration
- [Error Boundaries](#error-boundaries) for error handling

[🔼 Back to top](#table-of-contents)

### Test Pattern
```javascript
describe('Feature', () => {
  // 1. Setup phase
  beforeEach(() => {
    // Prepare environment
  });
  
  // 2. Test cases follow natural flow
  it('handles user action', () => {
    // Setup
    render(<Feature />);
    
    // Action
    fireEvent.click(...);
    
    // Verify
    expect(...).toBeInTheDocument();
  });
});
```

**Related Patterns:**
- [Component Pattern](#component-pattern) for what to test
- [Hook Pattern](#hook-pattern) for logic testing

[🔼 Back to top](#table-of-contents)

## When to Use Each Pattern

### Feature Isolation
- When adding new functionality
- When functionality has clear boundaries
- When code needs to be tested independently

### Component Composition
- When UI elements are reused
- When breaking down complex views
- When sharing behavior patterns

### Hook Extraction
- When logic is reused across components
- When managing complex state
- When handling side effects

### Error Boundaries
- Around risky operations
- At route boundaries
- Around third-party components

## Maintaining Natural Flow

1. Follow data direction
   - Data flows down through props
   - Events flow up through callbacks
   - Side effects flow through hooks

2. Keep components focused
   - Single responsibility
   - Clear prop interface
   - Natural composition

3. Handle errors gracefully
   - Capture at boundaries
   - Recover naturally
   - Provide feedback

4. Test naturally
   - Mirror user behavior
   - Follow component flow
   - Verify expected outcomes

## Anti-Patterns to Avoid

1. Breaking Feature Isolation
   ```
   ❌ Importing directly from other features
   ✅ Using shared components/hooks
   ```

2. Mixing Concerns
   ```
   ❌ Combining API calls with rendering
   ✅ Separating into hooks and components
   ```

3. Forcing Flow
   ```
   ❌ Managing state in child components
   ✅ Lifting state to parent
   ```

4. Skipping Tests
   ```
   ❌ Testing implementation details
   ✅ Testing user interactions
   ```

## Growing Naturally

The codebase should grow like a tree:
- Strong core (shared components)
- Natural branches (features)
- Clear flow (data movement)
- Healthy pruning (refactoring)

Follow these patterns to maintain a codebase that:
- Is easy to understand
- Grows naturally
- Handles change well
- Tests reliably 

## Quick Reference

### Pattern Selection Guide
- UI Components → [Component Pattern](#component-pattern)
- Business Logic → [Hook Pattern](#hook-pattern)
- Testing → [Test Pattern](#test-pattern)
- Error Handling → [Error Boundaries](#error-boundaries)

### Common Flows
- User Interaction → Component → Hook → API
- Data Update → API → Hook → Component
- Error → Boundary → Recovery → User

[🔼 Back to top](#table-of-contents)

## Troubleshooting Guide

### Common Issues

1. **Broken Feature Isolation**
   ```javascript
   // Problem: Direct import from another feature
   import { useAuth } from '../../auth/hooks/useAuth';
   
   // Solution: Use shared hook or context
   import { useAuth } from '../../shared/hooks/useAuth';
   ```

2. **State Management Leaks**
   ```javascript
   // Problem: Child managing parent state
   function Child({ data }) {
     const [parentData, setParentData] = useState(data);
   
   // Solution: Lift state up
   function Parent() {
     const [data, setData] = useState(initial);
     return <Child data={data} onUpdate={setData} />;
   ```

3. **Test Instability**
   ```javascript
   // Problem: Testing implementation details
   expect(component.state.loading).toBe(true);
   
   // Solution: Test user-visible behavior
   expect(screen.getByText('Loading...')).toBeInTheDocument();
   ```

### Recovery Steps

1. **Feature Bleeding**
   - Identify cross-feature dependencies
   - Extract shared logic to shared layer
   - Update imports to use shared code
   - Verify feature isolation

2. **Performance Issues**
   - Profile component renders
   - Check unnecessary re-renders
   - Implement useMemo/useCallback
   - Verify performance improvement

3. **Test Failures**
   - Check test isolation
   - Verify test data setup
   - Ensure natural user flows
   - Add error boundaries

## Edge Cases

### Large Feature Sets

When features grow beyond basic patterns:

```javascript
// 1. Split into sub-features
/feature
  /sub-feature-1
    /components
    /hooks
  /sub-feature-2
    /components
    /hooks

// 2. Use feature-level shared code
/feature
  /shared
    /hooks
    /utils
  /components
  /api
```

### Cross-Feature Communication

When features need to interact:

```javascript
// 1. Event-based communication
const eventBus = {
  subscribe: (event, callback) => {},
  publish: (event, data) => {},
};

// 2. Shared state management
const useSharedState = createSharedHook({
  initial,
  actions,
});
```

### Performance Optimization

When standard patterns need tuning:

```javascript
// 1. Component splitting
const Heavy = React.lazy(() => import('./Heavy'));
function Feature() {
  return (
    <Suspense fallback={<Loader />}>
      <Heavy />
    </Suspense>
  );
}

// 2. Data caching
function useFeature() {
  const cache = useRef(new Map());
  return {
    getData: useCallback((key) => {
      if (cache.current.has(key)) return cache.current.get(key);
      // Fetch and cache
    }, []),
  };
}
```

## Migration Guide

### From Traditional to Natural

1. **Component Migration**
   ```javascript
   // Before: Mixed concerns
   class OldComponent extends React.Component {
     state = { data: null };
     componentDidMount() {
       this.fetchData();
     }
     render() { /* ... */ }
   }
   
   // After: Natural separation
   function NewComponent() {
     const { data } = useFeatureData();
     return /* ... */;
   }
   ```

2. **Hook Migration**
   ```javascript
   // Before: Class methods
   handleSubmit() {
     this.setState({ loading: true });
     this.submitData();
   }
   
   // After: Hook pattern
   const useSubmit = () => {
     const [loading, setLoading] = useState(false);
     const submit = useCallback(async () => {
       setLoading(true);
       // ...
     }, []);
     return { loading, submit };
   };
   ```

3. **Test Migration**
   ```javascript
   // Before: Implementation testing
   expect(wrapper.instance().state.data).toBe(expected);
   
   // After: Behavior testing
   expect(screen.getByText(expected)).toBeInTheDocument();
   ```

### Migration Checklist

1. **Analysis**
   - [ ] Identify feature boundaries
   - [ ] Map data flows
   - [ ] List shared dependencies

2. **Implementation**
   - [ ] Create feature structure
   - [ ] Extract hooks
   - [ ] Update components
   - [ ] Add tests

3. **Verification**
   - [ ] Check feature isolation
   - [ ] Verify data flows
   - [ ] Run test suite
   - [ ] Review performance

## Pattern Relationships

### Flow Connections

```
Component Pattern
      ↕
  Hook Pattern
      ↕
   API Layer
```

### Pattern Combinations

1. **Component + Hook**
   ```javascript
   // Hook provides logic
   const useFeature = () => ({ data, actions });
   
   // Component uses logic
   function Feature() {
     const { data, actions } = useFeature();
     return <UI data={data} {...actions} />;
   }
   ```

2. **Hook + API**
   ```javascript
   // API provides data
   const api = { fetch: async () => {} };
   
   // Hook manages state
   const useData = () => {
     const [data, setData] = useState(null);
     useEffect(() => {
       api.fetch().then(setData);
     }, []);
     return data;
   };
   ```

3. **Test + Component**
   ```javascript
   // Component defines behavior
   function Feature({ onAction }) {
     return <button onClick={onAction}>Click</button>;
   }
   
   // Test verifies behavior
   it('calls onAction', () => {
     const onAction = jest.fn();
     render(<Feature onAction={onAction} />);
     fireEvent.click(screen.getByText('Click'));
     expect(onAction).toHaveBeenCalled();
   });
   ```

[🔼 Back to top](#table-of-contents) 