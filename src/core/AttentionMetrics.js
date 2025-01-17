import { FlowMetrics } from './types/base';

export interface AttentionMetrics {
  [key: string]: any;
  updateMetrics(momentum: any, clarity: any, ...args: any): number;
  isHighAttention(momentum: any, clarity: any, ...args: any): boolean;
  isLowAttention(momentum: any, clarity: any, ...args: any): boolean;
}

class AttentionMetricsImpl implements AttentionMetrics {
  metrics: any;

  updateMetrics(momentum: any, clarity: any, ...args: any): number {
    const { focus } = this.metrics;
    return (focus + momentum + clarity) / 3;
  }

  isHighAttention(momentum: any, clarity: any, ...args: any): boolean {
    return this.updateMetrics(momentum, clarity, ...args) >= 80;
  }

  isLowAttention(momentum: any, clarity: any, ...args: any): boolean {
    return this.updateMetrics(momentum, clarity, ...args) <= 40;
  }
}