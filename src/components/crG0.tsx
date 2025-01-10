import React from 'react';
import { Container } from './components/layout/Container';
import { useAutonomicDevelopment } from './hooks/useAutonomicDevelopment';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const AppContainer = styled(motion.div)`
  min-height: 100vh;
  background: var(--background);
  color: var(--text);
`;

const Header = styled(motion.header)`
  padding: 2rem;
  text-align: center;
  background: var(--background-accent);
  color: var(--text-accent);
`;

const Title = styled(motion.h1)`
  font-size: 2.5rem;
  margin: 0;
  font-weight: 300;
  letter-spacing: 0.1em;
`;

const Subtitle = styled(motion.p)`
  font-size: 1.1rem;
  margin: 1rem 0 0;
  opacity: 0.8;
`;

const Content = styled(motion.div)`
  padding: var(--space-lg);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-lg);
`;

const Card = styled(motion.div)`
  background: var(--background-accent);
  border-radius: 8px;
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
`;

const Metric = styled.div`
  margin-bottom: var(--space-md);
  
  h3 {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
  }
  
  .value {
    font-size: 1.5rem;
    font-weight: 500;
  }
`;

const ProgressBar = styled.div<{ $value: number; $color?: string }>`
  width: 100%;
  height: 4px;
  background: var(--background);
  border-radius: 2px;
  overflow: hidden;
  margin-top: var(--space-xs);
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.$value * 100}%;
    height: 100%;
    background: ${props => props.$color || 'var(--accent)'};
    transition: width var(--transition-normal);
  }
`;

const App: React.FC = () => {
  const { flowState, patternMetrics, energyState } = useAutonomicDevelopment();

  return (
    <AppContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Title
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Aether
        </Title>
        <Subtitle
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Natural System Evolution
        </Subtitle>
      </Header>

      <Container>
        <Content>
          <Card
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Metric>
              <h3>Flow Depth</h3>
              <div className="value">{Math.round(flowState.depth * 100)}%</div>
              <ProgressBar $value={flowState.depth} />
            </Metric>
            <Metric>
              <h3>Flow Protection</h3>
              <div className="value">{Math.round(flowState.protection.level * 100)}%</div>
              <ProgressBar 
                $value={flowState.protection.level}
                $color={`hsl(${flowState.protection.level * 120}, 70%, 50%)`}
              />
            </Metric>
          </Card>

          <Card
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <Metric>
              <h3>Pattern Coherence</h3>
              <div className="value">{Math.round(patternMetrics.coherence * 100)}%</div>
              <ProgressBar $value={patternMetrics.coherence} />
            </Metric>
            <Metric>
              <h3>Pattern Evolution</h3>
              <div className="value">{Math.round(patternMetrics.evolution * 100)}%</div>
              <ProgressBar 
                $value={patternMetrics.evolution}
                $color={`hsl(${patternMetrics.evolution * 180}, 70%, 50%)`}
              />
            </Metric>
          </Card>

          <Card
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <Metric>
              <h3>Energy Level</h3>
              <div className="value">{Math.round(energyState.current * 100)}%</div>
              <ProgressBar $value={energyState.current} />
            </Metric>
            <Metric>
              <h3>System Efficiency</h3>
              <div className="value">{Math.round(energyState.efficiency * 100)}%</div>
              <ProgressBar 
                $value={energyState.efficiency}
                $color={`hsl(${energyState.efficiency * 120}, 70%, 50%)`}
              />
            </Metric>
          </Card>
        </Content>
      </Container>
    </AppContainer>
  );
};

export default App;