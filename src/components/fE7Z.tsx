import React from 'react';
import { useTypeValidation } from '../core/hooks/useTypeValidation';
import { PredictiveValidation } from '../core/autonomic/PredictiveValidation';

interface Props {
  predictiveValidation: PredictiveValidation;
}

export const TypeValidationOverlay: React.FC<Props> = ({ predictiveValidation }) => {
  const { errors, clearErrors } = useTypeValidation(predictiveValidation);

  if (!errors.length || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        maxWidth: 400,
        maxHeight: '80vh',
        overflowY: 'auto',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#fff',
        padding: 20,
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 14,
        zIndex: 9999,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ margin: 0, color: '#ff4444' }}>Type Validation Errors</h3>
        <button
          onClick={clearErrors}
          style={{
            background: 'transparent',
            border: '1px solid #666',
            color: '#666',
            padding: '4px 8px',
            cursor: 'pointer',
            borderRadius: 4
          }}
        >
          Clear
        </button>
      </div>
      <div>
        {errors.map((error, i) => (
          <div
            key={`${error.path.join('.')}-${i}`}
            style={{
              padding: 10,
              borderLeft: '3px solid #ff4444',
              marginBottom: 10
            }}
          >
            <div style={{ color: '#666', marginBottom: 4 }}>
              {error.path.join('.')}
            </div>
            <div>{error.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}; 