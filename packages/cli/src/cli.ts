#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { NewCommand } from './commands/new.js';
import { ValidateCommand } from './commands/validate.js';
import { AddCommand } from './commands/add.js';
import { DeployCommand } from './commands/deploy.js';
import { DevCommand } from './commands/dev.js';

const program = new Command();

// Global program configuration
program
  .name('mcpgen')
  .description('Automated Model Context Protocol Server Generator')
  .version('1.0.0')
  .option('-v, --verbose', 'enable verbose output')
  .option('--config <path>', 'path to configuration file')
  .hook('preAction', (thisCommand, actionCommand) => {
    // Global pre-action hook for logging, config loading, etc.
    const opts = thisCommand.opts();
    if (opts.verbose) {
      console.log(chalk.blue('Running in verbose mode'));
    }
  });

// Register commands
new NewCommand().register(program);
new ValidateCommand().register(program);
new AddCommand().register(program);
new DeployCommand().register(program);
new DevCommand().register(program);

// Global error handler
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    // Help was displayed, exit normally
    process.exit(0);
  } else if (err.code === 'commander.version') {
    // Version was displayed, exit normally
    process.exit(0);
  } else {
    // Other errors
    console.error(chalk.red('Error:'), err.message);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Promise Rejection:'), reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error);
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}