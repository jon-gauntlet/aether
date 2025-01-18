#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_REALTIME_CHANNEL',
  'VITE_SUPABASE_TABLE_MESSAGES',
  'VITE_SUPABASE_TABLE_USERS',
  'VITE_API_URL',
  'VITE_WS_URL'
];

const requiredDirs = [
  'src/components',
  'src/hooks',
  'src/pages',
  'src/contexts',
  'src/layouts',
  'src/utils',
  'src/tests'
];

// Helper functions
function checkEnvFile() {
  console.log(chalk.blue('\nChecking environment configuration...'));
  const envPath = path.join(process.cwd(), '.env.development');
  
  if (!fs.existsSync(envPath)) {
    console.log(chalk.yellow('Creating .env.development file...'));
    const defaultEnv = requiredEnvVars.map(v => `${v}=`).join('\n');
    fs.writeFileSync(envPath, defaultEnv);
    console.log(chalk.red('Please fill in the environment variables in .env.development'));
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const missingVars = [];
  
  requiredEnvVars.forEach(v => {
    if (!envContent.includes(`${v}=`)) {
      missingVars.push(v);
    } else if (envContent.includes(`${v}=\n`) || envContent.includes(`${v}=your_`)) {
      missingVars.push(v);
    }
  });

  if (missingVars.length > 0) {
    console.log(chalk.red('\nMissing or invalid environment variables:'));
    missingVars.forEach(v => console.log(chalk.yellow(`- ${v}`)));
    return false;
  }

  console.log(chalk.green('Environment configuration is valid'));
  return true;
}

function checkDirectoryStructure() {
  console.log(chalk.blue('\nChecking directory structure...'));
  const missingDirs = [];

  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      missingDirs.push(dir);
      console.log(chalk.yellow(`Creating directory: ${dir}`));
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  if (missingDirs.length > 0) {
    console.log(chalk.yellow('\nCreated missing directories:'));
    missingDirs.forEach(dir => console.log(`- ${dir}`));
  } else {
    console.log(chalk.green('Directory structure is valid'));
  }
  return true;
}

function checkDependencies() {
  console.log(chalk.blue('\nChecking dependencies...'));
  try {
    execSync('npm list @vitejs/plugin-react @supabase/supabase-js react react-dom', { stdio: 'ignore' });
    console.log(chalk.green('All required dependencies are installed'));
    return true;
  } catch (error) {
    console.log(chalk.red('Missing required dependencies. Installing...'));
    try {
      execSync('npm install @vitejs/plugin-react @supabase/supabase-js react react-dom', { stdio: 'inherit' });
      console.log(chalk.green('Dependencies installed successfully'));
      return true;
    } catch (error) {
      console.error(chalk.red('Failed to install dependencies:'), error);
      return false;
    }
  }
}

function checkViteConfig() {
  console.log(chalk.blue('\nChecking Vite configuration...'));
  const configPath = path.join(process.cwd(), 'vite.config.js');
  
  if (!fs.existsSync(configPath)) {
    console.log(chalk.red('vite.config.js not found'));
    return false;
  }

  const config = fs.readFileSync(configPath, 'utf8');
  const hasReactPlugin = config.includes('@vitejs/plugin-react');
  const hasProxy = config.includes('proxy:');
  const hasTestConfig = config.includes('test:');

  if (!hasReactPlugin || !hasProxy || !hasTestConfig) {
    console.log(chalk.red('Vite configuration is missing required settings'));
    return false;
  }

  console.log(chalk.green('Vite configuration is valid'));
  return true;
}

// Main setup function
async function setup() {
  console.log(chalk.blue.bold('Starting development environment setup...\n'));

  const results = {
    env: checkEnvFile(),
    dirs: checkDirectoryStructure(),
    deps: checkDependencies(),
    vite: checkViteConfig()
  };

  console.log('\n' + chalk.blue.bold('Setup Summary:'));
  Object.entries(results).forEach(([key, success]) => {
    console.log(`${success ? chalk.green('✓') : chalk.red('✗')} ${key}`);
  });

  if (Object.values(results).every(Boolean)) {
    console.log(chalk.green.bold('\nSetup completed successfully!'));
    console.log(chalk.blue('\nYou can now start the development server with:'));
    console.log(chalk.yellow('npm run dev'));
  } else {
    console.log(chalk.red.bold('\nSetup completed with errors. Please fix the issues above.'));
    process.exit(1);
  }
}

// Run setup
setup().catch(error => {
  console.error(chalk.red('Setup failed:'), error);
  process.exit(1);
}); 