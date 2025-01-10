# ChatGenius Technical Architecture

## Core Technologies
- React + TypeScript (Frontend)
- Node.js + WebSocket (Backend)
- PostgreSQL (Primary Database)
- Redis (Real-time State)

## Key Systems

### 1. Space Engine
```typescript
interface Space {
  id: string;
  type: 'fluid' | 'fixed' | 'temporary';
  energy: number;  // Current activity level
  focus: number;   // Depth of discussions
  context: ContextMap;
  participants: UserState[];
}
```

### 2. Context Engine
```typescript
interface ContextPoint {
  id: string;
  timestamp: Date;
  type: 'message' | 'thread' | 'decision' | 'focus';
  depth: number;
  energy: number;
  metadata: ContextMetadata;
}

interface ContextMap {
  points: ContextPoint[];
  connections: Connection[];
  state: StateSnapshot;
}
```

### 3. Focus System
```typescript
interface FocusState {
  level: number;        // 0-100
  mode: WorkMode;       // coding, meeting, reading, etc.
  interruption: InterruptionPolicy;
  context: ContextPoint[];
}

interface WorkMode {
  type: string;
  energy: number;
  protection: number;   // How much to protect this state
}
```

### 4. Visual Engine
```typescript
interface VisualState {
  spaces: SpaceLayout[];
  energy: HeatMap;
  focus: DepthMap;
  motion: AnimationState;
}

interface HeatMap {
  points: EnergyPoint[];
  intensity: number;
  decay: number;
}
```

## Data Flow
1. Real-time events flow through WebSocket
2. Context Engine processes and categorizes
3. Space Engine updates fluid spaces
4. Focus System manages interruptions
5. Visual Engine renders updates

## State Management
- Zustand for client state
- Redis for real-time sync
- PostgreSQL for persistence
- Context preservation in both memory and disk

## Performance Considerations
- Efficient context switching
- Smooth animations
- Lazy loading of history
- Smart caching of context

## Security
- End-to-end encryption
- Focus state privacy
- Context access control
- Space permissions

## MVP Components (Day 1)
1. Basic Space Engine
2. Simple Context Tracking
3. Focus State Management
4. Essential Visualizations 