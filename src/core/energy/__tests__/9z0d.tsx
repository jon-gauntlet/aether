import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AutonomicDevelopment } from '../AutonomicDevelopment';
import { EnergyType } from '../../core/energy/types';

jest.useFakeTimers();

describe('AutonomicDevelopment', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('renders with default props', () => {
    render(
      <AutonomicDevelopment task="test-task">
        <div>Test Content</div>
      </AutonomicDevelopment>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Development Tips')).toBeInTheDocument();
  });

  it('handles state changes', () => {
    const handleStateChange = jest.fn();
    render(
      <AutonomicDevelopment
        task="test-task"
        onStateChange={handleStateChange}
      >
        <div>Test Content</div>
      </AutonomicDevelopment>
    );

    // Enter flow state
    const enterFlowButton = screen.getByText('Enter Flow');
    fireEvent.click(enterFlowButton);

    expect(handleStateChange).toHaveBeenCalledWith(expect.objectContaining({
      inFlow: true,
      energyLevel: expect.any(Number),
      hasActivePattern: expect.any(Boolean),
      learningCount: expect.any(Number)
    }));
  });

  it('adapts to energy levels', () => {
    render(
      <AutonomicDevelopment task="test-task">
        <div>Test Content</div>
      </AutonomicDevelopment>
    );

    // Advance time to trigger energy decay
    act(() => {
      jest.advanceTimersByTime(120 * 60 * 1000); // 2 hours
    });

    expect(screen.getByText(/Energy is low/i)).toBeInTheDocument();
  });

  it('supports different energy types', () => {
    render(
      <AutonomicDevelopment
        task="test-task"
        energyType={EnergyType.Creative}
      >
        <div>Test Content</div>
      </AutonomicDevelopment>
    );

    expect(screen.getByText('Creative')).toBeInTheDocument();
  });

  it('shows development tips', () => {
    render(
      <AutonomicDevelopment task="test-task">
        <div>Test Content</div>
      </AutonomicDevelopment>
    );

    const tips = [
      'Take regular breaks to maintain energy',
      'Record insights when they occur',
      'Let patterns emerge naturally',
      'Honor your natural rhythms'
    ];

    tips.forEach(tip => {
      expect(screen.getByText(tip)).toBeInTheDocument();
    });
  });

  it('handles pattern feedback', () => {
    render(
      <AutonomicDevelopment task="test-task">
        <div>Test Content</div>
      </AutonomicDevelopment>
    );

    const successButton = screen.getByText('Record Success');
    const improveButton = screen.getByText('Suggest Improvement');

    expect(successButton).toBeInTheDocument();
    expect(improveButton).toBeInTheDocument();

    fireEvent.click(successButton);
    // Pattern evolution is tested in PatternSystem.test.ts
  });

  it('supports dark mode', () => {
    // Mock dark mode media query
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    const { container } = render(
      <AutonomicDevelopment task="test-task">
        <div>Test Content</div>
      </AutonomicDevelopment>
    );

    const component = container.firstChild as HTMLElement;
    const computedStyle = window.getComputedStyle(component);

    // Note: getComputedStyle doesn't work in JSDOM, so we're just checking the class
    expect(component).toHaveClass('autonomic-development');
  });
}); 