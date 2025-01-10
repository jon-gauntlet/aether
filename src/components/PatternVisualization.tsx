import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Pattern, PatternMatch } from '../core/autonomic/PatternSystem';

interface PatternVisualizationProps {
  patterns: PatternMatch[];
  confidenceThreshold?: number;
  onPatternSelect?: (pattern: Pattern) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`;

const PatternCard = styled.div`
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  position: relative;

  &:hover {
    transform: scale(1.02);
  }
`;

const PatternHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const PatternName = styled.h3`
  margin: 0;
  font-size: 1.1em;
  color: rgba(255, 255, 255, 0.9);
`;

const Confidence = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9em;
`;

const StrengthIndicator = styled.div<{ strength: number }>`
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
    width: ${props => props.strength * 100}%;
    background: linear-gradient(90deg, #00f260 0%, #0575e6 100%);
    transition: width 0.3s ease;
  }
`;

const ConditionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const ConditionIndicator = styled.div<{ isMatched: boolean }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  background: ${props => props.isMatched
    ? 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
    : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.isMatched ? '#fff' : 'rgba(255, 255, 255, 0.6)'};
`;

const PatternDetails = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  padding: 15px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  margin-top: 10px;
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;

  ${PatternCard}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9em;
  margin-bottom: 5px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 30px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1em;
`;

export const PatternVisualization: React.FC<PatternVisualizationProps> = ({
  patterns,
  confidenceThreshold = 0,
  onPatternSelect
}) => {
  const sortedPatterns = useMemo(() => {
    return [...patterns]
      .filter(p => p.confidence >= confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence);
  }, [patterns, confidenceThreshold]);

  if (patterns.length === 0) {
    return (
      <Container>
        <EmptyState>No active patterns</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {sortedPatterns.map(({ pattern, confidence, matchedConditions }) => (
        <PatternCard
          key={pattern.id}
          onClick={() => onPatternSelect?.(pattern)}
          data-testid="pattern-card"
        >
          <PatternHeader>
            <PatternName>{pattern.name}</PatternName>
            <Confidence>{Math.round(confidence * 100)}%</Confidence>
          </PatternHeader>

          <StrengthIndicator
            strength={confidence}
            data-testid={`strength-indicator-${pattern.id}`}
          />

          <ConditionsList>
            {Object.keys(pattern.conditions).map(condition => (
              <ConditionIndicator
                key={condition}
                isMatched={matchedConditions.includes(condition)}
                data-testid="condition-indicator"
              >
                {condition}
              </ConditionIndicator>
            ))}
          </ConditionsList>

          <PatternDetails>
            <DetailItem>
              <span>Activations:</span>
              <span>{pattern.activations}</span>
            </DetailItem>
            <DetailItem>
              <span>Weight:</span>
              <span>{pattern.weight}</span>
            </DetailItem>
          </PatternDetails>
        </PatternCard>
      ))}
    </Container>
  );
}; 