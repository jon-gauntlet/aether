import React, { useEffect, useState } from 'react';
import { SystemIntegration } from '../core/integration/SystemIntegration';
import { SpaceType } from '../core/space/SpaceTransition';
import styled from 'styled-components';

interface Props {
  integration: SystemIntegration;
}

interface SystemState {
  presence: {
    level: number;
    resonance: number;
    depth: number;
  };
  protection: {
    natural: boolean;
    strength: number;
    adaptability: number;
  };
  flow: {
    quality: number;
    sustainability: number;
    harmony: number;
  };
  energy: {
    current: number;
    recovery: number;
    balance: number;
  };
  space: {
    type: SpaceType;
    stillness: number;
    presence: number;
    resonance: number;
    protection: number;
  };
  transition: {
    naturalness: number;
    harmony: number;
    stability: number;
  };
}

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
  background: var(--background);
  min-height: 100vh;
`;

const MetricCard = styled.div<{ harmony?: number }>`
  background: ${props => `linear-gradient(135deg, 
    var(--background-accent) 0%,
    ${props.harmony && props.harmony > 0.7 ? 'var(--accent-light)' : 'var(--background-accent)'} 100%)`};
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: all 0.5s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.harmony && props.harmony > 0.8 
      ? 'var(--accent)' 
      : 'var(--background-accent)'};
    transition: all 0.5s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
`;

const MetricHeader = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text-primary);
  letter-spacing: 0.5px;
`;

const MetricValue = styled.div<{ value: number }>`
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--accent) ${props => props.value * 100}%,
    var(--background) ${props => props.value * 100}%
  );
  border-radius: 2px;
  margin: 0.5rem 0;
  transition: all 0.3s ease;
`;

const MetricLabel = styled.div`
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.25rem;
  letter-spacing: 0.3px;
`;

const HarmonyIndicator = styled.div<{ level: number }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.level > 0.7 ? 'var(--accent)' : 'var(--background-accent)'};
  box-shadow: ${props => props.level > 0.7 ? '0 0 8px var(--accent)' : 'none'};
  transition: all 0.5s ease;
`;

interface SpaceCardProps {
  spaceType: SpaceType;
  harmony: number;
}

const SpaceCard = styled(MetricCard)<SpaceCardProps>`
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => {
      switch (props.spaceType) {
        case 'sanctuary': return 'radial-gradient(circle, rgba(147, 112, 219, 0.1) 0%, transparent 70%)';
        case 'library': return 'radial-gradient(circle, rgba(72, 209, 204, 0.1) 0%, transparent 70%)';
        case 'garden': return 'radial-gradient(circle, rgba(144, 238, 144, 0.1) 0%, transparent 70%)';
        case 'workshop': return 'radial-gradient(circle, rgba(255, 165, 0, 0.1) 0%, transparent 70%)';
        default: return 'radial-gradient(circle, rgba(176, 196, 222, 0.1) 0%, transparent 70%)';
      }
    }};
    transition: all 0.5s ease;
    z-index: 0;
  }
`;

const SpaceTypeIndicator = styled.div<{ type: SpaceType }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  text-transform: capitalize;
  background: ${props => {
    switch (props.type) {
      case 'sanctuary': return 'rgba(147, 112, 219, 0.2)';
      case 'library': return 'rgba(72, 209, 204, 0.2)';
      case 'garden': return 'rgba(144, 238, 144, 0.2)';
      case 'workshop': return 'rgba(255, 165, 0, 0.2)';
      default: return 'rgba(176, 196, 222, 0.2)';
    }
  }};
  color: var(--text-primary);
`;

