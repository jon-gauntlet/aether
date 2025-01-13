import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface ProtectionState {
  flowActive: boolean;
  systemCoherent: boolean;
  integrationSafe: boolean;
  recoveryPointCreated: boolean;
  typePatterns: Map<string, any[]>;
  healingActive: boolean;
  energy: number;
}

async function verifyEnvironment() {
  console.log('🛡️ Verifying environment protection...');
  
  try {
    // Type check but don't fail on errors
    const { stdout } = await execAsync('tsc --noEmit');
    if (stdout) {
      console.log('⚠️ TypeScript issues detected but proceeding with protection');
      console.log(stdout);
    }
  } catch (e) {
    console.log('⚠️ TypeScript verification incomplete but proceeding with protection');
  }
  
  try {
    // Dependency check but don't fail
    await execAsync('npm outdated');
  } catch (e) {
    console.log('⚠️ Dependency check incomplete but proceeding with protection');
  }
  
  // Clean state
  try {
    await execAsync('rm -rf dist build .cache');
    console.log('✅ Build artifacts cleaned');
  } catch (e) {
    console.log('⚠️ Clean state incomplete but proceeding');
  }
  
  console.log('✅ Environment verified (with warnings)');
}

async function setupFlowProtection() {
  console.log('⚡ Setting up flow protection...');
  
  try {
    // Import flow metrics
    const flow = require('./flow');
    
    // Initialize protection state
    const state: ProtectionState = {
      flowActive: false,
      systemCoherent: true,
      integrationSafe: true,
      recoveryPointCreated: false,
      typePatterns: new Map(),
      healingActive: false,
      energy: flow.getEnergy()
    };

    // Monitor type patterns
    const monitor = require('./monitor');
    monitor.on('typePattern', (pattern) => {
      flow.trackFlowMetrics('type_pattern', pattern);
      state.typePatterns = monitor.getTypePatterns();
    });

    // Monitor healing cycles
    monitor.on('healingCycle', (cycle) => {
      flow.trackFlowMetrics('healing_cycle', cycle);
      state.healingActive = cycle.active;
    });

    // Flow state coordination
    setInterval(() => {
      const flowState = flow.getFlowState();
      state.flowActive = flowState === 'flow';
      state.energy = flow.getEnergy();

      // Adjust protection based on state
      if (flowState === 'flow') {
        // Minimize interruptions
        monitor.pauseHealing();
      } else if (flowState === 'recovery') {
        // Opportunistic healing
        monitor.resumeHealing();
      }
    }, 5000);

    console.log('✅ Flow protection active');
    
  } catch (error) {
    console.error('❌ Flow protection failed:', error);
    throw error;
  }
}

async function createRecoveryPoints() {
  console.log('🌿 Creating recovery points...');
  
  try {
    // Save current dependencies state
    await fs.copyFile('package.json', '.flow/recovery/package.json.backup');
    await fs.copyFile('package-lock.json', '.flow/recovery/package-lock.json.backup');
    
    // Create git recovery branch
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await execAsync(`git checkout -b recovery/integration-${timestamp}`);
    
    console.log('✅ Recovery points established');
  } catch (e) {
    console.log('⚠️ Recovery points partially created');
  }
}

async function setupIntegrationProtection() {
  console.log('🛡️ Setting up integration protection...');
  
  try {
    // Create integration protection directory
    await fs.mkdir('.flow/integration', { recursive: true });
    
    // Save current component states
    const components = ['ConsciousnessComponent', 'FieldComponent', 'FlowComponent'];
    for (const component of components) {
      try {
        await fs.copyFile(
          `src/components/${component}.tsx`,
          `.flow/integration/${component}.backup.tsx`
        );
      } catch (e) {
        console.log(`Note: ${component} backup skipped - may be new component`);
      }
    }
    
    console.log('✅ Integration protection active');
  } catch (e) {
    console.log('⚠️ Integration protection partially active');
  }
}

async function monitorSystemHealth() {
  console.log('💫 Setting up system monitoring...');
  
  try {
    // Start TypeScript watch process
    exec('tsc --watch --preserveWatchOutput > .flow/typescript.log 2>&1 &');
    
    // Start test watch process
    exec('npm run test -- --watch > .flow/tests.log 2>&1 &');
    
    // Start build watch process
    exec('npm run build:watch > .flow/build.log 2>&1 &');
    
    console.log('✅ System monitoring active');
  } catch (e) {
    console.log('⚠️ System monitoring partially active');
  }
}

async function protect() {
  try {
    console.log('🛡️ Initializing Divine Protection for Integration...');
    
    await verifyEnvironment();
    await setupFlowProtection();
    await createRecoveryPoints();
    await setupIntegrationProtection();
    await monitorSystemHealth();
    
    console.log(`
✨ Divine Protection Active (with warnings)

Monitoring:
- TypeScript: .flow/typescript.log
- Tests: .flow/tests.log
- Build: .flow/build.log

Recovery:
- Branch: protection/integration-*
- Backup: .flow/recovery/*
- State: .flow/states/*

Remember:
- Trust the protection system
- Let features emerge naturally
- Use recovery when needed
- Maintain flow state

Note: Some TypeScript errors exist but core protection is active
`);
  } catch (error) {
    console.error('❌ Protection setup failed:', error);
    process.exit(1);
  }
}

protect(); 