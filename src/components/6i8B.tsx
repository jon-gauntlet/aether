import React, { useEffect, useState } from 'react';
import { SystemIntegration } from '../core/integration/SystemIntegration';
import styled from 'styled-components';

interface Props {
  integration: SystemIntegration;
}

interface Metrics {
  hyperfocus: {
    active: boolean;
    intensity: number;
    duration: number;
    quality: number;
  };
  energy: {
    current: number;
    recovery_rate: number;
    efficiency: number;
    sustained_duration: number;
  };
  flow: {
    protection: number;
    depth: number;
  };
}

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
  background: var(--background);
`;

const MetricCard = styled.div<{ active?: boolean }>`
  background: ${props => props.active ? 'var(--accent-light)' : 'var(--background-accent)'};
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;

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
`;

const MetricLabel = styled.div`
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

export const SystemDashboard: React.FC<Props> = ({ integration }) => {
  const [metrics, setMetrics] = useState<Metrics>({
    hyperfocus: {
      active: false,
      intensity: 0,
      duration: 0,
      quality: 0
    },
    energy: {
      current: 1,
      recovery_rate: 0.05,
      efficiency: 0.8,
      sustained_duration: 0
    },
    flow: {
      protection: 0.5,
      depth: 0.6
    }
  });

  useEffect(() => {
    const subs = [
      integration.getHyperfocusMetrics().subscribe(hyperfocusMetrics => {
        setMetrics(m => ({ ...m, hyperfocus: hyperfocusMetrics }));
      }),
      integration.getEnergyMetrics().subscribe(energyMetrics => {
        setMetrics(m => ({ ...m, energy: energyMetrics }));
      }),
      integration.getFlowMetrics().subscribe(flowMetrics => {
        setMetrics(m => ({ 
          ...m, 
          flow: {
            protection: flowMetrics.protection,
            depth: flowMetrics.depth
          }
        }));
      })
    ];

    return () => subs.forEach(sub => sub.unsubscribe());
  }, [integration]);

  return (
    <DashboardContainer>
      <MetricCard active={metrics.hyperfocus.active}>
        <MetricHeader>Hyperfocus State</MetricHeader>
        <MetricLabel>
          <span>Intensity</span>
          <span>{Math.round(metrics.hyperfocus.intensity * 100)}%</span>
        </MetricLabel>
        <MetricValue value={metrics.hyperfocus.intensity} />
        
        <MetricLabel>
          <span>Quality</span>
          <span>{Math.round(metrics.hyperfocus.quality * 100)}%</span>
        </MetricLabel>
        <MetricValue value={metrics.hyperfocus.quality} />
        
        <MetricLabel>
          <span>Duration</span>
          <span>{Math.round(metrics.hyperfocus.duration)} min</span>
        </MetricLabel>
      </MetricCard>

      <MetricCard>
        <MetricHeader>Energy System</MetricHeader>
        <MetricLabel>
          <span>Current Energy</span>
          <span>{Math.round(metrics.energy.current * 100)}%</span>
        </MetricLabel>
        <MetricValue value={metrics.energy.current} />
        
        <MetricLabel>
          <span>Recovery Rate</span>
          <span>{Math.round(metrics.energy.recovery_rate * 100)}%</span>
        </MetricLabel>
        <MetricValue value={metrics.energy.recovery_rate} />
        
        <MetricLabel>
          <span>Efficiency</span>
          <span>{Math.round(metrics.energy.efficiency * 100)}%</span>
        </MetricLabel>
        <MetricValue value={metrics.energy.efficiency} />
        
        <MetricLabel>
          <span>Sustained Duration</span>
          <span>{Math.round(metrics.energy.sustained_duration)} hrs</span>
        </MetricLabel>
      </MetricCard>

      <MetricCard>
        <MetricHeader>Flow Protection</MetricHeader>
        <MetricLabel>
          <span>Protection Level</span>
          <span>{Math.round(metrics.flow.protection * 100)}%</span>
        </MetricLabel>
        <MetricValue value={metrics.flow.protection} />
        
        <MetricLabel>
          <span>Flow Depth</span>
          <span>{Math.round(metrics.flow.depth * 100)}%</span>
        </MetricLabel>
        <MetricValue value={metrics.flow.depth} />
      </MetricCard>
    </DashboardContainer>
  );
}; 