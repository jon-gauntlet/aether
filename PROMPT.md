# ChatGenius: Smarter Workplace Communication with AI

## Background and Context
Chat apps, such as Slack, are a foundational element of the modern workplace. If you work remotely, they are the workplace - and even if you work in-person, chat apps enable asynchronous collaboration and integration with other common tools.

But chat apps aren't perfect - written text lacks the nuance of voice and facial expressions. Chatting can be less engaging, or even less accurate, with people missing key pieces of information.

ChatGenius tackles this by applying generative AI, not to replace humans but to augment them. It gives the user a professional digital twin, an AI avatar that can represent them but still have a personal touch.

## Submission Guidelines
At the end of each week you'll be required to submit the following to the GauntletAI Platform:

1. A link to the code of the project in Github
2. The Brainlift you used in learning to build the application (and anything you used to feed to a model to make building the application better)
3. A 5 minute walkthrough of you showing the world what you've built (and where relevant, how you've built it). The more impressive this is the better.
4. The link to you sharing this project on X, and interacting with any feedback.

## Baseline App (Week 1)
Our first week is spent building the application itself using AI-first principles. Some topics and techniques have not yet been covered in class, but you are not prevented from using them.

For a baseline reference app, consider Slack - it is the dominant tool in this space, providing excellent UX and integration with a rich ecosystem.

For the purposes of developing ChatGenius, here are the core features you should target:

1. Authentication
2. Real-time messaging
3. Channel/DM organization
4. File sharing & search
5. User presence & status
6. Thread support
7. Emoji reactions

IDEs such as Cursor and any other AI tools are all fair game, as well as building on related open source projects (though doublecheck that the license is compatible with potential commercial use).

## AI Objectives (Week 2)
Once you've built the app itself, it's time to add AI! The high-level goal is an AI avatar that represents users in conversations and meetings. Baseline functionality should include:

- Given a prompt, can create and send communication on behalf of the user
  - This communication should be informed by content on the Slack, i.e. context-aware
  - It should mirror the personality of the user, i.e. "sound" like them
- If another Slack user has a question for the user (or their avatar), the avatar can receive and respond to it automatically without user intervention

Advanced features to consider:
- Voice synthesis - deliver messages via synthesized voice
- Video synthesis - deliver messages via synthesized video / visual avatar
- Allow the user to customize the look and style of their avatar
  - This could be to match them (they upload voice/pictures/video)
  - And/or you could allow them to select from other custom options
- Gesture/expression generation - enable more sophisticated expression by the avatar

These features are only guidelines - your main goal is to build a great app. So, if you come up with other ideas, feel free to implement them!

## AI Tools and Techniques
You'll need to dive into prompt engineering, templates, and possibly the basics of RAG or fine-tuning.

- Prompt engineering - OpenAI API - LLM output is largely a function of their prompt, so getting a tight feedback loop to iterate on prompts is key
- Prompt Templates | LangChain - powerful prompts incorporate information from the real-world, such as relevant chat messages
- Build a Retrieval Augmented Generation (RAG) App: Part 1 | LangChain - RAG is one of the main ways we enhance AI apps, giving them access to a large corpus of relevant content without going to the trouble of retraining them
- OpenAI Platform Fine Tuning - if you want to change an LLM itself, and you collect some data (such as user chats), you can fine-tune it so it behaves more like the data you give it

If you dig into the advanced visual/video avatar, we recommend checking out services like D-ID and HeyGen. They are specifically designed to create avatars and video content based on humans, and offer advanced functionality that may inspire you to create extra features.

We also highly recommend using an AI observability platform, such as Langfuse, to facilitate monitoring and debugging your application. It can also help gathering and labeling data for potential future use.

## Scope and Deliverables

| Deliverable | Description |
|-------------|-------------|
| Chat app | Working chat web app that enables, at minimum, real-time messaging between users in channels - more features are welcome! |
| AI augmentation - baseline | Chat app users can create a virtual avatar for themselves that can send chats based on their own chat history. |
| AI augmentation - stretch | Avatar is more sophisticated - audio/video, humanized expression, better/more relevant context and content, etc. Come up with your own ideas too! |

## Milestones

| Completion date | Project phase | Description |
|----------------|---------------|-------------|
| Jan 7, 2025 | Chat app MVP | You should have a working chat app with at least messaging and channel functionality by this point. |
| Jan 8, 2025 | Check in 1 | |
| Jan 10, 2025 | App complete | On Friday you should have completed your app. |
| Jan 13, 2025 | AI Objectives start | |
| Jan 15, 2025 | Check in 2 | |
| Jan 17, 2025 | AI features complete | On Friday you should have completed the AI objectives |

## Resources
- Mattermost - an open-source Slack alternative
- LangChain - a framework for rapid development of AI-powered applications

