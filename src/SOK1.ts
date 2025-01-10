#!/usr/bin/env node
import { workspace } from '../core/workspace';
import chalk from 'chalk';
import { Command } from 'commander';

/**
 * A space that flows with your natural rhythms
 * Everything emerges from how people naturally work together
 */

const cli = new Command()
  .name('space')
  .description(chalk.blue('Your space is ready... where would you like to flow?'));

// Natural movement
cli
  .command('explore')
  .description('Feel the space around you')
  .action(() => {
    console.log(chalk.blue('\nSpaces flowing with activity:'));
    console.log('  📚 depths     - Where deep work flows');
    console.log('  🎯 making     - Where creation happens');
    console.log('  ☕️ commons    - Where people naturally gather');
    console.log('  🚀 exchange   - Where ideas cross paths\n');
    
    console.log(chalk.gray('Flow into a space with `space enter [name]`'));
  });

cli
  .command('enter <space>')
  .description('Flow into a space')
  .action((space) => {
    console.log(chalk.blue(`\nFlowing into ${space}...`));
    console.log('  👋 3 others in the flow');
    console.log('  🎯 The current runs deep');
    console.log('  ✨ Energy flows freely\n');
    
    console.log(chalk.gray('Find your flow with `space focus`'));
  });

cli
  .command('focus')
  .description('Find your natural flow')
  .option('-d, --deep', 'Let the current take you deep')
  .option('-q, --quick', 'Dip into the stream')
  .action((opts) => {
    if (opts.deep) {
      console.log(chalk.blue('\nThe current deepens...'));
      console.log('  🎯 Outside world fades');
      console.log('  🛡️  Distractions drift away');
      console.log('  ⏱️  Time flows naturally\n');
    } else {
      console.log(chalk.blue('\nSlipping into the stream...'));
      console.log('  📝 Ideas begin to flow');
      console.log('  🔔 Important ripples reach you\n');
    }
    
    console.log(chalk.gray('Feel your flow with `space sense`'));
  });

// Natural discovery
cli
  .command('help')
  .description('Sense what\'s possible')
  .action(() => {
    console.log(chalk.blue('\nThe space flows in many ways:\n'));
    console.log('  🌊 Finding your currents:');
    console.log('    space explore     - Feel the flows');
    console.log('    space enter       - Join a stream');
    console.log('    space leave       - Step ashore\n');
    
    console.log('  🎯 Flowing with work:');
    console.log('    space focus       - Find your depth');
    console.log('    space surface     - Come up for air');
    console.log('    space sense       - Feel the currents\n');
    
    console.log('  🤝 Flowing together:');
    console.log('    space who         - Feel who\'s near');
    console.log('    space join        - Flow together');
    console.log('    space bridge      - Connect streams\n');
    
    console.log(chalk.gray('Each path reveals new flows as you explore'));
  });

// Natural guidance
cli.on('command:*', () => {
  console.log(chalk.yellow('\nThat stream doesn\'t flow here.'));
  console.log('Try `space explore` to sense the currents\n');
});

cli.parse(); 