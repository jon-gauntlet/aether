export const SpacePatterns = {
  default: {
    resonanceCalculation: (message, context) => {
      // Default resonance calculation
      return 0.5;
    }
  },
  chat: {
    resonanceCalculation: (message, context) => {
      // Chat space resonance calculation
      const baseResonance = 0.6;
      const energyFactor = context.energy || 1;
      return Math.min(baseResonance * energyFactor, 1);
    }
  },
  flow: {
    resonanceCalculation: (message, context) => {
      // Flow space resonance calculation
      const baseResonance = 0.7;
      const presenceFactor = (context.presence || []).length ? 1.2 : 1;
      return Math.min(baseResonance * presenceFactor, 1);
    }
  }
}; 