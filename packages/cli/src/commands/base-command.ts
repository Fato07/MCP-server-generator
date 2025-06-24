import { Command } from 'commander';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

export abstract class BaseCommand {
  protected spinner: Ora;

  constructor() {
    this.spinner = ora();
  }

  abstract register(program: Command): void;

  protected startSpinner(text: string): void {
    this.spinner.start(text);
  }

  protected succeedSpinner(text?: string): void {
    this.spinner.succeed(text);
  }

  protected failSpinner(text?: string): void {
    this.spinner.fail(text);
  }

  protected stopSpinner(): void {
    this.spinner.stop();
  }

  protected logInfo(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  protected logSuccess(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  protected logWarning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  protected logError(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  protected logVerbose(message: string, verbose: boolean = false): void {
    if (verbose) {
      console.log(chalk.gray('→'), message);
    }
  }

  protected async handleError(error: Error, operation: string): Promise<void> {
    this.failSpinner(`${operation} failed`);
    this.logError(error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    
    process.exit(1);
  }

  protected validateRequiredOption(value: any, name: string): void {
    if (!value) {
      throw new Error(`Required option --${name} is missing`);
    }
  }

  protected formatDuration(start: number): string {
    const duration = Date.now() - start;
    if (duration < 1000) {
      return `${duration}ms`;
    } else {
      return `${(duration / 1000).toFixed(1)}s`;
    }
  }
}