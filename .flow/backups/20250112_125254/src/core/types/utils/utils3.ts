import { useEffect, useState } from 'react';
import { Move } from './flow/move';
import { Integrate } from './integrate';
import { Level } from './types/core';

interface Wave {
  depth: Level;
  spread: Level;
  strength: Level;
}

interface WaveActions {
  spread: () => void;
  rest: () => void;
}

// One place to integrate
const integrate = new Integrate(new Move());

// Watch understanding flow
export function useIntegrate(): Wave & WaveActions {
  const [wave, setWave] = useState<Wave>({
    depth: 0.5,
    spread: 0.3,
    strength: 0.7
  });

  useEffect(() => {
    const sub = integrate.see().subscribe(wave => {
      setWave(wave);
    });
    return () => sub.unsubscribe();
  }, []);

  return {
    ...wave,
    spread: () => integrate.spread(),
    rest: () => integrate.rest()
  };
}

// Let understanding flow naturally
export function useAutoIntegrate(
  onFlow?: () => void,
  checkInterval = 10000
) {
  const wave = useIntegrate();

  useEffect(() => {
    if (!onFlow) return;

    const timer = setInterval(() => {
      if (wave.depth > 0.7 && wave.spread > 0.5) {
        wave.spread();
        onFlow();
      }
    }, checkInterval);

    return () => clearInterval(timer);
  }, [wave, onFlow, checkInterval]);

  return {};
}