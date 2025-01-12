import React from 'react'
import { ThemeProvider } from 'styled-components'
import { theme } from '@/styles/theme'
import { GlobalStyle } from '@/styles/global'
import { FieldComponent } from '@/components/Field'
import { ConsciousnessComponent } from '@/components/Consciousness'
import { FlowComponent } from '@/components/Flow'
import { AuthProvider } from '@/core/auth/AuthProvider'
import { MessageProvider } from '@/core/messaging/MessageProvider'
import { DeployGuard } from '@/core/protection/DeployGuard'

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <MessageProvider>
          <DeployGuard>
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
              <ConsciousnessComponent />
              <FlowComponent
                flowIntensity={93}
                isInFlow={true}
              />
            </div>
          </DeployGuard>
        </MessageProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 