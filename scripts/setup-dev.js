#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { createDebugger } = require('../src/utils/debug');

const debug = createDebugger('DevSetup');

// VSCode settings to enforce
const VS_CODE_SETTINGS = {
  'editor.formatOnSave': true,
  'editor.codeActionsOnSave': {
    'source.fixAll.eslint': true
  },
  'editor.defaultFormatter': 'esbenp.prettier-vscode',
  'javascript.updateImportsOnFileMove.enabled': 'always',
  'javascript.suggestionActions.enabled': true,
  'javascript.validate.enable': true,
  'eslint.validate': ['javascript', 'javascriptreact'],
  'eslint.run': 'onType',
  'prettier.requireConfig': true
};

// Required VSCode extensions
const REQUIRED_EXTENSIONS = [
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode',
  'dsznajder.es7-react-js-snippets'
];

async function setupVSCode() {
  debug.log('Setting up VSCode...');
  
  const vscodePath = path.join(process.cwd(), '.vscode');
  const settingsPath = path.join(vscodePath, 'settings.json');
  
  try {
    // Create .vscode directory if it doesn't exist
    await fs.mkdir(vscodePath, { recursive: true });
    
    // Write settings
    await fs.writeFile(
      settingsPath,
      JSON.stringify(VS_CODE_SETTINGS, null, 2)
    );
    
    // Install extensions
    REQUIRED_EXTENSIONS.forEach(extension => {
      try {
        execSync(`code --install-extension ${extension}`);
        debug.log(`Installed extension: ${extension}`);
      } catch (error) {
        debug.warn(`Failed to install extension ${extension}:`, error.message);
      }
    });
  } catch (error) {
    debug.error('Failed to setup VSCode:', error);
    throw error;
  }
}

async function setupGitHooks() {
  debug.log('Setting up Git hooks...');
  
  const hooksDir = path.join(process.cwd(), '.git', 'hooks');
  const preCommitPath = path.join(hooksDir, 'pre-commit');
  
  const preCommitScript = `#!/bin/sh
# Run ESLint
npm run lint || exit 1

# Run tests
npm test || exit 1

# Check for debug statements
if git diff --cached | grep -E 'console\\.(log|warn)|debugger;'; then
  echo "Error: Debug statements found in staged files"
  exit 1
fi
`;
  
  try {
    await fs.writeFile(preCommitPath, preCommitScript);
    await fs.chmod(preCommitPath, '755');
    debug.log('Git hooks installed');
  } catch (error) {
    debug.error('Failed to setup Git hooks:', error);
    throw error;
  }
}

async function setupDevEnvironment() {
  debug.log('Setting up development environment...');
  
  try {
    // Create necessary directories
    await fs.mkdir('logs', { recursive: true });
    
    // Create dev config
    const devConfig = {
      hmr: true,
      overlay: true,
      devTools: true,
      sourceMaps: true,
      errorReporting: true
    };
    
    await fs.writeFile(
      'dev.config.json',
      JSON.stringify(devConfig, null, 2)
    );
    
    // Install dev dependencies
    execSync('npm install --save-dev @testing-library/react @testing-library/jest-dom jest-axe', { stdio: 'inherit' });
    
    debug.log('Development environment setup complete');
  } catch (error) {
    debug.error('Failed to setup dev environment:', error);
    throw error;
  }
}

async function main() {
  try {
    await setupVSCode();
    await setupGitHooks();
    await setupDevEnvironment();
    
    debug.log('Setup complete! 🎉');
    debug.log('Run `npm run dev` to start development server');
  } catch (error) {
    debug.error('Setup failed:', error);
    process.exit(1);
  }
}

main(); 