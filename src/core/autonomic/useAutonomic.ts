import { useEffect, useRef, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { AutonomicSystem } from './index';
import { useDeployment } from '../protection/DeployGuard';
import { FlowState, NaturalPattern } from '../types/base';

export function useAutonomic() {
  const systemRef = useRef<AutonomicSystem>();
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const { isProtected } = useDeployment();

  useEffect(() => {
    if (!systemRef.current) {
      systemRef.current = new AutonomicSystem();
    }

    const subscription = systemRef.current.observeFlow().subscribe(state => {
      setFlowState(state);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const system = systemRef.current;
    if (!system || !isProtected) return;

    const interval = setInterval(() => {
      system.maintainHarmony();
    }, 1618); // Golden ratio in ms

    return () => clearInterval(interval);
  }, [isProtected]);

  const evolvePattern = (pattern: NaturalPattern) => {
    systemRef.current?.evolvePattern(pattern);
  };

  const protectState = () => {
    systemRef.current?.protectState();
  };

  const observeFlow = () => {
    return systemRef.current?.observeFlow() ?? new BehaviorSubject<FlowState | null>(null);
  };

  return {
    flowState,
    evolvePattern,
    protectState,
    observeFlow
  };
} 