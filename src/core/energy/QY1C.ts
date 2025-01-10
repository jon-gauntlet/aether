#!/usr/bin/env node
import { program } from 'commander';
import { RepoEvolution } from '../core/system/RepoEvolution';
import { ContinuousOptimization } from '../core/system/ContinuousOptimization';
import { watch } from 'fs';
import { resolve, relative } from 'path';
import { exec } from 'child_process';

const repo = new RepoEvolution();
const optimizer = new ContinuousOptimization(repo);

// Watch for natural file changes
function watchRepo(dir: string) {
  console.log('🌱 Observing natural repository growth...\n');
  
  watch(dir, { recursive: true }, async (_, filePath) => {
    if (!filePath) return;
    
    // Get file connections through git history
    const connections = await getFileConnections(filePath);
    
    // Record natural activity
    repo.recordActivity({
      path: filePath,
      type: 'modify',
      connections,
      energy: 1
    });

    // Show natural growth patterns
    const suggestions = repo.getGrowthSuggestions();
    if (suggestions.length > 0) {
      console.log('\n🌿 Natural growth patterns detected:');
      suggestions.forEach(s => console.log(`  ${s}`));
    }

    // Show optimization suggestions
    const optimizations = optimizer.getSuggestions();
    if (optimizations.size > 0) {
      console.log('\n🔄 Continuous optimizations suggested:');
      optimizations.forEach((suggestion, path) => {
        console.log(`  ${path}: ${suggestion}`);
      });
    }

    // Show energy centers
    const centers = repo.getEnergyCenters();
    if (centers.length > 0) {
      console.log('\n⚡ High energy areas:');
      centers.forEach(c => console.log(`  ${c}`));
    }

    // Show optimized flows
    const flows = optimizer.getOptimizedFlows();
    if (flows.size > 0) {
      console.log('\n🌊 Natural code flows:');
      flows.forEach((connected, path) => {
        console.log(`  ${path} -> ${connected.join(' -> ')}`);
      });
    }
  });
}

// Get natural file connections through git history
async function getFileConnections(filePath: string): Promise<string[]> {
  return new Promise((resolve) => {
    exec(
      `git log --pretty=format: --name-only ${filePath}`,
      (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }
        
        const files = new Set(
          stdout
            .split('\n')
            .map(f => f.trim())
            .filter(f => f && f !== filePath)
        );
        
        resolve(Array.from(files));
      }
    );
  });
}

program
  .name('natural-growth')
  .description('Observe and guide natural repository evolution')
  .version('0.1.0');

program
  .command('observe')
  .description('Start observing natural repository growth')
  .action(() => {
    const rootDir = process.cwd();
    watchRepo(rootDir);
    console.log('🔄 Continuous optimization enabled');
  });

program
  .command('suggest')
  .description('Get natural growth suggestions')
  .action(() => {
    const suggestions = repo.getGrowthSuggestions();
    const optimizations = optimizer.getSuggestions();
    
    if (suggestions.length === 0 && optimizations.size === 0) {
      console.log('No patterns detected yet. Keep coding naturally!');
      return;
    }
    
    if (suggestions.length > 0) {
      console.log('\n🌱 Natural growth suggestions:');
      suggestions.forEach(s => console.log(`  ${s}`));
    }
    
    if (optimizations.size > 0) {
      console.log('\n🔄 Optimization suggestions:');
      optimizations.forEach((suggestion, path) => {
        console.log(`  ${path}: ${suggestion}`);
      });
    }
  });

program
  .command('flows')
  .description('Show natural code flows')
  .action(() => {
    const flows = optimizer.getOptimizedFlows();
    if (flows.size === 0) {
      console.log('No natural flows detected yet. Keep coding!');
      return;
    }
    
    console.log('🌊 Natural code flows:');
    flows.forEach((connected, path) => {
      console.log(`  ${path} -> ${connected.join(' -> ')}`);
    });
  });

program.parse(); 