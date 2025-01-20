import { FlowState, ProtectionLevel } from './base';

export interface FlowMetrics {
  // Core metrics
  focus: number;        // 0-1: Current focus level
  momentum: number;     // 0-1: Development velocity
  clarity: number;      // 0-1: Code understanding
  confidence: number;   // 0-1: Solution confidence
  energy: number;       // 0-1: Current energy level
  
  // Protection metrics
  protection: ProtectionLevel;
  recoveryPoints: number;
  backupFrequency: number;
  
  // Performance metrics
  successRate: number;
  quickWins: number;
  batchFixes: number;
  deepFixes: number;
  
  // State tracking
  currentState: FlowState;
  stateChanges: number;
  flowDuration: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  metrics: FlowMetrics;
}

export interface MetricsHistory {
  snapshots: MetricsSnapshot[];
  averages: FlowMetrics;
} 