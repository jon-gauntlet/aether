import React, { useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { ConsciousnessComponent } from './components/ConsciousnessComponent';
import { FieldComponent } from './components/FieldComponent';
import { PatternVisualization } from './components/PatternVisualization';
import { AutonomicDevelopment } from './components/AutonomicDevelopment';
import { createDefaultField, createDefaultConsciousness, createDefaultPattern, FlowState } from '@/core/types/system';
import { theme } from '@/styles/theme';
import { GlobalStyle } from '@/styles/global';

const AppContainer = styled.div`
  min-height: 100vh;
  padding: ${({ theme }) => theme.space.xl};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: ${({ theme }) => theme.space.xl};
  max-width: 1800px;
  margin: 0 auto;
`;

const defaultField = createDefaultField();
const defaultPattern = createDefaultPattern();
const defaultConsciousness = {
  ...createDefaultConsciousness(),
  fields: [defaultField],
};

const defaultFlowStates: FlowState[] = [
  {
    type: 'RESTING' as const,
    metrics: {
      velocity: 0.3,
      momentum: 0.4,
      resistance: 0.2,
      conductivity: 0.6,
      focus: 0.5,
      energy: 0.7,
      clarity: 0.6,
      quality: 0.5,
    },
    active: false,
    intensity: 0.4,
    duration: 300000,
    timestamp: Date.now() - 600000,
  },
  {
    type: 'FOCUS' as const,
    metrics: {
      velocity: 0.6,
      momentum: 0.7,
      resistance: 0.3,
      conductivity: 0.8,
      focus: 0.8,
      energy: 0.9,
      clarity: 0.7,
      quality: 0.8,
    },
    active: true,
    intensity: 0.7,
    duration: 900000,
    timestamp: Date.now() - 300000,
  },
  {
    type: 'HYPERFOCUS' as const,
    metrics: {
      velocity: 0.9,
      momentum: 0.95,
      resistance: 0.1,
      conductivity: 0.9,
      focus: 1.0,
      energy: 1.0,
      clarity: 0.9,
      quality: 0.95,
    },
    active: true,
    intensity: 1.0,
    duration: 1800000,
    timestamp: Date.now(),
  },
];

export const App = () => {
  const [isFieldActive, setIsFieldActive] = useState(true);
  const [isFieldResonating, setIsFieldResonating] = useState(false);
  const [isPatternActive, setIsPatternActive] = useState(true);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Grid>
          <ConsciousnessComponent
            consciousness={defaultConsciousness}
            fields={[defaultField]}
            isCoherent={isFieldActive}
          />
          <FieldComponent
            field={defaultField}
            isActive={isFieldActive}
            isResonating={isFieldResonating}
          />
          <PatternVisualization
            pattern={defaultPattern}
            isActive={isPatternActive}
          />
          <AutonomicDevelopment
            flowStates={defaultFlowStates}
            isActive={isFieldActive}
          />
        </Grid>
      </AppContainer>
    </ThemeProvider>
  );
}; 