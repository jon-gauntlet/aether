#!/usr/bin/env node

console.log('⚡ Fast monitoring...\n');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Core configuration
const CONFIG = {
  stateDir: '.states',
  logsDir: 'logs',
  intervals: {
    typeCheck: 5000,    // 5 seconds
    buildCheck: 10000,  // 10 seconds
    stateCheck: 30000,  // 30 seconds
    systemCheck: 60000  // 1 minute
  }
};

// Protection status check
if (process.argv[2] === 'status') {
  checkProtectionStatus();
  process.exit(0);
}

// Initialize protection
async function initializeProtection() {
  console.log('⚡ Initializing background protection...');

  try {
    // Ensure directories exist
    ensureDirectories();

    // Start protection layers
    startTypeProtection();
    startBuildProtection();
    startStateProtection();
    startSystemProtection();

    console.log('✨ Protection active');
  } catch (error) {
    console.error('❌ Protection initialization failed:', error.message);
    process.exit(1);
  }
}

// Core setup
function ensureDirectories() {
  console.log('📁 Preparing protection structure...');
  [CONFIG.stateDir, CONFIG.logsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Protection layers
function startTypeProtection() {
  console.log('🔍 Activating type protection...');
  
  // Start TypeScript watch process
  const tsc = spawn('tsc', ['--watch', '--preserveWatchOutput', '--noEmit']);
  
  // Log output
  const typeLog = fs.createWriteStream(path.join(CONFIG.logsDir, 'type-protection.log'));
  tsc.stdout.pipe(typeLog);
  tsc.stderr.pipe(typeLog);

  // Monitor for errors
  let errorBuffer = '';
  tsc.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('error TS')) {
      errorBuffer += output;
      console.log('⚠️ Type issue detected');
    }
  });

  // Clear buffer on successful compilation
  tsc.stdout.on('data', (data) => {
    if (data.toString().includes('Found 0 errors')) {
      errorBuffer = '';
    }
  });
}

function startBuildProtection() {
  console.log('🏗️ Activating build protection...');
  
  // Start Vite build watch
  const build = spawn('npm', ['run', 'build:watch']);
  
  // Log output
  const buildLog = fs.createWriteStream(path.join(CONFIG.logsDir, 'build-protection.log'));
  build.stdout.pipe(buildLog);
  build.stderr.pipe(buildLog);

  // Monitor for errors
  build.stderr.on('data', (data) => {
    console.log('⚠️ Build issue detected');
    preserveState('build-error');
  });
}

function startStateProtection() {
  console.log('💾 Activating state protection...');
  
  // Monitor git state
  setInterval(() => {
    try {
      const status = execSync('git status --porcelain').toString();
      if (status) {
        preserveState('git-changes');
      }
    } catch (error) {
      console.warn('⚠️ Unable to check git state');
    }
  }, CONFIG.intervals.stateCheck);

  // Monitor file changes
  fs.watch('src', { recursive: true }, (eventType, filename) => {
    if (filename) {
      preserveState('file-change');
    }
  });
}

function startSystemProtection() {
  console.log('🛡️ Activating system protection...');
  
  setInterval(() => {
    // Check system resources
    try {
      const load = os.loadavg()[0];
      const memory = process.memoryUsage();
      
      if (load > 2.0 || memory.heapUsed > 1000000000) {
        console.log('⚠️ System load high, optimizing...');
        execSync('sync && sudo sh -c "echo 1 > /proc/sys/vm/drop_caches"', { stdio: 'ignore' });
      }
    } catch (error) {
      console.warn('⚠️ Unable to optimize system');
    }

    // Verify environment
    try {
      execSync('npm run verify:env', { stdio: 'ignore' });
    } catch (error) {
      console.warn('⚠️ Environment needs attention');
    }
  }, CONFIG.intervals.systemCheck);
}

// State preservation
function preserveState(trigger) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const state = {
    timestamp,
    trigger,
    git: getGitState(),
    typescript: getTypeScriptState()
  };

  const statePath = path.join(CONFIG.stateDir, `state-${timestamp}.json`);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function getGitState() {
  try {
    const branch = execSync('git branch --show-current').toString().trim();
    const status = execSync('git status --porcelain').toString();
    return { branch, hasChanges: !!status };
  } catch (error) {
    return { error: 'Unable to get git state' };
  }
}

function getTypeScriptState() {
  try {
    const config = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    return { config: config.compilerOptions };
  } catch (error) {
    return { error: 'Unable to get TypeScript state' };
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  console.log('\n💾 Preserving final state...');
  preserveState('shutdown');
  process.exit(0);
});

// Initialize protection
initializeProtection(); 

async function checkProtectionStatus() {
  console.log('🔍 Protection Status:\n');

  // Check TypeScript protection
  try {
    const typeLog = path.join(CONFIG.logsDir, 'type-protection.log');
    const typeActive = fs.existsSync(typeLog);
    console.log(`TypeScript Protection: ${typeActive ? '✅ Active' : '❌ Inactive'}`);
    
    if (typeActive) {
      const errors = execSync('tsc --noEmit').toString();
      console.log(`Type Safety: ${errors.includes('error') ? '⚠️ Issues Found' : '✅ Clean'}`);
    }
  } catch (error) {
    console.log('TypeScript Protection: ❌ Error');
  }

  // Check Build protection
  try {
    const buildLog = path.join(CONFIG.logsDir, 'build-protection.log');
    const buildActive = fs.existsSync(buildLog);
    console.log(`Build Protection: ${buildActive ? '✅ Active' : '❌ Inactive'}`);
    
    if (buildActive) {
      const buildErrors = fs.readFileSync(buildLog, 'utf8');
      console.log(`Build Status: ${buildErrors.includes('error') ? '⚠️ Issues Found' : '✅ Clean'}`);
    }
  } catch (error) {
    console.log('Build Protection: ❌ Error');
  }

  // Check State protection
  try {
    const states = fs.readdirSync(CONFIG.stateDir);
    const recentState = states.sort().reverse()[0];
    console.log(`State Protection: ${recentState ? '✅ Active' : '❌ Inactive'}`);
    
    if (recentState) {
      const state = JSON.parse(fs.readFileSync(path.join(CONFIG.stateDir, recentState)));
      console.log(`Last State: ${state.timestamp} (${state.trigger})`);
    }
  } catch (error) {
    console.log('State Protection: ❌ Error');
  }

  // Check System protection
  try {
    const load = os.loadavg()[0];
    const memory = process.memoryUsage();
    console.log('\nSystem Status:');
    console.log(`- Load: ${load < 2.0 ? '✅' : '⚠️'} ${load.toFixed(2)}`);
    console.log(`- Memory: ${memory.heapUsed < 1000000000 ? '✅' : '⚠️'} ${(memory.heapUsed / 1024 / 1024).toFixed(0)}MB`);
  } catch (error) {
    console.log('System Protection: ❌ Error');
  }

  // Check Environment
  try {
    execSync('npm run verify:env', { stdio: 'ignore' });
    console.log('Environment: ✅ Verified');
  } catch (error) {
    console.log('Environment: ⚠️ Needs Attention');
  }
} 