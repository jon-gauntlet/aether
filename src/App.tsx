import React from 'react';
import styled from 'styled-components';
import { IField } from './core/types/base';
import { ConsciousnessState } from './core/types/consciousness/consciousness';
import { ConsciousnessComponent } from './components/ConsciousnessComponent';
import { FieldComponent } from './components/FieldComponent';
import { FlowComponent } from './components/FlowComponent';

const AppContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const App = () => {
  const field: IField = {
    id: 'main',
    center: { x: 0, y: 0, z: 0 },
    radius: 1,
    strength: 0.8,
    coherence: 0.9,
    stability: 0.85,
    resonance: {
      primary: { frequency: 1, amplitude: 0.9, phase: 0 },
      harmonics: [],
      frequency: 1,
      amplitude: 0.9,
      phase: 0,
      coherence: 0.9,
      harmony: 0.85
    },
    protection: {
      level: 0.8,
      type: 'standard',
      shields: 0.85
    },
    energy: {
      mental: 0.9,
      physical: 0.8,
      emotional: 0.85
    },
    waves: []
  };

  const consciousness: ConsciousnessState = {
    id: 'main',
    type: 'individual',
    space: {
      resonance: {
        primary: { frequency: 1, amplitude: 0.9, phase: 0 },
        harmonics: [],
        frequency: 1,
        amplitude: 0.9,
        phase: 0,
        coherence: 0.9,
        harmony: 0.85
      },
      energy: {
        mental: 0.9,
        physical: 0.8,
        emotional: 0.85
      }
    },
    spaces: [],
    connections: [],
    resonance: {
      primary: { frequency: 1, amplitude: 0.9, phase: 0 },
      harmonics: [],
      frequency: 1,
      amplitude: 0.9,
      phase: 0,
      coherence: 0.9,
      harmony: 0.85
    },
    depth: 0.8,
    protection: {
      level: 0.8,
      type: 'standard',
      shields: 0.85
    },
    energy: {
      mental: 0.9,
      physical: 0.8,
      emotional: 0.85
    },
    flow: {
      intensity: 0.85,
      stability: 0.8,
      coherence: 0.9,
      energy: 0.85
    }
  };

  return (
    <AppContainer>
      <FieldComponent field={field} isActive={true} value={0.8} />
      <ConsciousnessComponent consciousness={consciousness} fields={[field]} isCoherent={true} />
      <FlowComponent fields={[field]} isInFlow={true} value={0.8} />
    </AppContainer>
  );
};

export default App; 