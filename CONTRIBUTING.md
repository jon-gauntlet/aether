# Contributing to Aether

Thank you for your interest in contributing to Aether! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a branch for your changes: `git checkout -b feature/my-feature`
4. Make your changes
5. Run tests: `npm test`
6. Submit a pull request

## Project Structure

The project follows a modular structure:

```
src/
  components/   # React components
  services/     # Application services
  hooks/        # React hooks
  utils/        # Utility functions
```

## Coding Standards

### JavaScript

- Use ES6+ features
- Follow the existing code style
- Use named exports instead of default exports
- Use JSDoc for documentation

Example:
```javascript
/**
 * @typedef {Object} Props
 * @property {string} name - The name property
 */

/**
 * A component that does something
 * @param {Props} props - Component props
 */
export const MyComponent = ({ name }) => {
  // Implementation
};
```

### Error Handling

Use the centralized error handling system:

```javascript
import { RAGError } from '../utils/errors';

try {
  // Your code
} catch (error) {
  throw new RAGError('Operation failed', 'OPERATION_ERROR');
}
```

### Testing

- Write tests for new features
- Update tests when modifying existing features
- Maintain high test coverage

Example test:
```javascript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent name="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

## Pull Request Process

1. Update documentation for any changes
2. Add tests for new features
3. Ensure all tests pass
4. Update the README.md if needed
5. Submit the pull request with a clear description

## Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix bug in component
docs: update documentation
test: add tests for feature
refactor: refactor code
```

## Documentation

- Update JSDoc comments for code changes
- Update README.md for new features
- Add inline comments for complex logic

## Review Process

1. Automated checks must pass
2. Code review by maintainers
3. Changes requested must be addressed
4. Final approval and merge

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License. 