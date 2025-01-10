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
        {/* Content will be added here */}
      </Container>
    </AppContainer>
  );
};

export default App;