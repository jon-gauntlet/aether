# ChatGenius Technical Architecture

## Core Principles
- Performance over features
- Fluid over fixed
- Context over content
- Momentum over management

## Technology Stack
- Frontend: React + TypeScript + Vite
- State: Zustand + WebSocket + Redis
- Backend: Node.js + PostgreSQL
- Real-time: Redis + WebSocket
- Search: Elasticsearch

## Key Systems

### 1. Momentum Engine
```typescript
interface MomentumState {
  spaces: FluidSpace[];
  focus: FocusLevel;
  energy: number;
  context: ContextMap;
  velocity: number;  // How fast user is moving through tasks
}

interface FluidSpace {
  id: string;
  type: 'project' | 'conversation' | 'focus' | 'async';
  energy: number;
  gravity: number;  // How much it pulls related content
  participants: UserState[];
  contextMap: ContextMap;
}
```

### 2. Presence System
```typescript
interface EnhancedPresence {
  id: string;
  user: User;
  state: WorkState;
  focus: FocusLevel;
  context: ContextPoint[];
  interruption: InterruptionPolicy;
}

interface WorkState {
  type: 'deep' | 'collaborative' | 'async' | 'available';
  energy: number;
  duration: number;
  protection: number;
}
```

### 3. Information Engine
```typescript
interface LiveInformation {
  id: string;
  content: any;
  context: ContextMap;
  evolution: ChangeHistory[];
  relevance: RelevanceScore;
  connections: Connection[];
}

interface ContextMap {
  points: ContextPoint[];
  spaces: FluidSpace[];
  momentum: MomentumState;
}
```

### 4. Flow Protection
```typescript
interface FlowState {
  user: User;
  level: number;
  context: ContextMap;
  protection: ProtectionPolicy;
  recovery: RecoveryPoint[];
}

interface ProtectionPolicy {
  interruption: InterruptionLevel;
  notification: NotificationPolicy;
  transition: TransitionPolicy;
}
```

## Real-time Architecture
1. WebSocket for live updates
2. Redis for state synchronization
3. PostgreSQL for persistence
4. Elasticsearch for context search

## State Management
- Client: Zustand (fluid UI state)
- Real-time: Redis (shared state)
- Persistence: PostgreSQL (history)
- Search: Elasticsearch (context)

## Performance Optimizations
- Predictive loading
- State preservation
- Momentum maintenance
- Context caching

## Security
- End-to-end encryption
- State privacy
- Context isolation
- Space protection

## MVP Components (Day 1)
1. Basic Momentum Engine
2. Simple Presence System
3. Core Information Management
4. Essential Flow Protection

## Scaling Considerations
- Horizontal scaling of WebSocket
- Redis cluster for real-time
- PostgreSQL sharding
- CDN for static assets 