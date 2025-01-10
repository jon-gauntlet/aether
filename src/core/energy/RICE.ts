#!/usr/bin/env node
import { workspace } from '../core/workspace';
import chalk from 'chalk';
import { Command } from 'commander';

/**
 * A CLI that feels like walking through a space
 * Natural commands that build on each other
 */

const cli = new Command()
  .name('space')
  .description(chalk.blue('Welcome to your workspace! What would you like to do?'));

// Natural progression of commands
cli
  .command('explore')
  .description('Look around your workspace')
  .action(() => {
    console.log(chalk.blue('\nSpaces you can visit:'));
    console.log('  📚 library    - Quiet space for deep work');
    console.log('  🎯 focus      - Protected space for flow');
    console.log('  ☕️ lounge     - Casual space for chat');
    console.log('  🚀 launch     - High energy collaboration\n');
    
    console.log(chalk.gray('Try `space enter [name]` to join a space'));
  });

cli
  .command('enter <space>')
  .description('Step into a space')
  .action((space) => {
    console.log(chalk.blue(`\nEntering ${space}...`));
    console.log('  👋 3 people here');
    console.log('  🎯 Focus level: deep');
    console.log('  ✨ Energy: calm\n');
    
    console.log(chalk.gray('Try `space focus` to start working'));
  });

cli
  .command('focus')
  .description('Find your flow')
  .option('-d, --deep', 'Deep focus mode')
  .option('-q, --quick', 'Quick focus session')
  .action((opts) => {
    if (opts.deep) {
      console.log(chalk.blue('\nEntering deep focus...'));
      console.log('  🎯 Notifications muted');
      console.log('  🛡️  Interruptions blocked');
      console.log('  ⏱️  Timer set for 90 minutes\n');
    } else {
      console.log(chalk.blue('\nStarting focus session...'));
      console.log('  📝 Ready to work');
      console.log('  🔔 Important notifications only\n');
    }
    
    console.log(chalk.gray('Try `space status` to check your state'));
  });

// Natural discovery through usage
cli
  .command('help')
  .description('Discover what\'s possible')
  .action(() => {
    console.log(chalk.blue('\nThings you can try:\n'));
    console.log('  🚶‍♂️ Moving around:');
    console.log('    space explore     - Look around');
    console.log('    space enter       - Join a space');
    console.log('    space leave       - Step out\n');
    
    console.log('  🎯 Finding focus:');
    console.log('    space focus       - Start working');
    console.log('    space break       - Take a breather');
    console.log('    space status      - Check your state\n');
    
    console.log('  🤝 Connecting:');
    console.log('    space who         - See who\'s around');
    console.log('    space join        - Work together');
    console.log('    space chat        - Quick conversation\n');
    
    console.log(chalk.gray('Every command has more to discover. Try them out!'));
  });

// Even errors feel natural
cli.on('command:*', () => {
  console.log(chalk.yellow('\nHmm, not sure about that path.'));
  console.log('Try `space explore` to see where you can go\n');
});

cli.parse(); 