import React, { useState } from 'react';
import styled from 'styled-components';
import { createDefaultField } from './core/types/base';
import { createDefaultConsciousnessState } from './core/types/consciousness';
import { FlowComponent } from './components/FlowComponent';
import { FieldComponent } from './components/FieldComponent';
import { ConsciousnessComponent } from './components/ConsciousnessComponent';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
`;

const Header = styled.header`
  grid-column: 1 / -1;
  text-align: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 2.5em;
  color: #333;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 1.2em;
  color: #666;
  margin: 10px 0;
`;

const App: React.FC = () => {
  const [field] = useState(createDefaultField());
  const [consciousness] = useState(createDefaultConsciousnessState());

  return (
    <AppContainer>
      <Header>
        <Title>Aether</Title>
        <Subtitle>Flow State Optimization System</Subtitle>
      </Header>

      <FlowComponent 
        field={field}
        consciousness={consciousness}
      />

      <FieldComponent 
        initialField={field}
      />

      <ConsciousnessComponent 
        fields={[field]}
      />
    </AppContainer>
  );
};

export default App; 