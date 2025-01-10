# Focus Tools (Gauntlet Command Suite)

## Overview
The Focus Tools, implemented through the `g` command suite, provide direct user control over focus states, work sessions, and productivity tracking. While separate from the Invisible Infrastructure, these tools feed data and state information into the larger system.

## Core Components

### 1. Focus State Management
- **Deep Work Mode**: `g deep`
  - Toggles system-wide deep work optimizations
  - Integrates with `gauntlet-focus.service`

- **Flow State**: `g flow`
  - Manages flow state optimizations
  - Feeds state to context management system

### 2. Time Management
- **Focus Timer**: `g timer [minutes]`
  - Default: 25-minute sessions
  - Integrates with stats collection
  - Updates system metrics

- **Pomodoro**: `g pomodoro`
  - Structured work sessions
  - Break management: `g break`

### 3. Data Collection
- **Stats Tracking**: `g stats`
  - Location: `/home/jon/.local/share/gauntlet/daily_stats.json`
  - Metrics feed into system optimization
  - Historical performance data

- **Session State**: `/home/jon/.local/state/gauntlet/focus_session.json`
  - Real-time session tracking
  - Mode status monitoring
  - Integration point for system services

### 4. Knowledge Management
- **Quick Notes**: `g note`
  - Location: `$GAUNTLET_DATA_DIR/notes/`
  - Daily markdown files
  - Context preservation

- **BrainLifts**: `g brain`
  - Location: `/home/jon/brainlifts/`
  - Structured thought capture
  - Knowledge crystallization

## Integration Points with Invisible Infrastructure

### 1. Data Flow
- Focus session metrics → Context Management
- State changes → Resource Optimization
- Performance data → System Evolution

### 2. Service Integration
- `gauntlet-focus.service`: Bridge to infrastructure
- `gauntlet-optimizer.service`: Performance tuning
- Context preservation services

### 3. Resource Management
- Deep mode triggers system-wide optimizations
- Flow state affects resource allocation
- Session data influences scheduling

## Data Structures

### Daily Stats
```json
{
  "YYYY-MM-DD": {
    "timer_starts": <count>,
    "focus_sessions": <count>,
    "notes_added": <count>,
    "brainlifts_created": <count>
  }
}
```

### Session State
```json
{
  "start_time": "ISO-8601",
  "deep_mode": boolean,
  "flow_mode": boolean
}
```

## Remember
- Tools provide explicit control
- Data feeds larger system
- States influence infrastructure
- Integration is bidirectional 