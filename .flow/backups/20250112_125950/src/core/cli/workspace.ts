#!/usr/bin/env node
import { workspace } from '../core/workspace';
import chalk from 'chalk';
import { Command } from 'commander';

/**
 * A natural workspace that grows with your team
 * Simple commands that build on everyday actions
 */

const cli = new Command()
  .name('space')
  .description(chalk.blue('Welcome to your workspace! How can we help?'));

// Natural workspace navigation
cli
  .command('explore')
  .description('Look around your workspace')
  .action(() => {
    console.log(chalk.blue('\nAreas you can visit:'));
    console.log('  📚 study      - Quiet space for deep work');
    console.log('  🎯 create     - Protected space for making');
    console.log('  ☕️ gather     - Welcoming space for teams');
    console.log('  🚀 share      - Open space for collaboration\n');
    
    console.log(chalk.gray('Try `space enter [name]` to visit an area'));
  });

cli
  .command('enter <space>')
  .description('Visit a workspace area')
  .action((space) => {
    console.log(chalk.blue(`\nWelcome to ${space}...`));
    console.log('  👋 3 people working here');
    console.log('  🎯 Current mood: focused');
    console.log('  ✨ Energy: peaceful\n');
    
    console.log(chalk.gray('Try `space focus` to begin working'));
  });

cli
  .command('focus')
  .description('Start your work session')
  .option('-d, --deep', 'Focused work time')
  .option('-q, --quick', 'Brief work session')
  .action((opts) => {
    if (opts.deep) {
      console.log(chalk.blue('\nStarting focused work...'));
      console.log('  🎯 Notifications paused');
      console.log('  🛡️  Distractions minimized');
      console.log('  ⏱️  Timer set for 90 minutes\n');
    } else {
      console.log(chalk.blue('\nBeginning work session...'));
      console.log('  📝 Ready to begin');
      console.log('  🔔 Important messages only\n');
    }
    
    console.log(chalk.gray('Try `space status` to check progress'));
  });

// Natural discovery
cli
  .command('help')
  .description('Learn what\'s possible')
  .action(() => {
    console.log(chalk.blue('\nThings you can do:\n'));
    console.log('  🚶‍♂️ Finding your way:');
    console.log('    space explore     - Look around');
    console.log('    space enter       - Visit an area');
    console.log('    space leave       - Step away\n');
    
    console.log('  🎯 Getting work done:');
    console.log('    space focus       - Start working');
    console.log('    space pause       - Take a moment');
    console.log('    space status      - Check progress\n');
    
    console.log('  🤝 Working together:');
    console.log('    space who         - See teammates');
    console.log('    space join        - Work alongside');
    console.log('    space share       - Quick update\n');
    
    console.log(chalk.gray('Each command has more to discover as you work'));
  });

// Gentle guidance
cli.on('command:*', () => {
  console.log(chalk.yellow('\nNot sure where that leads.'));
  console.log('Try `space explore` to see where you can go\n');
});

cli.parse(); 