## Suggested Steps
1. Plan initial approach, ensure AI development tools are set up
2. Get MVP functionality working
3. Iterate on MVP until it hits acceptable baseline of features
4. Select AI augmentation(s)
5. Implement AI augmentations, with focus on rapid runnable MVP to get feedback and tight iteration loop

You're encouraged to share your progress as you go, both for camaraderie and competition. You can also ask questions in Slack any time.

# Enhanced Prompting Methodology

## Core Stages

### Stage 1: Base Context (The Stock)
- **Natural Discovery**: Let the LLM explore and understand the repository structure
- **Ambient Understanding**: Build foundational knowledge from surrounding files
- **Core Patterns**: Identify key architectural and design patterns
- **Repository DNA**: Absorb the project's essential nature and principles
- **Passive Learning**: Allow natural understanding to emerge from codebase

Like making a good stock for soup, this stage is about:
- Starting with quality base ingredients (codebase)
- Allowing time for flavors to develop naturally
- Building foundational strength and character
- Creating a robust base for further development

### Stage 2: Context Enrichment (The Ingredients)
- **Strategic Imports**: Pull in additional context in optimal sequence
- **Selective Enhancement**: Choose precisely what context to add when
- **Layered Understanding**: Build knowledge in natural, cumulative way
- **Contextual Harmony**: Ensure new context aligns with base understanding
- **Timing Sensitivity**: Add context at natural development points

Like adding ingredients to soup:
- Each addition carefully timed and considered
- Ingredients chosen to complement and enhance
- Building complexity while maintaining harmony
- Allowing each addition to integrate naturally

### Stage 3: Autonomous Execution (The Cooking)
- **Natural Flow**: Let the LLM operate with accumulated understanding
- **Minimal Intervention**: Step back and allow natural development
- **Pattern Recognition**: Trust established patterns to guide execution
- **Organic Development**: Enable natural growth and evolution
- **Flow Protection**: Maintain optimal conditions for development

Like letting soup simmer:
- Trust the process once properly set up
- Maintain optimal conditions
- Allow flavors to develop and merge
- Protect the natural cooking process

## Implementation Principles

### Natural Development
1. **Base Formation**
   - Allow natural understanding to emerge
   - Build strong foundational patterns
   - Establish clear architectural vision
   - Create robust development base

2. **Context Integration**
   - Add context at natural points
   - Maintain harmony in understanding
   - Build knowledge systematically
   - Preserve essential patterns

3. **Flow Protection**
   - Guard natural development process
   - Maintain optimal conditions
   - Enable uninterrupted progress
   - Protect established patterns

### Execution Patterns

1. **Stage 1 Patterns**
   ```typescript
   class BaseContextBuilder {
     // Build foundational understanding
     async buildBaseContext(): Promise<ContextState> {
       return {
         understanding: await this.exploreRepository(),
         patterns: await this.identifyCorePrinciples(),
         structure: await this.mapArchitecture()
       };
     }
   }
   ```

2. **Stage 2 Patterns**
   ```typescript
   class ContextEnrichment {
     // Enhance with strategic imports
     async enrichContext(base: ContextState): Promise<EnhancedContext> {
       return {
         ...base,
         additionalPatterns: await this.importStrategicContext(),
         enhancedUnderstanding: await this.integrateNewContext(),
         harmonization: await this.validateContextHarmony()
       };
     }
   }
   ```

3. **Stage 3 Patterns**
   ```typescript
   class AutonomousExecution {
     // Enable natural development flow
     async executeWithProtection(context: EnhancedContext): Promise<void> {
       const flow = await this.establishNaturalFlow(context);
       await this.protectDevelopmentProcess(flow);
       await this.enableAutonomousProgress(flow);
     }
   }
   ```

## Integration Guidelines

### 1. Base Context Formation
- Start with repository exploration
- Allow natural pattern discovery
- Build foundational understanding
- Establish clear development base

### 2. Strategic Enhancement
- Import context strategically
- Build layered understanding
- Maintain contextual harmony
- Time additions optimally

### 3. Protected Execution
- Enable autonomous development
- Protect natural flow
- Maintain optimal conditions
- Trust established patterns

## Natural Flow Protection

### 1. Development Conditions
- Maintain optimal environment
- Protect natural processes
- Enable uninterrupted flow
- Guard against disruption

### 2. Pattern Preservation
- Protect established patterns
- Enable natural evolution
- Maintain core principles
- Guard essential nature

### 3. Progress Protection
- Enable continuous development
- Maintain development momentum
- Protect natural progress
- Guard against interruption

Remember: Like making an excellent soup, the key is establishing a strong base, adding the right ingredients at the right time, and then letting the natural process work its magic under protected conditions.
