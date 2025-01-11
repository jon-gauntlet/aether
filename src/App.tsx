import React from 'react'
import { ThemeProvider } from 'styled-components'
import { theme } from '@/styles/theme'
import { GlobalStyle } from '@/styles/global'
import { FieldComponent } from '@/components/Field'
import { ConsciousnessComponent } from '@/components/Consciousness'
import { FlowComponent } from '@/components/Flow'

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <div style={{ 
        padding: '2rem', 
        display: 'grid', 
        gap: '2rem', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <FieldComponent
          isActive={true}
          metrics={[
            { value: 42, label: 'Energy' },
            { value: 85, label: 'Flow' },
            { value: 93, label: 'Coherence' },
          ]}
        />
        <ConsciousnessComponent
          energyLevel={85}
          isCoherent={true}
        />
        <FlowComponent
          flowIntensity={93}
          isInFlow={true}
        />
      </div>
    </ThemeProvider>
  )
}

export default App 