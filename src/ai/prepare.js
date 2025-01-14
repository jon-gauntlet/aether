import { OpenAI } from 'openai';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { AIAwareSystem } from './system';
import { AIEnhancedSpace } from './space';

/**
 * @typedef {Object} Context
 * @property {string} spaceId
 * @property {Object} patterns
 * @property {Object} metrics
 */

/**
 * @typedef {Object} Pattern
 * @property {string} type
 * @property {number} confidence
 * @property {Object} data
 */

class AIPreparation {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.chat = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7
    });

    this.system = new AIAwareSystem();
    this.spaces = new Map();
  }

  /**
   * Detects patterns in the given context
   * @param {Context} context
   * @returns {Promise<Pattern[]>}
   */
  async detectPatterns(context) {
    return this.system.analyzeContext(context);
  }

  /**
   * Enhances a space with AI capabilities
   * @param {string} spaceId
   * @returns {Promise<AIEnhancedSpace>}
   */
  async enhanceSpace(spaceId) {
    if (this.spaces.has(spaceId)) {
      return this.spaces.get(spaceId);
    }

    const space = new AIEnhancedSpace(spaceId, this.chat);
    this.spaces.set(spaceId, space);
    return space;
  }
}

// AI preparation
export async function prepareAI() {
  console.log('Preparing AI systems...');
  
  // Initialize
  const ai = new AIPreparation();
  
  // Set up enhancement points
  await Promise.all([
    ai.enhanceSpace('sanctuary'),
    ai.enhanceSpace('workshop'),
    ai.enhanceSpace('garden'),
    ai.enhanceSpace('commons'),
    ai.enhanceSpace('library'),
    ai.enhanceSpace('recovery')
  ]);
  
  console.log('AI systems ready for Monday');
  return ai;
}

// Run preparation if called directly
if (require.main === module) {
  prepareAI().catch(console.error);
} 