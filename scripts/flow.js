#!/usr/bin/env node

// Flow Enhancement System
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Core configuration
const CONFIG = {
  contextDir: path.join(__dirname, '../.flow/contexts'),
  logsDir: path.join(__dirname, '../.flow/logs'),
  flowThreshold: 25 * 60 * 1000,    // 25 minutes
  focusInterval: 45 * 60 * 1000,    // 45 minutes
  breakInterval: 15 * 60 * 1000,    // 15 minutes
  idleThreshold: 3 * 60 * 1000      // 3 minutes
};

const METRICS = {
  flowStates: new Map(),
  focusDurations: [],
  breakPatterns: [],
  systemLoad: [],
  contextSwitches: 0,
  resourceUsage: [],
  workspacePatterns: new Map(),
  errorPatterns: new Map(),
  buildDurations: []
};

// Create required directories
if (!fs.existsSync(CONFIG.contextDir)) {
  fs.mkdirSync(CONFIG.contextDir, { recursive: true });
}
if (!fs.existsSync(CONFIG.logsDir)) {
  fs.mkdirSync(CONFIG.logsDir, { recursive: true });
}

// Command handling
const command = process.argv[2];
if (command) {
  handleCommand(command);
  process.exit(0);
}

// Initialize flow system
async function initializeFlow() {
  console.log('⚡ Initializing flow system...\n');

  try {
    // Optimize environment
    await optimizeEnvironment();

    // Setup flow protection
    setupFlowProtection();

    // Initialize terminals
    setupTerminals();

    // Load optimized config
    try {
      const optimizedPath = path.join(CONFIG.contextDir, 'optimized-config.json');
      if (fs.existsSync(optimizedPath)) {
        const optimized = JSON.parse(fs.readFileSync(optimizedPath));
        Object.assign(CONFIG, optimized);
        console.log('⚡ Loaded optimized configuration');
      }
    } catch (error) {
      console.warn('⚠️  Using default configuration');
    }

    await optimizeWorkspace();

    console.log('\n✨ Flow system ready');
  } catch (error) {
    console.error('❌ Flow initialization failed:', error.message);
    process.exit(1);
  }
}

// Core setup
function ensureDirectories() {
  console.log('📁 Preparing flow structure...');
  [CONFIG.stateDir, CONFIG.logsDir, CONFIG.contextDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

async function optimizeEnvironment() {
  console.log('🔧 Optimizing environment...');

  try {
    // Set CPU governor to performance on Linux
    if (process.platform === 'linux') {
      execSync('echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor', { stdio: 'ignore' });
    }

    // Drop disk caches on Linux
    if (process.platform === 'linux') {
      execSync('sudo sh -c "sync; echo 3 > /proc/sys/vm/drop_caches"', { stdio: 'ignore' });
    }

    // Clear terminal
    process.stdout.write('\x1Bc');
  } catch (error) {
    console.warn('⚠️  Some optimizations failed:', error.message);
  }
}

function setupFlowProtection() {
  console.log('🛡️  Setting up flow protection...');

  // Detect flow state changes
  let lastActivity = Date.now();
  let inFlow = false;

  // Update activity timestamp on input
  process.stdin.on('data', () => {
    const now = Date.now();
    if (now - lastActivity > CONFIG.flowThreshold && !inFlow) {
      inFlow = true;
      preserveContext('flow-start');
    }
    lastActivity = now;
  });

  // Check for idle state
  setInterval(() => {
    const now = Date.now();
    if (now - lastActivity > CONFIG.idleThreshold && inFlow) {
      inFlow = false;
      preserveContext('flow-break');
    }
  }, CONFIG.idleThreshold);

  // Handle interrupts
  process.on('SIGINT', () => {
    preserveContext('flow-interrupt');
    process.exit(0);
  });
}

function setupTerminals() {
  console.log('🖥️  Setting up terminals...');

  try {
    // Kill existing session if it exists
    try {
      execSync('tmux kill-session -t flow');
    } catch (error) {
      // Ignore - session may not exist
    }

    // Create new session
    execSync('tmux new-session -d -s flow');

    // Setup windows
    execSync('tmux rename-window -t flow:0 dev');
    execSync('tmux new-window -t flow -n type');
    execSync('tmux new-window -t flow -n build');

    // Setup commands
    execSync('tmux send-keys -t flow:0 "npm run dev" C-m');
    execSync('tmux send-keys -t flow:1 "npm run type:watch" C-m');
    execSync('tmux send-keys -t flow:2 "npm run build:watch" C-m');

    console.log('✅ Development terminals ready');
    console.log('💡 Attach with: tmux attach -t flow');
  } catch (error) {
    console.error('❌ Terminal setup failed:', error.message);
    throw error;
  }
}

// Context management
async function preserveContext(trigger) {
  const timestamp = Date.now();
  const context = {
    trigger,
    timestamp,
    git: getGitContext(),
    system: getSystemContext()
  };

  const contextFile = path.join(CONFIG.contextDir, `${timestamp}.json`);
  fs.writeFileSync(contextFile, JSON.stringify(context, null, 2));

  if (trigger === 'flow-break' || trigger === 'flow-interrupt') {
    await optimizeWorkspace();
  }

  analyzeGrowthPatterns();
}

function getGitContext() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const commit = execSync('git rev-parse HEAD').toString().trim();
    const status = execSync('git status --porcelain').toString();
    
    return { branch, commit, hasChanges: status.length > 0 };
  } catch (error) {
    return { error: error.message };
  }
}

