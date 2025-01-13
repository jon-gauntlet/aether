#!/usr/bin/env node

// Natural Deployment System
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import protection systems
const monitor = require('./monitor');
const flow = require('./flow');

async function naturalDeploy() {
  console.log('🛷 Natural Deployment Sled\n');

  try {
    // Initialize protection
    const deployment = await monitor.initializeProtection();
    
    // Check deployment readiness
    console.log('🔍 Checking deployment readiness...');
    const state = await deployment.checkDeploymentReadiness();
    
    if (state.energy < 0.7) {
      console.log(`\n⚡ System energy too low (${(state.energy * 100).toFixed()}%)`);
      console.log('💫 Try again after recovery period');
      process.exit(1);
    }

    if (state.typeErrors > 0) {
      console.log('\n🛡️ Type safety needs attention first');
      console.log('🌱 Run natural healing cycle before deployment');
      process.exit(1);
    }

    if (!state.buildStatus.success) {
      console.log('\n🏗️ Build needs attention first');
      console.log('Error:', state.buildStatus.error);
      process.exit(1);
    }

    // Prepare for deployment
    console.log('\n🌱 Preparing deployment environment...');
    const ready = await deployment.prepareForDeployment();
    
    if (!ready) {
      console.log('\n💫 System not ready for deployment');
      console.log('Try again after addressing issues');
      process.exit(1);
    }

    // Natural deployment
    console.log('\n🚀 Starting natural deployment...');
    const success = await deployment.naturalDeploy();

    if (success) {
      console.log('\n✨ Deployment successful!');
      console.log('🌿 System in natural state');
    } else {
      console.log('\n❌ Deployment failed');
      console.log('💫 Check logs and try again after recovery');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Deployment error:', error.message);
    console.log('💫 System needs recovery');
    process.exit(1);
  }
}

// Start natural deployment
naturalDeploy(); 