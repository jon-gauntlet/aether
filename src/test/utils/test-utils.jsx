import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { MessageProvider } from '@/core/messaging/MessageProvider';
import { FlowProvider } from '@/core/flow/FlowProvider';
import { EnergyProvider } from '@/core/energy/EnergyProvider';
import { ProtectionProvider } from '@/core/protection/ProtectionProvider';
import { vi } from 'vitest';

// Mock providers with default values
const mockAuthValue = {
  user: null,
  loading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
};

const mockMessageValue = {
  messages: [],
  sendMessage: vi.fn(),
  deleteMessage: vi.fn(),
  updateMessage: vi.fn(),
};

const mockFlowValue = {
  isInFlow: false,
  flowIntensity: 0,
  startFlow: vi.fn(),
  endFlow: vi.fn(),
};

const mockEnergyValue = {
  energyLevel: 1,
  coherence: 1,
  updateEnergy: vi.fn(),
};

const mockProtectionValue = {
  isProtected: true,
  boundaries: {},
  updateBoundaries: vi.fn(),
};

interface AllProvidersProps {
  children: React.ReactNode;
  customProviders?: {
    auth?: typeof mockAuthValue;
    message?: typeof mockMessageValue;
    flow?: typeof mockFlowValue;
    energy?: typeof mockEnergyValue;
    protection?: typeof mockProtectionValue;
  };
}

const AllProviders = ({ children, customProviders = {} }: AllProvidersProps) => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <MessageProvider>
          <FlowProvider value={customProviders.flow || mockFlowValue}>
            <EnergyProvider value={customProviders.energy || mockEnergyValue}>
              <ProtectionProvider value={customProviders.protection || mockProtectionValue}>
                {children}
              </ProtectionProvider>
            </EnergyProvider>
          </FlowProvider>
        </MessageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    customProviders?: AllProvidersProps['customProviders'];
  }
) => {
  const { customProviders, ...renderOptions } = options || {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders customProviders={customProviders}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test utilities
export const verifyShape = (obj: any, shape: Record<string, string>) => {
  Object.entries(shape).forEach(([key, type]) => {
    expect(typeof obj[key]).toBe(type.toLowerCase());
  });
};

export const validateFlowMetrics = (metrics: any) => {
  expect(metrics.velocity).toBeInRange(0, 1);
  expect(metrics.momentum).toBeInRange(0, 1);
  expect(metrics.resistance).toBeInRange(0, 1);
  expect(metrics.conductivity).toBeInRange(0, 1);
  expect(metrics.focus).toBeInRange(0, 1);
  expect(metrics.energy).toBeInRange(0, 1);
  expect(metrics.clarity).toBeInRange(0, 1);
  expect(metrics.quality).toBeInRange(0, 1);
}; 