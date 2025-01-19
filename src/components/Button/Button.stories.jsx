import React from 'react'
import styled from 'styled-components'
import { useStyledTheme } from '../../theme/useComponentTheme'

const Button = styled.button`
  ${useStyledTheme('button', { variant: 'primary' })}
`

const SecondaryButton = styled(Button)`
  ${useStyledTheme('button', { variant: 'secondary' })}
`

const GhostButton = styled(Button)`
  ${useStyledTheme('button', { variant: 'ghost' })}
`

export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A themed button component with multiple variants and states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: 'The visual style variant of the button',
      defaultValue: 'primary',
    },
    children: {
      control: 'text',
      description: 'The content to display inside the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    onClick: {
      action: 'clicked',
      description: 'Function called when the button is clicked',
    },
  },
}

// Primary variant
export const Primary = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
  parameters: {
    docs: {
      description: {
        story: 'The primary button style, used for main actions.',
      },
    },
  },
}

// Secondary variant
export const Secondary = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
  render: (args) => <SecondaryButton {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'The secondary button style, used for alternative actions.',
      },
    },
  },
}

// Ghost variant
export const Ghost = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
  render: (args) => <GhostButton {...args} />,
  parameters: {
    docs: {
      description: {
        story: 'The ghost button style, used for subtle actions.',
      },
    },
  },
}

// Disabled state
export const Disabled = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'The disabled state of the button.',
      },
    },
  },
}

// Button sizes
const ButtonRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing[2]};
  align-items: center;
`

const SmallButton = styled(Button)`
  padding: ${props => `${props.theme.spacing[1]} ${props.theme.spacing[2]}`};
  font-size: ${props => props.theme.typography.fontSizes.xs};
`

const LargeButton = styled(Button)`
  padding: ${props => `${props.theme.spacing[3]} ${props.theme.spacing[6]}`};
  font-size: ${props => props.theme.typography.fontSizes.lg};
`

export const Sizes = {
  render: () => (
    <ButtonRow>
      <SmallButton>Small</SmallButton>
      <Button>Medium</Button>
      <LargeButton>Large</LargeButton>
    </ButtonRow>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons come in three sizes: small, medium (default), and large.',
      },
    },
  },
}

// Interactive states
const StateRow = styled(ButtonRow)`
  flex-direction: column;
  align-items: flex-start;
  gap: ${props => props.theme.spacing[4]};
`

export const States = {
  render: () => (
    <StateRow>
      <Button>Default State</Button>
      <Button className="hover">Hover State</Button>
      <Button className="active">Active State</Button>
      <Button className="focus">Focus State</Button>
      <Button disabled>Disabled State</Button>
    </StateRow>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons have different states: default, hover, active, focus, and disabled.',
      },
    },
  },
} 