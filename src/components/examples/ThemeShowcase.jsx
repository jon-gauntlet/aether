import React from 'react'
import styled from 'styled-components'
import { useTheme } from '../../theme/ThemeProvider'
import { useStyledTheme, useResponsiveTheme } from '../../theme/useComponentTheme'

// Example button with theme support
const Button = styled.button`
  ${useStyledTheme('button', { variant: 'primary' })}
  margin: ${props => props.theme.spacing[2]};
`

const SecondaryButton = styled(Button)`
  ${useStyledTheme('button', { variant: 'secondary' })}
`

const GhostButton = styled(Button)`
  ${useStyledTheme('button', { variant: 'ghost' })}
`

// Example input with theme support
const Input = styled.input`
  ${useStyledTheme('input')}
  margin: ${props => props.theme.spacing[2]};
`

// Example card with theme support
const Card = styled.div`
  ${useStyledTheme('card', {
    extend: {
      padding: props => props.theme.spacing[4],
      margin: props => props.theme.spacing[2]
    }
  })}
`

// Example form elements
const FormLabel = styled.label`
  ${useStyledTheme('form', { variant: 'label' })}
  display: block;
`

const HelperText = styled.span`
  ${useStyledTheme('form', { variant: 'helperText' })}
  display: block;
`

// Example alert messages
const Alert = styled.div`
  ${useStyledTheme('alert', { variant: 'info' })}
`

const SuccessAlert = styled(Alert)`
  ${useStyledTheme('alert', { variant: 'success' })}
`

const ErrorAlert = styled(Alert)`
  ${useStyledTheme('alert', { variant: 'error' })}
`

// Example badges
const Badge = styled.span`
  ${useStyledTheme('badge', { variant: 'solid' })}
  margin: ${props => props.theme.spacing[1]};
`

const OutlineBadge = styled(Badge)`
  ${useStyledTheme('badge', { variant: 'outline' })}
`

const SubtleBadge = styled(Badge)`
  ${useStyledTheme('badge', { variant: 'subtle' })}
`

// Example progress bar
const ProgressTrack = styled.div`
  ${useStyledTheme('progress', { variant: 'track' })}
  width: 100%;
  margin: ${props => props.theme.spacing[4]} 0;
`

const ProgressIndicator = styled.div`
  ${useStyledTheme('progress', { variant: 'indicator' })}
  width: ${props => props.value}%;
`

// Example nav item
const NavItem = styled.a`
  ${useStyledTheme('nav', { variant: 'item' })}
  display: block;
  text-decoration: none;
  margin: ${props => props.theme.spacing[1]} 0;
  cursor: pointer;
`

// Example table
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: ${props => props.theme.spacing[4]} 0;
`

const Th = styled.th`
  ${useStyledTheme('table', { variant: 'header' })}
  text-align: left;
`

const Td = styled.td`
  ${useStyledTheme('table', { variant: 'cell' })}
`

const Tr = styled.tr`
  ${useStyledTheme('table', { variant: 'row' })}
`

// Responsive example
const ResponsiveCard = styled.div`
  ${useResponsiveTheme('card', {
    breakpoints: {
      sm: { padding: '1rem' },
      md: { padding: '2rem' },
      lg: { padding: '3rem' }
    }
  })}
  margin: ${props => props.theme.spacing[4]} 0;
`

// Container for the showcase
const ShowcaseContainer = styled.div`
  padding: ${props => props.theme.spacing[6]};
  max-width: 800px;
  margin: 0 auto;
`

const Section = styled.section`
  margin: ${props => props.theme.spacing[8]} 0;
`

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.primary[500]};
  margin-bottom: ${props => props.theme.spacing[4]};
`

export const ThemeShowcase = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
    <ShowcaseContainer>
      <Section>
        <SectionTitle>Theme System Showcase</SectionTitle>
        <Button onClick={toggleTheme}>
          Toggle {isDark ? 'Light' : 'Dark'} Mode
        </Button>
      </Section>

      <Section>
        <SectionTitle>Buttons</SectionTitle>
        <Button>Primary Button</Button>
        <SecondaryButton>Secondary Button</SecondaryButton>
        <GhostButton>Ghost Button</GhostButton>
      </Section>

      <Section>
        <SectionTitle>Form Elements</SectionTitle>
        <FormLabel>
          Example Input
          <Input placeholder="Enter text..." />
          <HelperText>Helper text with additional information</HelperText>
        </FormLabel>
      </Section>

      <Section>
        <SectionTitle>Cards</SectionTitle>
        <Card>
          <h3>Regular Card</h3>
          <p>Card content with theme support</p>
        </Card>
        <ResponsiveCard>
          <h3>Responsive Card</h3>
          <p>This card's padding changes at different breakpoints</p>
        </ResponsiveCard>
      </Section>

      <Section>
        <SectionTitle>Alerts</SectionTitle>
        <Alert>Info alert message</Alert>
        <SuccessAlert>Success alert message</SuccessAlert>
        <ErrorAlert>Error alert message</ErrorAlert>
      </Section>

      <Section>
        <SectionTitle>Badges</SectionTitle>
        <Badge>Solid</Badge>
        <OutlineBadge>Outline</OutlineBadge>
        <SubtleBadge>Subtle</SubtleBadge>
      </Section>

      <Section>
        <SectionTitle>Progress</SectionTitle>
        <ProgressTrack>
          <ProgressIndicator value={75} />
        </ProgressTrack>
      </Section>

      <Section>
        <SectionTitle>Navigation</SectionTitle>
        <NavItem>Home</NavItem>
        <NavItem className="active">Dashboard</NavItem>
        <NavItem>Settings</NavItem>
      </Section>

      <Section>
        <SectionTitle>Table</SectionTitle>
        <Table>
          <thead>
            <Tr>
              <Th>Header 1</Th>
              <Th>Header 2</Th>
              <Th>Header 3</Th>
            </Tr>
          </thead>
          <tbody>
            <Tr>
              <Td>Cell 1</Td>
              <Td>Cell 2</Td>
              <Td>Cell 3</Td>
            </Tr>
            <Tr>
              <Td>Cell 4</Td>
              <Td>Cell 5</Td>
              <Td>Cell 6</Td>
            </Tr>
          </tbody>
        </Table>
      </Section>
    </ShowcaseContainer>
  )
} 