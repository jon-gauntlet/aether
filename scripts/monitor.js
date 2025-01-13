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
  },
  patterns: {
    typeErrors: new Map(),
    flowStates: new Map(),
    healingCycles: [],
    deployStates: new Map()
  },
  deployment: {
    minEnergyLevel: 0.7,
    typeErrorThreshold: 0,
    buildCacheEnabled: true,
    flowProtection: true,
    recoveryPoints: true
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
    await startDeploymentProtection();

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
  console.log('🛡️ Starting type protection...');
  
  let flowState = 'stable';
  let healingActive = false;

  // Natural type checking
  setInterval(async () => {
    try {
      const { stdout } = await execAsync('npm run typecheck', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Pattern recognition
      const errors = parseTypeErrors(stdout);
      updateTypePatterns(errors);

      // Flow-aware healing
      if (errors.length > 0 && !healingActive) {
        const shouldHeal = await checkHealingConditions();
        if (shouldHeal) {
          healingActive = true;
          await naturalTypeHealing();
          healingActive = false;
        }
      }

      // Update flow state
      flowState = determineFlowState(errors.length);
      
    } catch (error) {
      handleTypeError(error);
    }
  }, CONFIG.intervals.typeCheck);
}

// Natural pattern recognition
function parseTypeErrors(output) {
  return output
    .split('\n')
    .filter(line => line.includes('error TS'))
    .map(line => {
      const [file, ...message] = line.split(':');
      return { file, message: message.join(':').trim() };
    });
}

function updateTypePatterns(errors) {
  for (const error of errors) {
    const pattern = identifyPattern(error.message);
    if (pattern) {
      const current = CONFIG.patterns.typeErrors.get(pattern) || [];
      CONFIG.patterns.typeErrors.set(pattern, [...current, error]);
    }
  }
}

// Flow-aware healing
async function checkHealingConditions() {
  const systemLoad = os.loadavg()[0];
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  
  return systemLoad < 2 && memoryUsage < 512; // Example thresholds
}

async function naturalTypeHealing() {
  console.log('🌱 Starting natural type healing...');
  
  try {
    // Sort patterns by energy level for natural flow
    const patterns = Array.from(CONFIG.patterns.typeErrors.entries())
      .map(([pattern, errors]) => ({
        pattern,
        errors,
        energy: errors[0].energy
      }))
      .sort((a, b) => b.energy - a.energy);

    // Heal in natural order
    for (const { pattern, errors, energy } of patterns) {
      if (energy > 0.3) { // Only heal if enough energy
        console.log(`\n🌿 Healing pattern (${(energy * 100).toFixed()}% energy): ${pattern}`);
        await healPattern(pattern, errors);
        
        // Allow system to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`\n💫 Deferring low-energy pattern: ${pattern}`);
      }
    }

    // Record healing cycle with energy levels
    CONFIG.patterns.healingCycles.push({
      timestamp: Date.now(),
      patterns: patterns.map(p => ({
        type: p.pattern,
        energy: p.energy,
        count: p.errors.length
      })),
      success: true
    });

    CONFIG.patterns.typeErrors.clear();
    
  } catch (error) {
    console.error('❌ Healing disrupted:', error);
    CONFIG.patterns.healingCycles.push({
      timestamp: Date.now(),
      error: error.message,
      success: false
    });
  }
}

// Pattern-based healing
async function healPattern(pattern, errors) {
  // Group errors by file for natural cohesion
  const fileGroups = new Map();
  for (const error of errors) {
    const group = fileGroups.get(error.file) || [];
    fileGroups.set(error.file, [...group, error]);
  }

  // Heal files in natural order (most errors first)
  const sortedFiles = Array.from(fileGroups.entries())
    .sort((a, b) => b[1].length - a[1].length);

  for (const [file, fileErrors] of sortedFiles) {
    try {
      console.log(`  🔸 Healing ${file} (${fileErrors.length} errors)`);
      await execAsync(`npm run heal:types -- --file "${file}" --pattern "${pattern.type}" --energy ${pattern.energy}`);
      
      // Verify healing
      const { stdout } = await execAsync(`tsc "${file}" --noEmit`, { stdio: 'pipe' });
      if (!stdout.includes('error TS')) {
        console.log(`  ✨ Healed successfully`);
      }
    } catch (error) {
      console.warn(`  ⚠️ Could not heal ${file}:`, error.message);
    }
  }
}

function determineFlowState(errorCount) {
  if (errorCount === 0) return 'flow';
  if (errorCount < 10) return 'stable';
  return 'recovery';
}

function handleTypeError(error) {
  console.error('❌ Type protection error:', error.message);
  fs.appendFileSync(
    path.join(CONFIG.logsDir, 'type-protection.log'),
    `${new Date().toISOString()} - ${error.message}\n`
  );
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

// Core protection systems
const systems = [
  {
    name: 'Type Protection',
    command: 'npm',
    args: ['run', 'validate:types'],
    frequency: 5000, // Check every 5 seconds
  },
  {
    name: 'Flow Protection',
    command: 'npm',
    args: ['run', 'flow:status'],
    frequency: 10000,
  },
  {
    name: 'Energy Protection', 
    command: 'npm',
    args: ['run', 'protect:status'],
    frequency: 30000,
  }
];

function startMonitoring() {
  console.log('🛡️ Development Sled Protection Systems Active');
  
  systems.forEach(system => {
    const monitor = () => {
      const process = spawn(system.command, system.args);
      
      process.on('error', (error) => {
        console.error(`${system.name} Error:`, error);
      });

      process.on('exit', (code) => {
        if (code !== 0) {
          console.error(`⚠️ ${system.name} Warning: Protection check failed`);
        }
      });
    };

    // Initial check
    monitor();
    
    // Periodic checks
    setInterval(monitor, system.frequency);
  });
}

// Start monitoring if not in test mode
if (process.argv[2] !== 'test') {
  startMonitoring();
}

module.exports = { startMonitoring }; 

async function startDeploymentProtection() {
  console.log('🚀 Activating deployment protection...');

  // Natural deployment flow
  const flow = require('./flow');
  
  async function checkDeploymentReadiness() {
    const metrics = flow.getCurrentMetrics();
    const state = {
      timestamp: Date.now(),
      energy: metrics.energy,
      typeErrors: metrics.typeErrors,
      flowState: flow.getFlowState(),
      buildStatus: await getBuildStatus()
    };

    CONFIG.patterns.deployStates.set(Date.now(), state);
    return state;
  }

  async function getBuildStatus() {
    try {
      const { stdout } = await execAsync('npm run build', { stdio: 'pipe' });
      return {
        success: !stdout.includes('error'),
        output: stdout
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Natural deployment preparation
  async function prepareForDeployment() {
    console.log('🌱 Preparing natural deployment...');

    // Ensure high energy state
    const metrics = flow.getCurrentMetrics();
    if (metrics.energy < CONFIG.deployment.minEnergyLevel) {
      console.log('⚡ Energy too low for deployment, initiating recovery...');
      await execAsync('npm run protect:recovery');
      return false;
    }

    // Ensure type safety
    if (metrics.typeErrors > CONFIG.deployment.typeErrorThreshold) {
      console.log('🛡️ Type issues detected, initiating healing...');
      await naturalTypeHealing();
      return false;
    }

    // Verify build
    const buildStatus = await getBuildStatus();
    if (!buildStatus.success) {
      console.log('🏗️ Build issues detected, needs attention...');
      return false;
    }

    return true;
  }

  // Natural deployment process
  async function naturalDeploy() {
    console.log('🌿 Starting natural deployment...');

    try {
      // Create recovery point
      if (CONFIG.deployment.recoveryPoints) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await execAsync(`git checkout -b deploy-recovery/${timestamp}`);
      }

      // Optimize build cache
      if (CONFIG.deployment.buildCacheEnabled) {
        await execAsync('npm run analyze');
      }

      // Deploy with flow protection
      if (CONFIG.deployment.flowProtection) {
        await execAsync('npx vercel --prod --no-clipboard');
      } else {
        await execAsync('npx vercel --prod');
      }

      console.log('✨ Deployment successful');
      return true;
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      return false;
    }
  }

  // Monitor deployment readiness
  setInterval(async () => {
    const state = await checkDeploymentReadiness();
    
    // Log deployment state
    fs.appendFileSync(
      path.join(CONFIG.logsDir, 'deployment.log'),
      `${JSON.stringify(state)}\n`
    );
  }, CONFIG.intervals.stateCheck);

  // Export deployment functions
  return {
    checkDeploymentReadiness,
    prepareForDeployment,
    naturalDeploy
  };
} 