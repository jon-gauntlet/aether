# Auth & Files System

A modern authentication and file management system built with React, Supabase, and WebSocket for real-time updates.

## Features

### Authentication
- Secure email/password authentication
- Session management with auto-refresh
- Real-time auth state synchronization
- Comprehensive error handling
- Rate limiting protection

### File Management
- Drag and drop file upload
- Progress tracking
- File type validation
- Size limits
- Folder organization
- Search functionality
- Real-time updates

### Real-time Updates
- WebSocket integration
- Auto-reconnection
- Event filtering
- Concurrent operation handling
- State synchronization

## Tech Stack

- **Frontend**: React, Framer Motion, Styled Components
- **Backend**: Supabase (Auth, Storage, Real-time)
- **State Management**: React Context + Hooks
- **Testing**: Vitest, Testing Library, Playwright
- **Build Tool**: Vite
- **Type Safety**: PropTypes (with TypeScript-like validation)
- **Code Quality**: ESLint, Prettier

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/auth-files.git
cd auth-files
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_FILE_TYPES=image/*,application/pdf,.doc,.docx
VITE_UPLOAD_BUCKET=files
```

5. Start development server:
```bash
npm run dev
```

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   └── FileUpload/     # File upload components
├── config/             # Configuration and constants
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── lib/               # Library integrations
├── utils/             # Utility functions
└── tests/             # Test files
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your hosting platform:
```bash
npm run deploy
```

## API Documentation

See [API.md](API.md) for detailed API documentation.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Supabase](https://supabase.io/) for the amazing backend platform
- [React](https://reactjs.org/) for the frontend framework
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Styled Components](https://styled-components.com/) for styling
- [Vite](https://vitejs.dev/) for the build tool
