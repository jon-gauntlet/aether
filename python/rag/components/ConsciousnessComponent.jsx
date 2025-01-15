import React from 'react';
import styled from 'styled-components';

const ConsciousnessContainer = styled.div`
  padding: ${({ theme }) => theme.space.xl};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme, isCoherent }) =>
    isCoherent
      ? `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}20)`
      : theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  overflow: hidden;

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
    opacity: ${({ isCoherent }) => (isCoherent ? 1 : 0)};
    transition: opacity ${({ theme }) => theme.transitions.normal};
    animation: ${({ isCoherent }) => isCoherent ? 'breathe 4s ease-in-out infinite' : 'none'};
  }

  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.03); opacity: 1; }
  }
`;

const ConsciousnessCanvas = styled.canvas`
  width: 100%;
  height: 200px;
  margin: ${({ theme }) => theme.space.md} 0;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.background}40;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.lg};
`;

const Metric = styled.div`
  padding: ${({ theme }) => theme.space.md};
  margin-bottom: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const Title = styled.h2<Props>`
  margin: 0;
  color: ${({ theme }) => theme.colors.textAlt};
  font-size: ${({ theme }) => theme.space.lg};
`;

const StateIndicator = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space.md};
  background: ${({ theme, status }) => {
    switch (status) {
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.error;
    }
  }};
  color: ${({ theme }) => theme.colors.textAlt};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const ConsciousnessComponent = ({ consciousness, fields, isCoherent }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawConsciousness = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw consciousness field
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) / 3;
      
      // Draw expanding circles
      for (let i = 0; i < 5; i++) {
        const radius = maxRadius * (0.4 + i * 0.15);
        const alpha = (1 - i * 0.2) * (isCoherent ? 1 : 0.5);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${isCoherent ? '99, 102, 241' : '148, 163, 184'}, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw consciousness particles
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const radius = maxRadius * (0.8 + Math.sin(Date.now() * 0.001 + i) * 0.2);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = isCoherent ? '#8B5CF640' : '#94A3B840';
        ctx.fill();
      }
    };

    const animate = () => {
      drawConsciousness();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animate);
    };
  }, [consciousness, isCoherent]);

  return (
    <Container>
      <Header>
        <Title>Natural Consciousness</Title>
      </Header>
      <Content>
        <Status status="success">
          System is naturally flowing
        </Status>
      </Content>
    </Container>
  );
}; 