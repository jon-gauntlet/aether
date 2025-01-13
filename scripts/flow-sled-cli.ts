#!/usr/bin/env node

import * as ts from 'typescript';
import { TypeVelocityOptimizer } from './optimize-types';

async function main() {
  console.log('🛷 Flow Sled Type Optimization');
  console.log('-----------------------------');

  const configPath = ts.findConfigFile(
    process.cwd(),
    ts.sys.fileExists,
    'tsconfig.json'
  );

  if (!configPath) {
    throw new Error('Could not find tsconfig.json');
  }

  const startTime = Date.now();
  const timeoutMinutes = 35;

  try {
    const optimizer = new TypeVelocityOptimizer(configPath, {
      emergencyMode: process.argv.includes('--emergency'),
      timeoutMinutes
    });

    console.log('Running optimization...');
    console.log(`Time limit: ${timeoutMinutes} minutes`);
    
    const metrics = await optimizer.optimize();
    const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;

    console.log('\nOptimization complete!');
    console.log('--------------------');
    console.log(`Time taken: ${elapsedMinutes.toFixed(2)} minutes`);
    console.log(`Quick wins: ${metrics.quickWins}`);
    console.log(`Batch fixes: ${metrics.batchFixes}`);
    console.log(`Deep fixes: ${metrics.deepFixes}`);
    console.log(`Energy level: ${metrics.energy}`);

    // Run tsc again to verify
    try {
      await new Promise((resolve, reject) => {
        const tsc = require('child_process').spawn('tsc', ['--noEmit'], {
          stdio: 'inherit'
        });
        tsc.on('close', (code: number) => {
          if (code === 0) {
            console.log('\n✅ All TypeScript errors resolved!');
            resolve(null);
          } else {
            console.log('\n⚠️ Some TypeScript errors remain. Consider running with --emergency flag.');
            reject(new Error('TypeScript errors remain'));
          }
        });
      });
    } catch (error) {
      if (!process.argv.includes('--emergency')) {
        console.log('Retrying with emergency mode...');
        process.argv.push('--emergency');
        await main();
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error during optimization:', error);
    process.exit(1);
  }
}

main(); 