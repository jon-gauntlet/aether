#!/usr/bin/env node

// Recovery Management System
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Core configuration
const CONFIG = {
  stateDir: '.states',
  backupDir: '.backups',
  artifactDirs: ['dist', 'build', '.cache', 'node_modules']
};

// Initialize recovery
async function initializeRecovery() {
  console.log('⚡ Initializing recovery system...');

  try {
    // Preserve current state
    await preserveCurrentState();

    // Clean environment
    await cleanEnvironment();

    // Restore stable state
    await restoreStableState();

    // Verify system
    await verifySystem();

    console.log('✨ System restored successfully');
  } catch (error) {
    console.error('❌ Recovery failed:', error.message);
    process.exit(1);
  }
}

// Core recovery functions
async function preserveCurrentState() {
  console.log('💾 Preserving current state...');
  
  try {
    // Create backup directory
    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }

    // Stash changes if any
    const status = execSync('git status --porcelain').toString();
    if (status) {
      execSync('git stash push -m "Recovery: Auto-stash"');
      console.log('📦 Changes stashed');
    }

    // Create backup branch
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    execSync(`git checkout -b backup/${timestamp}`);
    console.log('🔖 Backup branch created');
  } catch (error) {
    console.warn('⚠️ State preservation incomplete:', error.message);
  }
}

async function cleanEnvironment() {
  console.log('🧹 Cleaning environment...');

  // Remove build artifacts
  for (const dir of CONFIG.artifactDirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`🗑️ Removed ${dir}`);
    }
  }
}

async function restoreStableState() {
  console.log('🔄 Restoring stable state...');

  try {
    // Find last stable commit
    const lastStable = execSync('git rev-list -n 1 HEAD -- package.json').toString().trim();
    
    // Checkout stable state
    execSync(`git checkout ${lastStable}`);
    console.log('📍 Restored to last stable commit');

    // Reinstall dependencies
    execSync('npm ci');
    console.log('📦 Dependencies reinstalled');
  } catch (error) {
    throw new Error(`Failed to restore stable state: ${error.message}`);
  }
}

async function verifySystem() {
  console.log('🔍 Verifying system state...');

  try {
    // Verify TypeScript
    execSync('tsc --noEmit');
    console.log('✅ TypeScript verified');

    // Test build
    execSync('npm run build');
    console.log('✅ Build verified');

    // Run tests if they exist
    if (fs.existsSync('test')) {
      execSync('npm test');
      console.log('✅ Tests passed');
    }
  } catch (error) {
    throw new Error(`System verification failed: ${error.message}`);
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  console.log('\n🛡️ Cleaning up recovery process...');
  process.exit(0);
});

// Initialize recovery
initializeRecovery(); 