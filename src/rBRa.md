# GauntletAI LMS

An AI-First Learning Management System built using modern development practices and tooling.

## Core Features

- Authentication and user management
- Live class features
- Resource management
- Assignment submissions
- AI-assisted learning tools
- Progress tracking

## Tech Stack

- **Frontend**: Next.js + Shadcn UI
- **Backend**: Node.js/TypeScript
- **Database**: PostgreSQL
- **AI Integration**: Claude API
- **Authentication**: NextAuth.js
- **Testing**: Jest + Testing Library
- **Documentation**: TypeDoc + OpenAPI

## Development Approach

This project follows AI-First development principles:

1. **Planning**:
   - AI-generated PRD and architecture
   - Chain-of-thought decision making
   - BrainLift knowledge integration

2. **Prototyping**:
   - V0 for UI components
   - Rapid iteration cycles
   - QC-First validation

3. **Development**:
   - Cursor AI pair programming
   - Test-driven development
   - Continuous documentation

## Project Structure

```
ai-lms/
├── src/
│   ├── components/     # UI components
│   ├── ai/            # AI integration
│   ├── tests/         # Test suites
│   └── brainlifts/    # Knowledge base
├── docs/
│   ├── architecture/  # System design
│   ├── api/          # API documentation
│   └── decisions/    # Architecture decisions
└── config/           # Configuration files
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment:
   ```bash
   cp .env.example .env
   ```
4. Start development:
   ```bash
   npm run dev
   ```

## AI-First Development

This project uses:
- Claude for planning and architecture
- V0 for rapid prototyping
- Cursor for AI-assisted development

## BrainLifts

Project knowledge is maintained in structured BrainLifts:
- `/src/brainlifts/architecture.md`
- `/src/brainlifts/features.md`
- `/src/brainlifts/patterns.md`

## Contributing

1. Create feature branch
2. Use AI-First development practices
3. Ensure tests pass
4. Update documentation
5. Submit PR with BrainLift updates

## License

MIT 