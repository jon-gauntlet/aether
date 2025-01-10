# Aether

A natural system for sustained high-performance development.

## Features

- Flow state protection and optimization
- Pattern recognition and evolution
- Energy-aware development cycles
- Natural system integration
- Adaptive validation

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/aether.git
cd aether
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development server:
```bash
npm run start
```

## Docker Deployment

### Development

```bash
docker-compose up dev
```

### Production

1. Build and push image:
```bash
docker-compose build app
docker-compose push app
```

2. Deploy:
```bash
docker-compose up -d app
```

## Environment Variables

See `.env.example` for all available configuration options.

Required for production:
- `NODE_ENV`: Set to "production"
- `PORT`: HTTP port (default: 80)
- `JWT_SECRET`: Secret for JWT tokens
- `COOKIE_SECRET`: Secret for cookie signing

## Architecture

### Core Systems

1. **Flow Protection**
   - State detection
   - Adaptive guarding
   - Recovery management

2. **Pattern Evolution**
   - Recognition
   - Adaptation
   - Optimization

3. **Energy Management**
   - State tracking
   - Efficiency optimization
   - Recovery cycles

4. **Validation**
   - Adaptive thresholds
   - Pattern-based validation
   - Context awareness

## Development

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Commands

```bash
# Development
npm run start     # Start development server
npm run test      # Run tests
npm run build     # Build for production

# Docker
docker-compose up dev      # Start development environment
docker-compose up -d app   # Start production environment
```

### Code Style

- ESLint configuration
- Prettier formatting
- TypeScript strict mode

## Deployment

1. Configure environment:
   - Copy `.env.example` to `.env`
   - Set production values

2. Build and deploy:
```bash
# Build image
docker build -t aether .

# Run container
docker run -d \
  --name aether \
  -p 80:80 \
  --restart unless-stopped \
  aether
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 