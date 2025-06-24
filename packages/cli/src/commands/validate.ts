import { Command } from 'commander';
import { existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import chalk from 'chalk';
import { OpenAPIParser, ValidationResult } from '@mcpgen/core';
import { BaseCommand } from './base-command.js';

interface ValidateCommandOptions {
  directory?: string;
  strict?: boolean;
  format?: 'table' | 'json';
  verbose?: boolean;
}

export class ValidateCommand extends BaseCommand {
  private parser: OpenAPIParser;

  constructor() {
    super();
    this.parser = new OpenAPIParser();
  }

  register(program: Command): void {
    program
      .command('validate [directory]')
      .description('Validate an OpenAPI specification or existing MCP server')
      .option('-s, --strict', 'Enable strict validation mode', false)
      .option('-f, --format <type>', 'Output format (table, json)', 'table')
      .option('-v, --verbose', 'Verbose output', false)
      .action(async (directory: string = process.cwd(), options: ValidateCommandOptions) => {
        await this.execute(directory, options);
      });
  }

  private async execute(directory: string, options: ValidateCommandOptions): Promise<void> {
    const startTime = Date.now();

    try {
      const targetPath = resolve(directory);
      
      this.logVerbose(`Validating: ${targetPath}`, options.verbose);
      this.startSpinner('Validating...');

      // Detect what we're validating
      const validationTarget = this.detectValidationTarget(targetPath);
      
      let validationResult: ValidationResult;

      switch (validationTarget.type) {
        case 'openapi-file':
          validationResult = await this.validateOpenAPIFile(validationTarget.path);
          break;
        case 'mcp-project':
          validationResult = await this.validateMCPProject(targetPath);
          break;
        case 'directory':
          validationResult = await this.validateDirectory(targetPath);
          break;
        default:
          throw new Error('Unable to determine validation target');
      }

      this.stopSpinner();

      // Display results
      this.displayValidationResults(validationResult, options);

      if (validationResult.valid) {
        this.logSuccess(`Validation completed successfully in ${this.formatDuration(startTime)}`);
      } else {
        this.logError(`Validation failed with ${validationResult.errors.length} error(s)`);
        process.exit(1);
      }

    } catch (error) {
      await this.handleError(error as Error, 'Validation');
    }
  }

  private detectValidationTarget(path: string): { type: string; path: string } {
    if (!existsSync(path)) {
      throw new Error(`Path does not exist: ${path}`);
    }

    const stat = statSync(path);

    if (stat.isFile()) {
      // Check if it's an OpenAPI file
      if (path.match(/\.(json|yaml|yml)$/i)) {
        return { type: 'openapi-file', path };
      }
      throw new Error('File must be a JSON or YAML OpenAPI specification');
    }

    if (stat.isDirectory()) {
      // Check if it's an MCP project
      const packageJsonPath = join(path, 'package.json');
      const pyprojectPath = join(path, 'pyproject.toml');
      const goModPath = join(path, 'go.mod');

      if (existsSync(packageJsonPath) || existsSync(pyprojectPath) || existsSync(goModPath)) {
        return { type: 'mcp-project', path };
      }

      // Check for OpenAPI files in the directory
      const openApiFiles = this.findOpenAPIFiles(path);
      if (openApiFiles.length > 0) {
        return { type: 'directory', path };
      }

      throw new Error('Directory does not contain an MCP project or OpenAPI specifications');
    }

    throw new Error('Path must be a file or directory');
  }

  private findOpenAPIFiles(directory: string): string[] {
    const files = readdirSync(directory);
    
    return files.filter((file: string) => {
      return file.match(/\.(json|yaml|yml)$/i) && 
             this.isLikelyOpenAPIFile(join(directory, file));
    });
  }

  private isLikelyOpenAPIFile(filePath: string): boolean {
    try {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check for OpenAPI indicators
      return content.includes('openapi') || 
             content.includes('swagger') ||
             content.includes('paths');
    } catch {
      return false;
    }
  }

  private async validateOpenAPIFile(filePath: string): Promise<ValidationResult> {
    try {
      await this.parser.parseFromFile(filePath);
      return this.parser.validate();
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : String(error),
          path: filePath,
          severity: 'error' as const
        }],
        warnings: []
      };
    }
  }

  private async validateMCPProject(projectPath: string): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate project structure
    const structureValidation = this.validateProjectStructure(projectPath);
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);

    // Validate package configuration
    const configValidation = this.validatePackageConfiguration(projectPath);
    errors.push(...configValidation.errors);
    warnings.push(...configValidation.warnings);

    // Validate MCP compliance
    const mcpValidation = await this.validateMCPCompliance(projectPath);
    errors.push(...mcpValidation.errors);
    warnings.push(...mcpValidation.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateDirectory(directoryPath: string): Promise<ValidationResult> {
    const openApiFiles = this.findOpenAPIFiles(directoryPath);
    const allErrors: any[] = [];
    const allWarnings: any[] = [];

    for (const file of openApiFiles) {
      const filePath = join(directoryPath, file);
      const result = await this.validateOpenAPIFile(filePath);
      
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  private validateProjectStructure(projectPath: string): { errors: any[]; warnings: any[] } {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Check for required directories
    const requiredDirs = ['src'];
    for (const dir of requiredDirs) {
      if (!existsSync(join(projectPath, dir))) {
        warnings.push({
          code: 'MISSING_DIRECTORY',
          message: `Missing recommended directory: ${dir}`,
          path: dir
        });
      }
    }

    return { errors, warnings };
  }

  private validatePackageConfiguration(projectPath: string): { errors: any[]; warnings: any[] } {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Check for package files
    const packageJsonPath = join(projectPath, 'package.json');
    const pyprojectPath = join(projectPath, 'pyproject.toml');
    const goModPath = join(projectPath, 'go.mod');

    if (existsSync(packageJsonPath)) {
      const validation = this.validatePackageJson(packageJsonPath);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    } else if (existsSync(pyprojectPath)) {
      // TODO: Validate pyproject.toml
    } else if (existsSync(goModPath)) {
      // TODO: Validate go.mod
    } else {
      errors.push({
        code: 'NO_PACKAGE_CONFIG',
        message: 'No package configuration found (package.json, pyproject.toml, or go.mod)',
        path: projectPath,
        severity: 'error'
      });
    }

    return { errors, warnings };
  }

  private validatePackageJson(packageJsonPath: string): { errors: any[]; warnings: any[] } {
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Check for required fields
      if (!packageJson.name) {
        errors.push({
          code: 'MISSING_NAME',
          message: 'package.json is missing "name" field',
          path: 'package.json',
          severity: 'error'
        });
      }

      if (!packageJson.version) {
        warnings.push({
          code: 'MISSING_VERSION',
          message: 'package.json is missing "version" field',
          path: 'package.json'
        });
      }

      // Check for MCP dependencies
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (!deps['@modelcontextprotocol/sdk']) {
        warnings.push({
          code: 'MISSING_MCP_SDK',
          message: 'MCP SDK dependency not found',
          path: 'package.json'
        });
      }

    } catch (error) {
      errors.push({
        code: 'INVALID_JSON',
        message: `Invalid package.json: ${error instanceof Error ? error.message : String(error)}`,
        path: 'package.json',
        severity: 'error'
      });
    }

    return { errors, warnings };
  }

  private async validateMCPCompliance(projectPath: string): Promise<{ errors: any[]; warnings: any[] }> {
    const errors: any[] = [];
    const warnings: any[] = [];

    // TODO: Implement actual MCP compliance validation
    // This would involve checking:
    // - Server implementation follows MCP protocol
    // - Tool definitions are valid
    // - Resource definitions are valid
    // - Transport configuration is correct

    return { errors, warnings };
  }

  private displayValidationResults(result: ValidationResult, options: ValidateCommandOptions): void {
    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log();
    
    if (result.valid) {
      this.logSuccess('Validation passed');
    } else {
      this.logError('Validation failed');
    }

    if (result.errors.length > 0) {
      console.log();
      console.log(chalk.red.bold('Errors:'));
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${chalk.red(error.message)}`);
        if (error.path && options.verbose) {
          console.log(`     ${chalk.gray('Path:')} ${error.path}`);
        }
        if (error.code && options.verbose) {
          console.log(`     ${chalk.gray('Code:')} ${error.code}`);
        }
      });
    }

    if (result.warnings.length > 0) {
      console.log();
      console.log(chalk.yellow.bold('Warnings:'));
      result.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${chalk.yellow(warning.message)}`);
        if (warning.path && options.verbose) {
          console.log(`     ${chalk.gray('Path:')} ${warning.path}`);
        }
        if (warning.code && options.verbose) {
          console.log(`     ${chalk.gray('Code:')} ${warning.code}`);
        }
      });
    }

    console.log();
    console.log(chalk.bold('Summary:'));
    console.log(`  ${chalk.green('✓')} ${result.errors.length === 0 ? 'No errors' : `${result.errors.length} error(s)`}`);
    console.log(`  ${chalk.yellow('⚠')} ${result.warnings.length === 0 ? 'No warnings' : `${result.warnings.length} warning(s)`}`);
  }
}