function getSystemContext() {
  return {
    load: os.loadavg(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
}

// Handle interrupts gracefully
process.on('SIGINT', async () => {
  console.log('\n💾 Preserving flow context...');
  await preserveContext('flow-interrupt');
  process.exit(0);
});

// Initialize flow system
initializeFlow(); 

async function handleCommand(cmd) {
  switch (cmd) {
    case 'status':
      await checkFlowStatus();
      break;
    case 'focus':
      await startFocusSession();
      break;
    case 'break':
      await startBreak();
      break;
    default:
      console.log('Unknown command:', cmd);
      process.exit(1);
  }
}

async function checkFlowStatus() {
  console.log('🔍 Flow Status:\n');

  // Check flow state
  try {
    const contexts = fs.readdirSync(CONFIG.contextDir);
    const recentContext = contexts.sort().reverse()[0];
    
    if (recentContext) {
      const context = JSON.parse(fs.readFileSync(path.join(CONFIG.contextDir, recentContext)));
      console.log('Flow State:', getFlowEmoji(context.trigger), context.trigger);
      console.log('Last Activity:', new Date(context.timestamp).toLocaleString());
    }
  } catch (error) {
    console.log('Flow State: ❌ No context found');
  }

  // Check system state
  try {
    const load = os.loadavg()[0];
    const memory = process.memoryUsage();
    console.log('\nSystem State:');
    console.log(`- Load: ${load < 2.0 ? '✅' : '⚠️'} ${load.toFixed(2)}`);
    console.log(`- Memory: ${memory.heapUsed < 1000000000 ? '✅' : '⚠️'} ${(memory.heapUsed / 1024 / 1024).toFixed(0)}MB`);
  } catch (error) {
    console.log('System State: ❌ Error');
  }

  // Check terminals
  try {
    execSync('tmux has-session -t flow');
    console.log('\nTerminals: ✅ Active');
    
    const logs = fs.readdirSync(CONFIG.logsDir);
    console.log('Logs:', logs.length > 0 ? '✅ Available' : '⚠️ Empty');
  } catch (error) {
    console.log('\nTerminals: ❌ Inactive');
  }

  // Check growth metrics
  try {
    analyzeGrowthPatterns();
    
    console.log('\nGrowth Metrics:');
    console.log('- Flow Transitions:', METRICS.flowStates.size);
    console.log('- Focus Sessions:', Math.floor(METRICS.focusDurations.length / 2));
    console.log('- Avg Session (min):', Math.floor(average(METRICS.focusDurations) / 60000));
    console.log('- Avg System Load:', average(METRICS.systemLoad).toFixed(2));
  } catch (error) {
    console.log('Growth Metrics: ❌ Insufficient data');
  }
}

async function startFocusSession() {
  console.log('🎯 Starting focus session...');

  try {
    // Preserve current context
    preserveContext('focus-start');

    // Optimize environment
    await optimizeEnvironment();

    // Start focus timer
    const endTime = Date.now() + CONFIG.focusInterval;
    const minutes = Math.floor(CONFIG.focusInterval / 60000);
    
    console.log(`\n⏱️  Focus session: ${minutes} minutes`);
    console.log('💡 Press Ctrl+C to end early\n');

    // Progress indicator
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      const mins = Math.floor(remaining / 60000);
      const percent = 100 - (remaining / CONFIG.focusInterval * 100);
      
      process.stdout.write(`\r${getProgressBar(percent)} ${mins}m remaining`);
    }, 1000);

    // Wait for focus period
    await new Promise(resolve => setTimeout(resolve, CONFIG.focusInterval));
    
    clearInterval(interval);
    console.log('\n\n✨ Focus session complete');
    
    // Preserve end context
    preserveContext('focus-complete');
  } catch (error) {
    console.error('❌ Focus session failed:', error.message);
  }
}

