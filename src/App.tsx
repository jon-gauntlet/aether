import React from 'react'
import { ThemeProvider } from 'styled-components'
import { theme } from '@/styles/theme'
import { GlobalStyle } from '@/styles/global'
import { FieldComponent } from '@/components/Field'

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <div style={{ padding: '2rem' }}>
        <FieldComponent
          isActive={true}
          metrics={[
            { value: 42, label: 'Energy' },
            { value: 85, label: 'Flow' },
            { value: 93, label: 'Coherence' },
          ]}
        />
      </div>
    </ThemeProvider>
  )
}

export default App 