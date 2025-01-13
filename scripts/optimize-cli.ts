#!/usr/bin/env node

import TypeVelocityOptimizer from './optimize-types';

async function main() {
  const optimizer = new TypeVelocityOptimizer();
  const mode = process.argv[2] || '--all';

  console.log('🛷 Flow Sled Type Optimization');
  console.log('-----------------------------');

  try {
    switch (mode) {
      case '--quick':
        console.log('⚡ Phase 1: Quick Wins');
        await optimizer.optimize();
        break;
      case '--batch':
        console.log('🔄 Phase 2: Batch Processing');
        await optimizer.optimize();
        break;
      case '--deep':
        console.log('🎯 Phase 3: Deep Fixes');
        await optimizer.optimize();
        break;
      case '--all':
        console.log('🚀 Full Optimization Flow');
        await optimizer.optimize();
        break;
      default:
        console.error('Invalid mode. Use --quick, --batch, --deep, or --all');
        process.exit(1);
    }

    const metrics = optimizer.getMetrics();
    console.log('\n✨ Optimization complete!');
    console.log('-------------------------');
    console.log(`Quick wins: ${metrics.quickWins}`);
    console.log(`Batch fixes: ${metrics.batchFixes}`);
    console.log(`Deep fixes: ${metrics.deepFixes}`);
    console.log(`Energy level: ${metrics.energy}`);

    console.log('\n📊 Pattern Summary:');
    console.log('Declaration statements:', metrics.batchFixes);
    console.log('Property assignments:', metrics.batchFixes);
    console.log('Type expected:', metrics.batchFixes);
    console.log('Expression expected:', metrics.batchFixes);
  } catch (error) {
    console.error('Error during optimization:', error);
    process.exit(1);
  }
}

main().catch(console.error); 