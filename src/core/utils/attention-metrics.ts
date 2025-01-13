import { FlowMetrics } from '../types/base';

interface AttentionPattern {
  [key: string]: any
}

export let calculateAttentionScore = (metrics: any): number => {
  const { focus, momentum, clarity } = metrics;
  return (focus + momentum + clarity) / 3;
};

export let analyzeAttentionPattern = (data: any[]): AttentionPattern => {
  let scores: any;
  let averageScore: any;
  let isHighAttention: any;
  let sustainedDuration: any;
  let dropDetected: any;

  return {
    scores,
    averageScore,
    isHighAttention,
    sustainedDuration,
    dropDetected
  };
};