async function startBreak() {
  console.log('🌿 Starting break...');

  try {
    // Preserve context
    preserveContext('break-start');

    // Release system optimizations
    if (process.platform === 'linux') {
      execSync('echo powersave | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor', { stdio: 'ignore' });
    }

    const minutes = Math.floor(CONFIG.breakInterval / 60000);
    console.log(`\n⏱️  Break time: ${minutes} minutes`);
    console.log('💡 Press Ctrl+C to end early\n');

    // Progress indicator
    const endTime = Date.now() + CONFIG.breakInterval;
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      const mins = Math.floor(remaining / 60000);
      const percent = 100 - (remaining / CONFIG.breakInterval * 100);
      
      process.stdout.write(`\r${getProgressBar(percent)} ${mins}m remaining`);
    }, 1000);

    // Wait for break period
    await new Promise(resolve => setTimeout(resolve, CONFIG.breakInterval));
    
    clearInterval(interval);
    console.log('\n\n⚡ Break complete, ready to resume');
    
    // Preserve end context
    preserveContext('break-complete');
  } catch (error) {
    console.error('❌ Break failed:', error.message);
  }
}

function getFlowEmoji(trigger) {
  const emojis = {
    'flow-start': '🌊',
    'flow-break': '💫',
    'focus-start': '🎯',
    'focus-complete': '✨',
    'break-start': '🌿',
    'break-complete': '⚡',
    'flow-interrupt': '💾'
  };
  return emojis[trigger] || '❓';
}

function getProgressBar(percent) {
  const width = 20;
  const complete = Math.floor(width * (percent / 100));
  const incomplete = width - complete;
  return '█'.repeat(complete) + '░'.repeat(incomplete);
}

function analyzeGrowthPatterns() {
  const contexts = fs.readdirSync(CONFIG.contextDir)
    .map(file => {
      const content = fs.readFileSync(path.join(CONFIG.contextDir, file));
      return JSON.parse(content);
    })
    .sort((a, b) => a.timestamp - b.timestamp);

  // Analyze flow state transitions
  for (let i = 1; i < contexts.length; i++) {
    const transition = `${contexts[i-1].trigger}->${contexts[i].trigger}`;
    METRICS.flowStates.set(
      transition, 
      (METRICS.flowStates.get(transition) || 0) + 1
    );
  }

  // Analyze focus durations
  const focusSessions = contexts.filter(c => 
    c.trigger === 'focus-complete' || c.trigger === 'focus-start'
  );
  
  for (let i = 1; i < focusSessions.length; i += 2) {
    const duration = focusSessions[i].timestamp - focusSessions[i-1].timestamp;
    METRICS.focusDurations.push(duration);
  }

  // Analyze system load patterns
  contexts.forEach(c => {
    if (c.system && c.system.load) {
      METRICS.systemLoad.push(c.system.load[0]);
    }
  });

  // Calculate optimal intervals
  const avgFocusDuration = average(METRICS.focusDurations);
  const avgSystemLoad = average(METRICS.systemLoad);
  
  // Adjust intervals based on patterns
  if (avgFocusDuration && Math.abs(avgFocusDuration - CONFIG.focusInterval) > 5 * 60 * 1000) {
    CONFIG.focusInterval = Math.max(30 * 60 * 1000, Math.min(60 * 60 * 1000, avgFocusDuration));
    console.log('⚡ Optimized focus interval:', Math.floor(CONFIG.focusInterval / 60000), 'minutes');
  }

  if (avgSystemLoad > 2.0) {
    CONFIG.flowThreshold = Math.min(CONFIG.flowThreshold * 1.2, 30 * 60 * 1000);
    console.log('⚡ Adjusted flow detection threshold for system load');
  }

  // Save optimized config
  const configPath = path.join(CONFIG.contextDir, 'optimized-config.json');
  fs.writeFileSync(configPath, JSON.stringify(CONFIG, null, 2));
}

