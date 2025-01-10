import React, { useState } from 'react';
import { Card } from '../base/Card';
import { Button } from '../base/Button';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import { Pattern } from '../../core/types/patterns';
import './PatternCreator.css';

interface PatternCreatorProps {
  className?: string;
}

export const PatternCreator: React.FC<PatternCreatorProps> = ({
  className = '',
}) => {
  const { addPattern } = usePatternContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('development');
  const [priority, setPriority] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPattern: Omit<Pattern, 'id'> = {
      name,
      description,
      strength: 1,
      evolution: {
        stage: 0,
        history: [`Created at ${new Date().toISOString()}`],
        lastEvolved: new Date().toISOString(),
        entropyLevel: 0
      },
      metadata: {
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        category,
        priority
      }
    };

    addPattern(newPattern);
    setName('');
    setDescription('');
    setTags('');
    setCategory('development');
    setPriority(1);
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
          <label htmlFor="pattern-description">Description</label>
          <textarea
            id="pattern-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Pattern description"
            rows={3}
          />
        </div>

        <div className="form-field">
          <label htmlFor="pattern-category">Category</label>
          <select
            id="pattern-category"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="development">Development</option>
            <option value="flow">Flow</option>
            <option value="integration">Integration</option>
            <option value="learning">Learning</option>
            <option value="system">System</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="pattern-tags">Tags (comma-separated)</label>
          <input
            id="pattern-tags"
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="flow, development, testing"
          />
        </div>

        <div className="form-field">
          <label htmlFor="pattern-priority">Priority</label>
          <select
            id="pattern-priority"
            value={priority}
            onChange={e => setPriority(Number(e.target.value))}
          >
            <option value="1">Low</option>
            <option value="2">Medium</option>
            <option value="3">High</option>
          </select>
        </div>

        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={!name.trim() || !description.trim()}
          >
            Create Pattern
          </Button>
        </div>
      </form>
    </Card>
  );
}; 