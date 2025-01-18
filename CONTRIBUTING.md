# Contributing to Aether

Thank you for your interest in contributing to Aether! This guide will help you understand our development process and how to contribute effectively.

## Development Process

### 1. Setting Up Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/your-username/aether.git
cd aether

# Install dependencies
npm install
poetry install

# Set up environment
cp config/env/.env.example .env
source scripts/setup_env.sh

# Start development server
npm run dev
```

### 2. Understanding the Codebase

1. **Project Structure**
   - See [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for detailed layout
   - Review [DEVELOPMENT.md](docs/DEVELOPMENT.md) for patterns and practices

2. **Core Systems**
   - RAG System: Document processing and AI interactions
   - Space System: Workspace and context management
   - Reaction System: Real-time adaptations

3. **Component Architecture**
   - React components in `/src/components`
   - Custom hooks in `/src/hooks`
   - Utilities in `/src/utils`

### 3. Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Code Standards**
   - Use consistent naming conventions
   - Write clear commit messages
   - Add appropriate documentation
   - Include tests for new features

3. **Testing**
   ```bash
   # Run all tests
   npm test
   
   # Run specific test file
   npm test path/to/test
   
   # Run with coverage
   npm run test:coverage
   ```

### 4. Submitting Changes

1. **Before Submitting**
   - Ensure all tests pass
   - Update documentation if needed
   - Follow commit message conventions
   - Check for clean code and no debug statements

2. **Pull Request Process**
   - Create a pull request from your fork
   - Fill out the PR template completely
   - Link relevant issues
   - Add appropriate labels

## Code Standards

### 1. File Structure
```
src/
  components/
    ComponentName/
      ComponentName.jsx      # Main component
      index.jsx             # Export file
      __tests__/           # Test directory
        ComponentName.test.jsx
```

### 2. Naming Conventions
- Components: PascalCase
- Files: PascalCase for components
- Functions: camelCase
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE

### 3. Component Template
```javascript
import React from 'react';
import PropTypes from 'prop-types';

export const ComponentName = ({ prop1, prop2 }) => {
  // Implementation
  return (
    <div>
      {/* Component content */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.required,
  prop2: PropTypes.number,
};

ComponentName.defaultProps = {
  prop2: 0,
};
```

### 4. Test Template
```javascript
import { render, screen } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    // Assertions
  });

  it('handles interactions', () => {
    // Interaction tests
  });
});
```

## Commit Messages

Follow the conventional commits specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Adding tests
- chore: Maintenance tasks

Example:
```
feat(space): add workspace transition animations

- Add fade transition between spaces
- Implement smooth scrolling
- Update documentation

Closes #123
```

## Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Added unit tests
- [ ] Added integration tests
- [ ] Tested manually

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

## Getting Help

1. **Documentation**
   - Check [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
   - Review [DEVELOPMENT.md](docs/DEVELOPMENT.md)

2. **Community**
   - Open an issue for questions
   - Join discussions in existing issues
   - Review existing pull requests

3. **Contact**
   - GitHub Issues
   - Project maintainers
   - Community channels

## License

By contributing, you agree that your contributions will be licensed under the MIT License. 