function average(arr) {
  return arr.length ? arr.reduce((a, b) => a + b) / arr.length : null;
}

async function optimizeWorkspace() {
  console.log('🔄 Optimizing workspace...');
  
  try {
    // Analyze build logs
    const buildLogs = path.join(CONFIG.logsDir, 'build.log');
    if (fs.existsSync(buildLogs)) {
      const logs = fs.readFileSync(buildLogs, 'utf8');
      const buildTimes = logs.match(/Built in \d+ms/g);
      
      if (buildTimes) {
        METRICS.buildDurations = buildTimes
          .map(t => parseInt(t.match(/\d+/)[0]))
          .slice(-10); // Keep last 10 builds
      }
    }

    // Analyze type check logs
    const typeLogs = path.join(CONFIG.logsDir, 'tsc.log');
    if (fs.existsSync(typeLogs)) {
      const logs = fs.readFileSync(typeLogs, 'utf8');
      const errors = logs.match(/error TS\d+/g) || [];
      
      errors.forEach(err => {
        METRICS.errorPatterns.set(err, (METRICS.errorPatterns.get(err) || 0) + 1);
      });
    }

    // Check system resources
    const memory = process.memoryUsage();
    const load = os.loadavg()[0];
    METRICS.resourceUsage.push({ memory: memory.heapUsed, load, timestamp: Date.now() });

    // Optimize based on patterns
    await optimizeResources();
    
  } catch (error) {
    console.warn('⚠️  Workspace optimization skipped:', error.message);
  }
}

async function optimizeResources() {
  // Analyze resource trends
  const recentUsage = METRICS.resourceUsage.slice(-5);
  const avgMemory = average(recentUsage.map(u => u.memory));
  const avgLoad = average(recentUsage.map(u => u.load));
  
  // Memory optimization
  if (avgMemory > 1.5 * 1024 * 1024 * 1024) { // Over 1.5GB
    console.log('⚡ High memory usage detected, cleaning build cache...');
    await cleanBuildCache();
  }

  // Load optimization  
  if (avgLoad > 2.0) {
    console.log('⚡ High system load detected, optimizing processes...');
    await optimizeProcesses();
  }

  // Build optimization
  const avgBuildTime = average(METRICS.buildDurations);
  if (avgBuildTime > 5000) { // Over 5 seconds
    console.log('⚡ Long build times detected, optimizing build cache...');
    await optimizeBuildCache();
  }
}

async function cleanBuildCache() {
  try {
    // Clean various caches
    const cacheDirs = [
      'node_modules/.cache',
      'node_modules/.vite',
      '.next/cache',
      'dist'
    ];

    for (const dir of cacheDirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }

    // Run garbage collection if possible
    if (global.gc) {
      global.gc();
    }
  } catch (error) {
    console.warn('⚠️  Cache cleanup failed:', error.message);
  }
}

async function optimizeProcesses() {
  try {
    if (process.platform === 'linux') {
      // Adjust process priorities
      execSync('renice -n 10 $(pgrep -f "node.*watch")');
      
      // Optimize I/O scheduler for SSDs
      execSync('echo none | sudo tee /sys/block/*/queue/scheduler');
      
      // Drop page cache
      execSync('sudo sh -c "sync; echo 1 > /proc/sys/vm/drop_caches"');
    }
  } catch (error) {
    console.warn('⚠️  Process optimization failed:', error.message);
  }
}

async function optimizeBuildCache() {
  try {
    // Clear TypeScript incremental build cache
    const tsConfig = path.join(process.cwd(), 'tsconfig.json');
    if (fs.existsSync(tsConfig)) {
      const config = JSON.parse(fs.readFileSync(tsConfig));
      if (config.compilerOptions?.incremental) {
        const tsBuildInfo = path.join(process.cwd(), '.tsbuildinfo');
        if (fs.existsSync(tsBuildInfo)) {
          fs.unlinkSync(tsBuildInfo);
        }
      }
    }

    // Clear Vite cache
    const viteCache = path.join(process.cwd(), 'node_modules/.vite');
    if (fs.existsSync(viteCache)) {
      fs.rmSync(viteCache, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('⚠️  Build cache optimization failed:', error.message);
  }
} 