import { useAutonomicDevelopment } from './useAutonomicDevelopment';
import { usePatternLibrary } from './usePatternLibrary';
import { usePatternManager } from './usePatternManager';
import { useAutonomicSystem } from './useAutonomicSystem';
import { AutonomicHooks } from '../types/autonomic';

export function useAutonomic(): AutonomicHooks {
  const development = useAutonomicDevelopment();
  const library = usePatternLibrary();
  const manager = usePatternManager();
  const system = useAutonomicSystem();

  return {
    useAutonomicDevelopment: () => development,
    usePatternLibrary: () => library,
    usePatternManager: () => manager,
    useAutonomicSystem: () => system
  };
} 