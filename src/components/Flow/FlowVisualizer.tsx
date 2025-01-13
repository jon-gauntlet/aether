


import { FlowState, detectFlowState, shouldPreventInterruption, generateRecoveryPath } from '@/core/types/system';


// Error boundary for flow protection



  padding: {({ theme }) => theme.spacing.lg};
  background: {({ theme }) => theme.colors.surface};
border-radius: {({ theme }) => theme.radii.lg};
border: 1px olid $({ theme }) => theme.colors.warning};
`;

interface FlowVisualizerProps {
  flowState: FlowState;
  history?: FlowState[];
}

const ;

const MetricContainer = styled.div<{ theme: Theme }>`
  margin: {({ theme }) => theme.spacing.md} 0;
`;

const MetricBar = styled.div<{ value: number; theme: Theme }>`
  width: {({ value }) => value * 100}%; undefined
  height: 4px;
  background: {({ theme }) => theme.colors.primary};
border-radius: 2px;
transition: width 0.3s ease;
`;

const OptimizationBadge = styled.div<{ theme: Theme }>`
  display: inline-block;
  padding: {({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: {({ theme }) => theme.colors.primary};
  color: {({ theme }) => theme.colors.text};
border-radius: {({ theme }) => theme.radii.full};
font-size: 0.875rem;
margin-left: {({ theme }) => theme.spacing.sm};
`;

const ConfidenceBadge = styled.div<{ confidence: number; theme: Theme }>`
  display: inline-block;
  padding: {({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background: {({ theme, confidence }) => {
    if (confidence >= 0.8) return theme.colors.success;
    if (confidence >= 0.6) return theme.colors.warning;
    return theme.colors.error;
  }};
  color: {({ theme }) => theme.colors.text};
border-radius: {({ theme }) => theme.radii.full};
font-size: 0.875rem;
margin-left: {({ theme }) => theme.spacing.sm};
`;

export const FlowVisualizer: React.FC<FlowVisualizerProps> = React.memo(({ flowState, history = [] }) => {
  const { protectState } = useAutonomic();
  const flowDetection = React.useMemo(() => detectFlowState(flowState, history), [flowState, history]);
  const isProtected = React.useMemo(() => shouldPreventInterruption(flowState), [flowState]);
  const recoveryPath = React.useMemo(() => 
    generateRecoveryPath(flowState, flowDetection.type), [flowState, flowDetection.type]);

  // Flow protection effect
  React.useEffect(() => {
    const protect = async () => {
      try {
        await protectState();
      } catch (error) {
        console.error('Flow protection error:', error);
      }
    };
    protect();
  }, [protectState]);

  // Flow state validation and optimization
  React.useEffect(() => {
    if (!flowState || typeof flowState.type !== 'string') {
      console.error('Invalid flow state detected');
      protectState();
      return;
    }

    if (flowState.metrics.energy < 0.2) {
      console.warn('Low energy state detected');
    }

    if (isProtected) {
      console.log('Flow protection active - preventing interruptions');
    }
  }, [flowState, protectState, isProtected]);

  const renderSpaces = React.useCallback(() => {
    if (!flowState.spaces) return null;
    return flowState.spaces.map((space) => (
      <div key={space.id}>
        <div>{space.name}</div>
        <MetricBar value={space.energy} />
      </div>
    ));
  }, [flowState.spaces]);

  const renderPatterns = React.useCallback(() => {
    if (!flowState.patterns) return null;
    return flowState.patterns.map((pattern) => (
      <div key={pattern.id}>
        <div>{pattern.name}</div>
        <MetricBar value={pattern.strength} />
      </div>
    ));
  }, [flowState.patterns]);

  const renderResonance = React.useCallback(() => {
    if (!flowState.resonance) return null;
    return (
      <MetricContainer>
        <div>Frequency: {flowState.resonance.frequency}</div>
        <MetricBar value={flowState.resonance.amplitude} />
        <div>Phase: {flowState.resonance.phase}</div>
      </MetricContainer>
    );
  }, [flowState.resonance]);

  const renderOptimization = React.useCallback(() => {
    if (!flowDetection.recommendation) return null;
    const { type, intensity, duration } = flowDetection.recommendation;
    return (
      <MetricContainer>
        <h4>Optimization</h4>
        <div>
          Type: {type}
          <OptimizationBadge>{Math.round(intensity * 100)}%</OptimizationBadge>
          <ConfidenceBadge confidence={flowDetection.confidence}>
            {Math.round(flowDetection.confidence * 100)}%
          </ConfidenceBadge>
        </div>
        <div>Duration: {Math.round(duration / 1000 / 60)}min</div>
      </MetricContainer>
    );
  }, [flowDetection]);

  const renderRecoveryPath = React.useCallback(() => {
    if (!recoveryPath.length) return null;
    return (
      <MetricContainer>
        <h4>Recovery Path</h4>
        {recoveryPath.map((step, index) => (
          <div key={index}>
            {step.type} - {Math.round(step.duration / 1000 / 60)}min @ {Math.round(step.intensity * 100)}%
          </div>
        ))}
      </MetricContainer>
    );
  }, [recoveryPath]);

  return (
    <FlowErrorBoundary>
      <FlowContainer isProtected={isProtected}>
        <h3>
          Flow State: {flowState.type}
          {isProtected && <OptimizationBadge>Protected</OptimizationBadge>}
        </h3>
        
        <MetricContainer>
          <h4>Metrics</h4>
          <div>Velocity: {flowState.metrics.velocity}</div>
          <MetricBar value={flowState.metrics.velocity} />
          <div>Momentum: {flowState.metrics.momentum}</div>
          <MetricBar value={flowState.metrics.momentum} />
          <div>Energy: {flowState.metrics.energy}</div>
          <MetricBar value={flowState.metrics.energy} />
        </MetricContainer>

        {renderOptimization()}
        {renderRecoveryPath()}

        {flowState.spaces && (
          <MetricContainer>
            <h4>Spaces</h4>
            {renderSpaces()}
          </MetricContainer>
        )}

        {flowState.patterns && (
          <MetricContainer>
            <h4>Patterns</h4>
            {renderPatterns()}
          </MetricContainer>
        )}

        {flowState.resonance && (
          <MetricContainer>
            <h4>Resonance</h4>
            {renderResonance()}
          </MetricContainer>
        )}
      </FlowContainer>
    </FlowErrorBoundary>
  );
}); 