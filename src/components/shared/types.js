import { ButtonHTMLAttributes } from 'react';

export type ActionType = 'expand' | 'contract' | 'enter' | 'exit';

export interface StyledContainerProps {
  isActive?: boolean;
  isInFlow?: boolean;
  isCoherent?: boolean;
  value?: number;
  energyLevel?: number;
  action?: ActionType;
}

export interface StyledButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  action?: ActionType;
}

export interface StyledStatusProps {
  isActive?: boolean;
  isInFlow?: boolean;
  isCoherent?: boolean;
}

// Type guards for component-specific props
export const isFlowProps = (props: StyledContainerProps): props is Required<Pick<StyledContainerProps, 'isInFlow'>> => {
  return typeof props.isInFlow === 'boolean';
};

export const isActiveProps = (props: StyledContainerProps): props is Required<Pick<StyledContainerProps, 'isActive'>> => {
  return typeof props.isActive === 'boolean';
};

export const isCoherentProps = (props: StyledContainerProps): props is Required<Pick<StyledContainerProps, 'isCoherent'>> => {
  return typeof props.isCoherent === 'boolean';
};

// Utility types for styled-components
export type StyledProps<T extends keyof StyledContainerProps> = Required<Pick<StyledContainerProps, T>>;

// Component-specific prop types with explicit bindings
export type FlowProps = {
  isInFlow: boolean;
};

export type ActiveProps = {
  isActive: boolean;
};

export type CoherentProps = {
  isCoherent: boolean;
};

// Button-specific prop types
export type ActionButtonProps = {
  isActive: boolean;
  action: ActionType;
};

// Metric-specific prop types
export type MetricProps = {
  value: number;
} | {
  energyLevel: number;
}; 