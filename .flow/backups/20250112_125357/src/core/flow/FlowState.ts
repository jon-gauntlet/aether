import { useState, useEffect, useCallback, useMemo } from 'react';
import { FlowContext, FlowProtection, FlowStateGuardian } from '../core/flow/FlowStateGuardian';

export interface FlowState {
  context: FlowContext | undefined;
  protection: FlowProtection | undefined;
  metrics: {
    coherence: number;
    stability: number;
    evolution: number;
  };
  status: {
    isProtected: boolean;
    protectionLevel: number;
    recoveryTime: number;
  };
}

export const useFlowState = (contextId: string): FlowState => {
  const [context, setContext] = useState<FlowContext>();
  const [protection, setProtection] = useState<FlowProtection>();
  
  const guardian = useMemo(() => new FlowStateGuardian(), []);

  useEffect(() => {
    const subscriptions = [
      guardian.observeContext(contextId).subscribe(ctx => {
        if (ctx) setContext(ctx);
      }),
      
      guardian.observeProtection(contextId).subscribe(prot => {
        if (prot) setProtection(prot);
      })
    ];

    return () => subscriptions.forEach(sub => sub.unsubscribe());
  }, [contextId, guardian]);

  const metrics = useMemo(() => ({
    coherence: context?.metrics.coherence ?? 0,
    stability: context?.metrics.stability ?? 0,
    evolution: context?.metrics.evolution ?? 0
  }), [context]);

  const status = useMemo(() => ({
    isProtected: protection?.level > 0.5,
    protectionLevel: protection?.level ?? 0,
    recoveryTime: protection?.recovery.baseTime ?? 0
  }), [protection]);

  return {
    context,
    protection,
    metrics,
    status
  };
}; 