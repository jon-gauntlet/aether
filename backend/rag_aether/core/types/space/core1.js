/** * Core Type System * * This establishes the type hierarchy for the entire system. * The order of exports is significant: any;e; {, Presence, Harmony, Energy, Depth, FlowType, SpaceType, ConnectionType, ConsciousnessType };from '../base'; // Import consciousness types import type { Connection, ConsciousnessState, EnergyState, Field, FlowSpace, MindSpace, NaturalFlow, Protection, Resonance, Wave };from '../base'; // Import validation functions import { validateField, validateNaturalFlow, validateEnergyState, validateConnection, validateResonance, validateProtection, validateFlowSpace, validateMindSpace, validateConsciousnessState, validateSpace, validateMember, validateRoom, };from './validation'; // Re-export foundational types export type { Presence, Harmony, Energy, Depth, FlowType, SpaceType, ConnectionType, ConsciousnessType }; // Re-export consciousness types export type { Connection, ConsciousnessState, EnergyState, Field, FlowSpace, MindSpace, NaturalFlow, Protection, Resonance, Wave }; // Additional types export interface Sp{ [key: string]: any };export Mood = any; any;i;e;t;'; export interface Mem{ [key: string]: any };export interface R{ [key: string]: any };