import React, { useState } from 'react';
import { Card } from '../base/Card';
import { Button } from '../base/Button';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import { Pattern } from '../../core/types/patterns';
import './PatternCreator.css';

interface PatternCreatorProps {
  className?: string;
}

type PatternType = Pattern['type'];

const PATTERN_TYPES: PatternType[] = ['flow', 'development', 'integration'];

export const PatternCreator: React.FC<PatternCreatorProps> = ({
  className = '',
}) => {
  const { addPattern } = usePatternContext();
  const [name, setName] = useState('');
  const [type, setType] = useState<PatternType>('flow');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPattern: Omit<Pattern, 'id'> = {
      name,
      type,
      strength: 1,
      context: context.split(',').map(c => c.trim()).filter(Boolean),
      evolution: {
        stage: 0,
        history: [`Created at ${new Date().toISOString()}`]
      }
    };

    addPattern(newPattern);
    setName('');
    setType('flow');
    setContext('');
  };

  return (
    <Card
      variant="elevated"
      flowAware
      patternGuided
      className={`pattern-creator ${className}`}
    >
      <div className="pattern-creator-header">
        <h3>Create Pattern</h3>
      </div>

      <form className="pattern-creator-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="pattern-name">Name</label>
          <input
            id="pattern-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Pattern name"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="pattern-type">Type</label>
          <select
            id="pattern-type"
            value={type}
            onChange={e => setType(e.target.value as PatternType)}
          >
            {PATTERN_TYPES.map(t => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="pattern-context">Context (comma-separated)</label>
          <input
            id="pattern-context"
            type="text"
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="development, testing, documentation"
          />
        </div>

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={!name.trim()}
          >
            Create Pattern
          </Button>
        </div>
      </form>
    </Card>
  );
}; 