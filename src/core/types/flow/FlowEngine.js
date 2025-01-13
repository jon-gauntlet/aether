import { FlowMetrics, FlowPattern as BaseFlowPattern, FlowContext as BaseFlowContext } from './FlowSpace';

export type FlowType = 'focus' | 'explore' | 'rest' | 'connect';

export interface FlowPattern extends BaseFlowPattern {
  type: FlowType;
}

export interface FlowContext extends BaseFlowContext {
  type?: FlowType;
  intensity?: number;
  duration?: number;
}

export class FlowEngine {
  private static readonly MIN_INTENSITY = 0.1;
  private static readonly MAX_INTENSITY = 1.0;
  private static readonly DEFAULT_DURATION = 25 * 60 * 1000; // 25 minutes

  public static calculateMetrics(context: FlowContext): FlowMetrics {
    const intensity = context.intensity ?? 0.5;
    const normalizedIntensity = Math.max(
      this.MIN_INTENSITY,
      Math.min(this.MAX_INTENSITY, intensity)
    );

    return {
      velocity: normalizedIntensity,
      focus: normalizedIntensity * 1.2,
      energy: normalizedIntensity * 0.8
    };
  }

  public static validateContext(context: FlowContext): boolean {
    if (context.type && !['focus', 'explore', 'rest', 'connect'].includes(context.type)) {
      return false;
    }

    if (context.intensity && (context.intensity < this.MIN_INTENSITY || context.intensity > this.MAX_INTENSITY)) {
      return false;
    }

    if (context.duration && context.duration <= 0) {
      return false;
    }

    return true;
  }

  public static normalizeContext(context: FlowContext): FlowContext {
    return {
      ...context,
      intensity: context.intensity ?? 0.5,
      duration: context.duration ?? this.DEFAULT_DURATION
    };
  }
} 