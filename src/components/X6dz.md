# ChatGenius Architecture

## Core Principles
- Keep things simple and clear
- Build what's actually needed
- Learn from real use
- Grow naturally

## Technology Stack
- Frontend: React + TypeScript + Vite
- State: Zustand + WebSocket
- Backend: Node.js + PostgreSQL
- Real-time: WebSocket + Redis

## Key Systems

### 1. Core Types
```typescript
// How things feel
interface Feel {
  ease: number;    // Flow smoothly
  depth: number;   // Go deep
  warmth: number;  // Stay welcoming
  space: number;   // Give room
}

// How things connect
interface Link {
  from: string;
  to: string;
  kind: string;
  strength: number;
}

// Places to be
interface Spot {
  id: string;
  feel: Feel;
  links: Link[];
  here: string[];
}
```

### 2. State Management
```typescript
interface AppState {
  // Current state
  spots: Map<string, Spot>;
  links: Map<string, Link[]>;
  
  // Actions
  add: (spot: Spot) => void;
  link: (from: string, to: string) => void;
  move: (id: string, to: string) => void;
}
```

### 3. Real-time Flow
```typescript
interface Flow {
  // What's happening
  active: Set<string>;
  working: Map<string, string>;
  resting: Set<string>;
  
  // Track changes
  join: (id: string) => void;
  leave: (id: string) => void;
  update: (id: string, state: string) => void;
}
```

## Implementation Focus

### 1. Keep It Simple
- Clean, practical types
- Clear state management
- Simple real-time updates
- Easy to understand

### 2. Build What's Needed
- Start with basics
- Add features as needed
- Remove unused things
- Learn from patterns

### 3. Grow Naturally
- Let patterns emerge
- Build on what works
- Stay adaptable
- Keep it clean

## Core Features
1. Natural chat flow
2. Clear state management
3. Simple real-time updates
4. Easy to use interface

## Technical Details
- WebSocket for updates
- Redis for real-time
- PostgreSQL for history
- React for interface

## Security
- Simple, strong auth
- Clear permissions
- Safe data handling
- Protected privacy

## Scaling
- Clean horizontal scaling
- Simple data sharding
- Clear update patterns
- Easy maintenance

Remember: Keep it simple, build what's needed, learn from use, grow naturally. 