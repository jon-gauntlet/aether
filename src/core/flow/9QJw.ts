import { useState, useEffect } from 'react';
import { Flow, FlowEngine, PresenceType, Stream } from '../experience/flow';

const flowEngine = new FlowEngine();

export function useFlow(): Flow {
  // We return the flowEngine directly since it implements Flow interface
  return flowEngine;
} 