#!/usr/bin/env node

// Environment Verification System
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Core verification
async function verifyEnvironment() {
  console.log('⚡ Verifying development environment...');

  try {
    // System checks
    await Promise.all([
      verifyNodeVersion(),
      verifyRequiredFiles(),
      verifyGitStatus(),
      verifyDependencies(),
      verifyTypeScript(),
      verifyEnvironmentVariables()
    ]);

    // State preservation
    await Promise.all([
      cleanBuildArtifacts(),
      createRecoveryPoint(),
      verifyWorkingDirectory()
    ]);

    console.log('✨ Development environment verified');
  } catch (error) {
    console.error('❌ Environment verification failed:', error.message);
    process.exit(1);
  }
}

// Core verification functions
async function verifyNodeVersion() {
  console.log('🔧 Checking Node.js version...');
  const version = process.version;
  if (!version.startsWith('v16')) {
    console.warn('⚠️ Node.js v16 recommended for optimal compatibility');
  }
}

async function verifyRequiredFiles() {
  console.log('📁 Verifying required files...');
  const required = ['package.json', 'tsconfig.json', '.env', 'vite.config.ts'];
  
  for (const file of required) {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️ Missing ${file}`);
    }
  }
}

async function verifyGitStatus() {
  console.log('📊 Checking repository status...');
  try {
    execSync('git rev-parse --is-inside-work-tree');
  } catch {
    console.warn('⚠️ Git repository not initialized');
  }
}

async function verifyDependencies() {
  console.log('📦 Verifying dependencies...');
  if (!fs.existsSync('node_modules')) {
    console.warn('⚠️ Dependencies not installed');
  }
}

async function verifyTypeScript() {
  console.log('🔍 Checking TypeScript setup...');
  try {
    execSync('tsc --version');
  } catch {
    console.warn('⚠️ TypeScript not installed');
  }
}

async function verifyEnvironmentVariables() {
  console.log('🔐 Validating environment configuration...');
  const required = ['NODE_ENV', 'PORT'];
  const apiKey = process.env.OPENAI_API_KEY;
  
  for (const env of required) {
    if (!process.env[env]) {
      console.warn(`⚠️ Missing ${env}`);
    }
  }

  // Verify OpenAI API key format
  if (!apiKey || !apiKey.startsWith('sk-svcacct-')) {
    console.warn('⚠️ Invalid OpenAI API key format - should start with sk-svcacct-');
  }
}

// State management functions
async function cleanBuildArtifacts() {
  console.log('🧹 Cleaning build artifacts...');
  const artifacts = ['dist', 'build', '.cache'];
  
  for (const dir of artifacts) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

async function createRecoveryPoint() {
  console.log('💾 Creating recovery point...');
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    execSync(`git checkout -b recovery/${timestamp}`);
  } catch (error) {
    console.warn('⚠️ Unable to create recovery point');
  }
}

async function verifyWorkingDirectory() {
  console.log('📋 Checking working directory state...');
  try {
    const status = execSync('git status --porcelain').toString();
    if (status) {
      console.warn('⚠️ Working directory not clean');
    }
  } catch (error) {
    console.warn('⚠️ Unable to verify working directory');
  }
}

// Execute verification
verifyEnvironment(); 