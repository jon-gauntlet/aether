import { useEffect, useState } from 'react';
import { Move } from './flow/move';
import { Settle } from './rest';
import { Level } from './types/core';

interface RestState {
  quiet: Level;
  ready: Level;
  open: Level;
  shouldRest: boolean;
}

// One place to settle
const settle = new Settle(new Move());

// Know when to rest
export function useRest(): RestState & {
  calm: () => void;
} {
  const [state, setState] = useState<RestState>({
    quiet: 1,
    ready: 1,
    open: 1,
    shouldRest: false
  });

  useEffect(() => {
    const sub = settle.see().subscribe(rest => {
      setState({
        ...rest,
        shouldRest: settle.check()
      });
    });
    return () => sub.unsubscribe();
  }, []);

  return {
    ...state,
    calm: () => settle.calm()
  };
}

// Use this to help things rest
export function useAutoRest(
  onRest?: () => void,
  checkInterval = 5000
) {
  const { shouldRest, calm } = useRest();

  useEffect(() => {
    if (!onRest) return;

    const timer = setInterval(() => {
      if (shouldRest) {
        calm();
        onRest();
      }
    }, checkInterval);

    return () => clearInterval(timer);
  }, [shouldRest, onRest, checkInterval]);
} 