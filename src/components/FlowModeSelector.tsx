
import styled from 'styled-components';
import { FlowState, FlowStateType } from '../core/types/flow/types';

interface FlowModeSelectorProps {
  currentState: FlowState;
  onSelect: (state: FlowState) => void;
  recoveryProgress?: number;
  cooldown?: boolean;
}

interface StateButtonProps {
  isActive: boolean;
  isDisabled: boolean;
}

const ;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const StateButton = styled.button<StateButtonProps>`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 1em;
  font-weight: 500;
  cursor: ${props => props.isDisabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.isDisabled ? 0.5 : 1};
  transition: all 0.3s ease;
  transform: scale(${props => props.isActive ? 1.05 : 1});
  background: ${props => props.isActive
    ? 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
    : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.isActive ? '#fff' : 'inherit'};

  &:hover:not(:disabled) {
    transform: scale(1.05);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress * 100}%;
    background: linear-gradient(90deg, #00f260 0%, #0575e6 100%);
    transition: width 0.3s ease;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 0.9em;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.8);
  }
`;

const ButtonWrapper = styled.div`
  position: relative;
  flex: 1;

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const stateDescriptions: Record<FlowStateType, string> = {
  [FlowStateType.FOCUS]: 'Balanced productivity state',
  [FlowStateType.FLOW]: 'Enhanced performance state',
  [FlowStateType.HYPERFOCUS]: 'Maximum intensity state',
  [FlowStateType.EXHAUSTED]: 'Recovery needed',
  [FlowStateType.RECOVERING]: 'Restoring energy',
  [FlowStateType.DISTRACTED]: 'Reduced focus state'
};

export const FlowModeSelector: React.FC<FlowModeSelectorProps> = ({
  currentState,
  onSelect,
  recoveryProgress = 0,
  cooldown = false
}) => {
  const isStateDisabled = (stateType: FlowStateType): boolean => {
    if (cooldown) return true;
    if (stateType === FlowStateType.EXHAUSTED && currentState.type === FlowStateType.RECOVERING) return true;
    if (stateType === FlowStateType.HYPERFOCUS && currentState.type !== FlowStateType.FLOW) return true;
    return false;
  };

  const handleStateSelect = (stateType: FlowStateType) => {
    if (!isStateDisabled(stateType)) {
      onSelect({
        ...currentState,
        type: stateType,
        lastTransition: Date.now()
      });
    }
  };

  return (
    <Container>
      <ButtonGroup>
        {Object.values(FlowStateType).map(stateType => (
          <ButtonWrapper key={stateType}>
            <StateButton
              isActive={currentState.type === stateType}
              isDisabled={isStateDisabled(stateType)}
              disabled={isStateDisabled(stateType)}
              onClick={() => handleStateSelect(stateType)}
              aria-label={stateType}
            >
              {stateType}
            </StateButton>
            <Tooltip>{stateDescriptions[stateType]}</Tooltip>
          </ButtonWrapper>
        ))}
      </ButtonGroup>
      
      {currentState.type === FlowStateType.RECOVERING && (
        <ProgressBar
          progress={recoveryProgress}
          role="progressbar"
          aria-valuenow={recoveryProgress * 100}
          aria-valuemin={0}
          
        />
      )}
    </Container>
  );
}; 