import React from 'react'
import styled from 'styled-components'
import { useTheme } from '../../theme/ThemeProvider'
import { useStyledTheme } from '../../theme/useComponentTheme'

const Container = styled.div`
  padding: ${props => props.theme.spacing[6]};
  max-width: 800px;
  margin: 0 auto;
`

const Section = styled.section`
  margin: ${props => props.theme.spacing[8]} 0;
`

const Title = styled.h1`
  color: ${props => props.theme.colors.primary[500]};
  margin-bottom: ${props => props.theme.spacing[4]};
`

const SubTitle = styled.h2`
  color: ${props => props.theme.colors.primary[500]};
  margin: ${props => props.theme.spacing[6]} 0 ${props => props.theme.spacing[3]};
`

const Card = styled.div`
  ${useStyledTheme('card')}
  padding: ${props => props.theme.spacing[4]};
  margin: ${props => props.theme.spacing[4]} 0;
`

const CodeBlock = styled.pre`
  ${useStyledTheme('card')}
  padding: ${props => props.theme.spacing[4]};
  font-family: ${props => props.theme.typography.fonts.mono};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  overflow-x: auto;
`

const Text = styled.p`
  margin: ${props => props.theme.spacing[2]} 0;
  line-height: ${props => props.theme.typography.lineHeights.relaxed};
`

const List = styled.ul`
  margin: ${props => props.theme.spacing[2]} 0;
  padding-left: ${props => props.theme.spacing[4]};
`

const ListItem = styled.li`
  margin: ${props => props.theme.spacing[2]} 0;
  line-height: ${props => props.theme.typography.lineHeights.relaxed};
`

export const ThemeUsage = () => {
  const { isDark } = useTheme()

  return (
    <Container>
      <Title>Theme System Usage Guide</Title>
      <Text>
        Our theme system provides a comprehensive set of tools for creating consistent,
        dark-mode ready components. Here's how to use it effectively:
      </Text>

      <Section>
        <SubTitle>Basic Usage</SubTitle>
        <Card>
          <Text>
            The simplest way to use the theme system is with the useStyledTheme hook:
          </Text>
          <CodeBlock>
{`import styled from 'styled-components'
import { useStyledTheme } from './theme/useComponentTheme'

const Button = styled.button\`
  \${useStyledTheme('button', { variant: 'primary' })}
\``}
          </CodeBlock>
        </Card>
      </Section>

      <Section>
        <SubTitle>Available Hooks</SubTitle>
        <List>
          <ListItem>
            <strong>useComponentTheme</strong> - Get raw theme values
            <CodeBlock>
{`const theme = useComponentTheme('button', 'primary')`}
            </CodeBlock>
          </ListItem>
          <ListItem>
            <strong>useStyledTheme</strong> - Create styled-components
            <CodeBlock>
{`const Card = styled.div\`
  \${useStyledTheme('card', {
    variant: 'default',
    extend: { padding: '1rem' }
  })}
\``}
            </CodeBlock>
          </ListItem>
          <ListItem>
            <strong>useDynamicTheme</strong> - Handle component states
            <CodeBlock>
{`const buttonTheme = useDynamicTheme('button', {
  variant: 'primary',
  state: { isHovered: true }
})`}
            </CodeBlock>
          </ListItem>
          <ListItem>
            <strong>useResponsiveTheme</strong> - Create responsive styles
            <CodeBlock>
{`const ResponsiveCard = styled.div\`
  \${useResponsiveTheme('card', {
    breakpoints: {
      sm: { padding: '1rem' },
      md: { padding: '2rem' }
    }
  })}
\``}
            </CodeBlock>
          </ListItem>
        </List>
      </Section>

      <Section>
        <SubTitle>Theme Components</SubTitle>
        <Text>
          The following components have built-in theme support:
        </Text>
        <List>
          <ListItem>
            <strong>Button</strong> - Variants: primary, secondary, ghost
          </ListItem>
          <ListItem>
            <strong>Input</strong> - Variants: default, error
          </ListItem>
          <ListItem>
            <strong>Card</strong> - Variants: default, hover
          </ListItem>
          <ListItem>
            <strong>Alert</strong> - Variants: info, success, warning, error
          </ListItem>
          <ListItem>
            <strong>Badge</strong> - Variants: solid, outline, subtle
          </ListItem>
          <ListItem>
            <strong>Progress</strong> - Parts: track, indicator
          </ListItem>
          <ListItem>
            <strong>Navigation</strong> - Variants: item
          </ListItem>
          <ListItem>
            <strong>Table</strong> - Parts: header, cell, row
          </ListItem>
        </List>
      </Section>

      <Section>
        <SubTitle>Dark Mode Support</SubTitle>
        <Card>
          <Text>
            All themed components automatically support dark mode. The current theme is: {isDark ? 'Dark' : 'Light'}
          </Text>
          <CodeBlock>
{`// Access dark mode in your components
const { isDark, toggleTheme } = useTheme()

// Use in styled-components
const Card = styled.div\`
  background: \${props => props.theme.isDark ? '#1a202c' : 'white'};
\``}
          </CodeBlock>
        </Card>
      </Section>

      <Section>
        <SubTitle>Best Practices</SubTitle>
        <List>
          <ListItem>
            Always use theme tokens instead of hardcoded values
          </ListItem>
          <ListItem>
            Utilize the useStyledTheme hook for consistent styling
          </ListItem>
          <ListItem>
            Test components in both light and dark modes
          </ListItem>
          <ListItem>
            Use responsive utilities for adaptive layouts
          </ListItem>
          <ListItem>
            Follow the component variant patterns
          </ListItem>
          <ListItem>
            Leverage state-based themes for interactive elements
          </ListItem>
        </List>
      </Section>
    </Container>
  )
} 