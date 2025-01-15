import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  overflow: hidden;
`;

const ActiveContainer = styled(Container)`
  background: ${({ theme }) =>
    `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.secondary}15)`};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      ${({ theme }) => theme.colors.primary}10,
      ${({ theme }) => theme.colors.secondary}10
    );
    opacity: 1;
    transition: opacity ${({ theme }) => theme.transitions.normal};
    animation: autonomic 4s ease-in-out infinite;
  }

  @keyframes autonomic {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.02); opacity: 1; }
  }
`;

const AutonomicCanvas = styled.canvas`
  width: 100%;
  height: 180px;
  margin: ${({ theme }) => theme.space.md} 0;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.background}40;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.lg};
`;

const Metric = styled.div`
  padding: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Status = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space.md};
  color: ${({ theme, isActive }) =>
    isActive ? theme.colors.primary : theme.colors.textAlt};
`;

const ActiveStatus = styled(Status)`
  color: ${({ theme }) => theme.colors.primary};
`;

const InactiveStatus = styled(Status)`
  color: ${({ theme }) => theme.colors.textAlt};
`;

export const AutonomicDevelopment = ({ flowStates, isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawAutonomic = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw flow state timeline
      const timelineHeight = height * 0.8;
      const timelineY = height * 0.1;
      const stateWidth = width / Math.max(10, flowStates.length);

      flowStates.forEach((state, index) => {
        const x = index * stateWidth;
        const stateHeight = timelineHeight * state.metrics.velocity;

        // Draw state bar
        ctx.fillStyle = isActive ? '#6366F140' : '#94A3B840';
        ctx.fillRect(
          x,
          timelineY + timelineHeight - stateHeight,
          stateWidth * 0.8,
          stateHeight
        );

        // Draw state indicator
        ctx.beginPath();
        ctx.arc(
          x + stateWidth * 0.4,
          timelineY + timelineHeight - stateHeight,
          4,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = isActive ? '#6366F1' : '#94A3B8';
        ctx.fill();
      });

      // Draw timeline
      ctx.beginPath();
      ctx.moveTo(0, timelineY + timelineHeight);
      ctx.lineTo(width, timelineY + timelineHeight);
      ctx.strokeStyle = isActive ? '#6366F120' : '#94A3B820';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const animate = () => {
      drawAutonomic();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animate);
    };
  }, [flowStates, isActive]);

  const currentState = flowStates[flowStates.length - 1];
  const averageMetrics = flowStates.reduce(
    (acc, state) => ({
      velocity: acc.velocity + state.metrics.velocity,
      momentum: acc.momentum + state.metrics.momentum,
      resistance: acc.resistance + state.metrics.resistance,
      conductivity: acc.conductivity + state.metrics.conductivity,
    }),
    { velocity: 0, momentum: 0, resistance: 0, conductivity: 0 }
  );

  const stateCount = flowStates.length;
  Object.keys(averageMetrics).forEach(key => {
    averageMetrics[key] /= stateCount;
  });

  const ContainerComponent = isActive ? ActiveContainer : Container;
  const StatusComponent = isActive ? ActiveStatus : InactiveStatus;

  return (
    <ContainerComponent>
      <Title>Autonomic Development</Title>
      <StatusComponent>
        Active Flow States: {flowStates.length}
      </StatusComponent>
      <AutonomicCanvas ref={canvasRef} />
      <MetricsGrid>
        <Metric value={averageMetrics.velocity * 100}>
          Velocity: {(averageMetrics.velocity * 100).toFixed(0)}%
        </Metric>
        <Metric value={averageMetrics.momentum * 100}>
          Momentum: {(averageMetrics.momentum * 100).toFixed(0)}%
        </Metric>
        <Metric value={averageMetrics.resistance * 100}>
          Resistance: {(averageMetrics.resistance * 100).toFixed(0)}%
        </Metric>
        <Metric value={averageMetrics.conductivity * 100}>
          Conductivity: {(averageMetrics.conductivity * 100).toFixed(0)}%
        </Metric>
      </MetricsGrid>
    </ContainerComponent>
  );
}; 