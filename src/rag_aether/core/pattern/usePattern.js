import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'flow_patterns'

export const usePattern = () => {
  const [patterns, setPatterns] = useState([])

  useEffect(() => {
    const storedPatterns = localStorage.getItem(STORAGE_KEY)
    if (storedPatterns) {
      setPatterns(JSON.parse(storedPatterns))
    }
  }, [])

  const createPattern = (flowState, energyLevels, metrics, context = {}) => {
    const pattern = {
      id: uuidv4(),
      state: 'evolving',
      flowState,
      energyLevels,
      metrics,
      context,
      evolution: {
        version: 1,
        history: []
      }
    }

    const updatedPatterns = [...patterns, pattern]
    setPatterns(updatedPatterns)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ patterns: updatedPatterns }))

    return pattern
  }

  const findMatchingPattern = (flowState, energyLevels) => {
    const matches = patterns
      .filter(p => p.flowState === flowState)
      .map(pattern => {
        const confidence = calculateConfidence(pattern.energyLevels, energyLevels)
        return { pattern, confidence }
      })
      .filter(match => match.confidence > 0.7)
      .sort((a, b) => b.confidence - a.confidence)

    return matches[0]
  }

  const calculateConfidence = (patternLevels, currentLevels) => {
    const dimensions = Object.keys(patternLevels)
    const differences = dimensions.map(dim => 
      Math.abs(patternLevels[dim] - currentLevels[dim])
    )
    const avgDifference = differences.reduce((a, b) => a + b) / differences.length
    return 1 - avgDifference
  }

  return {
    patterns,
    createPattern,
    findMatchingPattern
  }
}