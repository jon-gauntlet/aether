import React, { useEffect, useState } from 'react';

interface Props {
  onComplete?: () => void;
}

type InitState = 'core' | 'flow' | 'energy' | 'patterns';

const INIT_MESSAGES = {
  core: 'Initializing Core Systems...',
  flow: 'Establishing Flow State Management...',
  energy: 'Calibrating Energy Systems...',
  patterns: 'Loading Pattern Recognition...'
};

const INIT_SEQUENCE: InitState[] = ['core', 'flow', 'energy', 'patterns'];

export const LoadingScreen: React.FC<Props> = ({ onComplete }) => {
  const [currentState, setCurrentState] = useState<InitState>('core');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(INIT_MESSAGES.core);
  const [messageClass, setMessageClass] = useState('fade-in');

  useEffect(() => {
    let currentIndex = 0;
    let progressValue = 0;

    const progressInterval = setInterval(() => {
      progressValue += 1;
      setProgress(progressValue);

      if (progressValue >= 100) {
        clearInterval(progressInterval);
        if (onComplete) {
          onComplete();
        }
      } else if (progressValue % 25 === 0) {
        // Transition to next state
        setMessageClass('fade-out');
        setTimeout(() => {
          currentIndex = Math.min(currentIndex + 1, INIT_SEQUENCE.length - 1);
          const nextState = INIT_SEQUENCE[currentIndex];
          setCurrentState(nextState);
          setMessage(INIT_MESSAGES[nextState]);
          setMessageClass('fade-in');
        }, 300);
      }
    }, 50);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className="loading-screen" data-state={currentState}>
      <div className="loading-content">
        <h1>Initializing Systems</h1>
        <div className="loading-spinner" />
        <div className="loading-progress">
          <div 
            className="loading-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={`loading-message ${messageClass}`}>
          {message}
        </div>
      </div>
    </div>
  );
}; 