export const SystemDashboard: React.FC<Props> = ({ integration }) => {
  const [state, setState] = useState<SystemState>({
    presence: {
      level: 0.7,
      resonance: 0.6,
      depth: 0.5
    },
    protection: {
      natural: true,
      strength: 0.6,
      adaptability: 0.8
    },
    flow: {
      quality: 0.7,
      sustainability: 0.8,
      harmony: 0.7
    },
    energy: {
      current: 0.9,
      recovery: 0.8,
      balance: 0.7
    },
    space: {
      type: 'garden',
      stillness: 0.7,
      presence: 0.8,
      resonance: 0.6,
      protection: 0.5
    },
    transition: {
      naturalness: 0.8,
      harmony: 0.7,
      stability: 0.6
    }
  });

  useEffect(() => {
    const subscriptions = [
      integration.getPresenceMetrics().subscribe(metrics => {
        setState(s => ({
          ...s,
          presence: {
            level: metrics.presence,
            resonance: metrics.resonance,
            depth: metrics.depth
          }
        }));
      }),
      integration.getFlowMetrics().subscribe(metrics => {
        setState(s => ({
          ...s,
          flow: metrics
        }));
      }),
      integration.getEnergyMetrics().subscribe(metrics => {
        setState(s => ({
          ...s,
          energy: metrics
        }));
      }),
      integration.getSpaceMetrics().subscribe(metrics => {
        setState(s => ({
          ...s,
          space: metrics
        }));
      }),
      integration.getTransitionMetrics().subscribe(metrics => {
        setState(s => ({
          ...s,
          transition: metrics
        }));
      })
    ];

    return () => subscriptions.forEach(sub => sub.unsubscribe());
  }, [integration]);

  const calculateHarmony = (metrics: { [key: string]: number | string }): number => {
    const numericValues = Object.values(metrics).filter(val => typeof val === 'number') as number[];
    const goldenRatio = 0.618;
    return numericValues.reduce((sum, val, i) => {
      const weight = Math.pow(goldenRatio, i);
      return sum + (val * weight);
    }, 0) / numericValues.length;
  };

  return (
    <DashboardContainer>
      <MetricCard harmony={calculateHarmony(state.presence)}>
        <MetricHeader>Natural Presence</MetricHeader>
        <HarmonyIndicator level={calculateHarmony(state.presence)} />
        
        <MetricLabel>
          <span>Awareness</span>
          <span>{Math.round(state.presence.level * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.presence.level} />
        
        <MetricLabel>
          <span>Connection</span>
          <span>{Math.round(state.presence.resonance * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.presence.resonance} />
        
        <MetricLabel>
          <span>Depth</span>
          <span>{Math.round(state.presence.depth * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.presence.depth} />
      </MetricCard>

      <MetricCard harmony={calculateHarmony(state.flow)}>
        <MetricHeader>Living Flow</MetricHeader>
        <HarmonyIndicator level={calculateHarmony(state.flow)} />
        
        <MetricLabel>
          <span>Quality</span>
          <span>{Math.round(state.flow.quality * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.flow.quality} />
        
        <MetricLabel>
          <span>Sustainability</span>
          <span>{Math.round(state.flow.sustainability * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.flow.sustainability} />
        
        <MetricLabel>
          <span>Harmony</span>
          <span>{Math.round(state.flow.harmony * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.flow.harmony} />
      </MetricCard>

      <MetricCard harmony={calculateHarmony(state.energy)}>
        <MetricHeader>Vital Energy</MetricHeader>
        <HarmonyIndicator level={calculateHarmony(state.energy)} />
        
        <MetricLabel>
          <span>Current</span>
          <span>{Math.round(state.energy.current * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.energy.current} />
        
        <MetricLabel>
          <span>Renewal</span>
          <span>{Math.round(state.energy.recovery * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.energy.recovery} />
        
        <MetricLabel>
          <span>Balance</span>
          <span>{Math.round(state.energy.balance * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.energy.balance} />
      </MetricCard>

      <SpaceCard 
        harmony={calculateHarmony(state.space)} 
        spaceType={state.space.type}
      >
        <MetricHeader>Living Space</MetricHeader>
        <SpaceTypeIndicator type={state.space.type}>
          {state.space.type}
        </SpaceTypeIndicator>
        
        <MetricLabel>
          <span>Stillness</span>
          <span>{Math.round(state.space.stillness * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.space.stillness} />
        
        <MetricLabel>
          <span>Presence</span>
          <span>{Math.round(state.space.presence * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.space.presence} />
        
        <MetricLabel>
          <span>Resonance</span>
          <span>{Math.round(state.space.resonance * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.space.resonance} />
        
        <MetricLabel>
          <span>Protection</span>
          <span>{Math.round(state.space.protection * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.space.protection} />
      </SpaceCard>

      <MetricCard harmony={calculateHarmony(state.transition)}>
        <MetricHeader>Natural Flow</MetricHeader>
        <HarmonyIndicator level={calculateHarmony(state.transition)} />
        
        <MetricLabel>
          <span>Naturalness</span>
          <span>{Math.round(state.transition.naturalness * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.transition.naturalness} />
        
        <MetricLabel>
          <span>Harmony</span>
          <span>{Math.round(state.transition.harmony * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.transition.harmony} />
        
        <MetricLabel>
          <span>Stability</span>
          <span>{Math.round(state.transition.stability * 100)}%</span>
        </MetricLabel>
        <MetricValue value={state.transition.stability} />
      </MetricCard>
    </DashboardContainer>
  );
}; 