import { Command } from 'commander';
import { existsSync, statSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ProjectGenerator, GenerationOptions as CoreGenerationOptions, SupportedLanguage, OpenAPIParser } from '@mcpgen/core';
import { IntelligenceService, IntelligenceUtils } from '@mcpgen/intelligence';
import { BaseCommand } from './base-command.js';
import { ConfigManager } from '../utils/config-manager.js';

interface NewCommandOptions {
  input?: string;
  language?: SupportedLanguage;
  template?: string;
  output?: string;
  auth?: 'none' | 'oauth' | 'apikey' | 'jwt';
  interactive?: boolean;
  verbose?: boolean;
  config?: string;
  // AI Enhancement options
  enhanceDocs?: boolean;
  generateExamples?: boolean;
  llmProvider?: 'openai' | 'anthropic' | 'ollama';
  llmModel?: string;
  llmApiKey?: string;
  enableCache?: boolean;
  maxCost?: number;
}

interface ExtendedGenerationOptions extends CoreGenerationOptions {
  enhanceDocs?: boolean;
  generateExamples?: boolean;
  llmProvider?: 'openai' | 'anthropic' | 'ollama';
  llmModel?: string;
  llmApiKey?: string;
  enableCache?: boolean;
  maxCost?: number;
}

export class NewCommand extends BaseCommand {
  private generator: ProjectGenerator;
  private configManager: ConfigManager;
  private openApiParser: OpenAPIParser;

  constructor() {
    super();
    this.generator = new ProjectGenerator();
    this.configManager = new ConfigManager();
    this.openApiParser = new OpenAPIParser();
  }

  register(program: Command): void {
    program
      .command('new <project-name>')
      .description('Generate a new MCP server from OpenAPI specification')
      .option('-i, --input <file>', 'OpenAPI specification file (JSON or YAML)')
      .option('-l, --language <lang>', 'Target language (typescript, python, go)', 'typescript')
      .option('-t, --template <name>', 'Base template to use', 'basic')
      .option('-o, --output <dir>', 'Output directory', process.cwd())
      .option('-a, --auth <type>', 'Authentication type (none, oauth, apikey, jwt)', 'none')
      .option('--interactive', 'Interactive mode with prompts', false)
      .option('-v, --verbose', 'Verbose output', false)
      // AI Enhancement options
      .option('--enhance-docs', 'Enable AI-powered documentation enhancement', false)
      .option('--generate-examples', 'Generate AI-powered code examples', false)
      .option('--llm-provider <provider>', 'LLM provider (openai, anthropic, ollama)', 'anthropic')
      .option('--llm-model <model>', 'Specific LLM model to use')
      .option('--llm-api-key <key>', 'API key for LLM provider (can also use env vars)')
      .option('--enable-cache', 'Enable semantic caching for cost reduction', true)
      .option('--max-cost <amount>', 'Maximum cost limit for AI features (USD)', '1.00')
      .action(async (projectName: string, options: NewCommandOptions) => {
        await this.execute(projectName, options);
      });
  }

  private async execute(projectName: string, options: NewCommandOptions): Promise<void> {
    const startTime = Date.now();

    try {
      // Load configuration
      const config = await this.configManager.loadConfig(options.config);
      
      // Merge options with config
      const mergedOptions = { ...config, ...options };

      // Validate project name
      this.validateProjectName(projectName);

      // Get generation options (either from CLI args or interactive prompts)
      const generationOptions = await this.getGenerationOptions(projectName, mergedOptions);

      // Validate options
      await this.validateOptions(generationOptions);

      // Generate project
      this.startSpinner('Generating MCP server...');
      
      await this.generator.generateProject(generationOptions);
      
      this.succeedSpinner('MCP server generated successfully');

      // AI Enhancement (if enabled)
      await this.applyAiEnhancements(generationOptions, mergedOptions);

      // Display success message and next steps
      this.displaySuccessMessage(projectName, generationOptions, mergedOptions);
      
      this.logInfo(`Generation completed in ${this.formatDuration(startTime)}`);

    } catch (error) {
      await this.handleError(error as Error, 'Project generation');
    }
  }

  private validateProjectName(projectName: string): void {
    if (!projectName) {
      throw new Error('Project name is required');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
      throw new Error('Project name must contain only letters, numbers, hyphens, and underscores');
    }

    if (projectName.length < 2 || projectName.length > 50) {
      throw new Error('Project name must be between 2 and 50 characters');
    }
  }

  private async getGenerationOptions(
    projectName: string, 
    options: NewCommandOptions
  ): Promise<ExtendedGenerationOptions> {
    if (options.interactive) {
      return await this.getInteractiveOptions(projectName, options);
    } else {
      return await this.getCliOptions(projectName, options);
    }
  }

  private async getInteractiveOptions(
    projectName: string, 
    options: NewCommandOptions
  ): Promise<ExtendedGenerationOptions> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: 'OpenAPI specification file:',
        default: options.input,
        validate: (input: string) => {
          if (!input) return 'OpenAPI specification file is required';
          if (!existsSync(input)) return 'File does not exist';
          return true;
        }
      },
      {
        type: 'list',
        name: 'language',
        message: 'Target language:',
        choices: [
          { name: 'TypeScript', value: 'typescript' },
          { name: 'Python', value: 'python' },
          { name: 'Go', value: 'go' }
        ],
        default: options.language || 'typescript'
      },
      {
        type: 'list',
        name: 'template',
        message: 'Template:',
        choices: [
          { name: 'Basic', value: 'basic' },
          { name: 'Enterprise', value: 'enterprise' },
          { name: 'Minimal', value: 'minimal' }
        ],
        default: options.template || 'basic'
      },
      {
        type: 'input',
        name: 'output',
        message: 'Output directory:',
        default: options.output || process.cwd(),
        validate: (input: string) => {
          const resolved = resolve(input);
          if (existsSync(resolved) && !statSync(resolved).isDirectory()) {
            return 'Output path must be a directory';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'auth',
        message: 'Authentication type:',
        choices: [
          { name: 'None', value: 'none' },
          { name: 'API Key', value: 'apikey' },
          { name: 'OAuth 2.0', value: 'oauth' },
          { name: 'JWT', value: 'jwt' }
        ],
        default: options.auth || 'none'
      },
      {
        type: 'confirm',
        name: 'enhanceDocs',
        message: 'Enable AI-powered documentation enhancement?',
        default: false
      },
      {
        type: 'confirm',
        name: 'generateExamples',
        message: 'Generate AI-powered code examples?',
        default: false,
        when: (answers) => answers.enhanceDocs
      },
      {
        type: 'list',
        name: 'llmProvider',
        message: 'LLM provider:',
        choices: [
          { name: 'Anthropic Claude (Recommended)', value: 'anthropic' },
          { name: 'OpenAI GPT', value: 'openai' },
          { name: 'Ollama (Local)', value: 'ollama' }
        ],
        default: 'anthropic',
        when: (answers) => answers.enhanceDocs || answers.generateExamples
      }
    ]);

    return {
      projectName,
      input: answers.input,
      language: answers.language,
      template: answers.template,
      output: answers.output,
      auth: answers.auth,
      enhanceDocs: answers.enhanceDocs,
      generateExamples: answers.generateExamples,
      llmProvider: answers.llmProvider
    };
  }

  private async getCliOptions(
    projectName: string, 
    options: NewCommandOptions
  ): Promise<ExtendedGenerationOptions> {
    // Validate required options
    this.validateRequiredOption(options.input, 'input');

    return {
      projectName,
      input: options.input!,
      language: options.language || 'typescript',
      template: options.template || 'basic',
      output: options.output || process.cwd(),
      auth: options.auth || 'none',
      enhanceDocs: options.enhanceDocs,
      generateExamples: options.generateExamples,
      llmProvider: options.llmProvider,
      llmModel: options.llmModel,
      llmApiKey: options.llmApiKey,
      enableCache: options.enableCache,
      maxCost: options.maxCost
    };
  }

  private async validateOptions(options: ExtendedGenerationOptions): Promise<void> {
    // Validate input file
    if (!existsSync(options.input)) {
      throw new Error(`OpenAPI specification file not found: ${options.input}`);
    }

    // Validate language
    const supportedLanguages: SupportedLanguage[] = ['typescript', 'python', 'go'];
    if (!supportedLanguages.includes(options.language)) {
      throw new Error(`Unsupported language: ${options.language}. Supported: ${supportedLanguages.join(', ')}`);
    }

    // Validate output directory
    const outputPath = resolve(options.output);
    const projectPath = join(outputPath, options.projectName);
    
    if (existsSync(projectPath)) {
      throw new Error(`Directory already exists: ${projectPath}`);
    }

    // Check if parent directory is writable
    try {
      if (existsSync(outputPath) && !statSync(outputPath).isDirectory()) {
        throw new Error(`Output path is not a directory: ${outputPath}`);
      }
    } catch (error) {
      throw new Error(`Cannot access output directory: ${outputPath}`);
    }
  }

  private displaySuccessMessage(projectName: string, options: ExtendedGenerationOptions, aiOptions?: any): void {
    const projectPath = join(resolve(options.output), projectName);
    
    console.log();
    this.logSuccess(`Project '${projectName}' created successfully!`);
    console.log();
    
    console.log(chalk.bold('Next steps:'));
    console.log(`  1. ${chalk.cyan(`cd ${projectPath}`)}`);
    
    switch (options.language) {
      case 'typescript':
        console.log(`  2. ${chalk.cyan('npm install')}`);
        console.log(`  3. ${chalk.cyan('npm run build')}`);
        console.log(`  4. ${chalk.cyan('npm start')}`);
        break;
      case 'python':
        console.log(`  2. ${chalk.cyan('pip install -e .')}`);
        console.log(`  3. ${chalk.cyan('python src/main.py')}`);
        break;
      case 'go':
        console.log(`  2. ${chalk.cyan('go mod tidy')}`);
        console.log(`  3. ${chalk.cyan('go run cmd/main.go')}`);
        break;
    }
    
    console.log();
    console.log(chalk.bold('Project details:'));
    console.log(`  Language: ${chalk.green(options.language)}`);
    console.log(`  Template: ${chalk.green(options.template)}`);
    console.log(`  Authentication: ${chalk.green(options.auth)}`);
    console.log(`  Location: ${chalk.blue(projectPath)}`);
    
    // Show AI enhancement status
    const hasAiFeatures = aiOptions?.enhanceDocs || aiOptions?.generateExamples;
    if (hasAiFeatures) {
      console.log(`  AI Enhanced: ${chalk.green('Yes')} (${aiOptions?.llmProvider || 'anthropic'})`);
    }
    
    console.log();
    
    console.log(chalk.dim('Tip: Use'), chalk.cyan('mcpgen validate'), chalk.dim('to check your generated server'));
  }

  private async applyAiEnhancements(
    generationOptions: ExtendedGenerationOptions,
    options: NewCommandOptions
  ): Promise<void> {
    // Check if any AI features are enabled
    if (!options.enhanceDocs && !options.generateExamples) {
      return;
    }

    try {
      // Get API key from options or environment
      const apiKey = this.getApiKey(options);
      if (!apiKey && options.llmProvider !== 'ollama') {
        this.logWarning('No API key found for AI features. Skipping AI enhancements.');
        this.logInfo('Set API key via --llm-api-key or environment variables:');
        this.logInfo('  OPENAI_API_KEY for OpenAI');
        this.logInfo('  ANTHROPIC_API_KEY for Anthropic');
        return;
      }

      // Create intelligence configuration
      const intelligenceConfig = this.createIntelligenceConfig(options, apiKey);
      
      // Initialize intelligence service
      const intelligence = new IntelligenceService({ config: intelligenceConfig as any });

      // Start AI enhancement
      this.startSpinner('Enhancing project with AI...');

      // We need to parse the OpenAPI spec again for AI enhancement
      const spec = await this.openApiParser.parseFromFile(generationOptions.input);
      
      // For now, create a mock project structure since the core generator doesn't return it
      // TODO: Modify core generator to return project data
      const mockProject = await this.createMockProject(generationOptions, spec);

      // Apply AI enhancements
      const enhanced = await intelligence.enhanceProject(mockProject as any, spec, {
        enhanceDocumentation: options.enhanceDocs,
        generateExamples: options.generateExamples,
        validateImplementation: false,
        optimizePerformance: false
      });

      // Save enhanced documentation and examples to files
      await this.saveAiEnhancements(enhanced, generationOptions);

      this.succeedSpinner('AI enhancements applied successfully');

      // Display AI enhancement results
      this.displayAiResults(enhanced);

      // Cleanup
      await intelligence.cleanup();

      // Force exit to prevent hanging from unclosed connections
      setTimeout(() => {
        process.exit(0);
      }, 500);

    } catch (error) {
      this.failSpinner('AI enhancement failed');
      this.logWarning(`AI enhancement error: ${(error as Error).message}`);
      this.logInfo('Project generated successfully without AI enhancements');
      
      // Force exit even on error to prevent hanging
      setTimeout(() => {
        process.exit(0);
      }, 500);
    }
  }

  private getApiKey(options: NewCommandOptions): string | undefined {
    // Priority: CLI option > Environment variable
    if (options.llmApiKey) {
      return options.llmApiKey;
    }

    switch (options.llmProvider) {
      case 'openai':
        return process.env.OPENAI_API_KEY;
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY;
      case 'ollama':
        return undefined; // Local model doesn't need API key
      default:
        return process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    }
  }

  private createIntelligenceConfig(options: NewCommandOptions, apiKey?: string) {
    const provider = (options.llmProvider || 'anthropic') as 'openai' | 'anthropic' | 'ollama';
    
    if (provider === 'ollama') {
      return IntelligenceUtils.createDevConfig();
    }

    const config = IntelligenceUtils.createBasicConfig(provider, apiKey);
    
    // Override model if specified
    if (options.llmModel) {
      config.llm.primary.model = options.llmModel;
    }

    // Override cache setting
    if (options.enableCache === false) {
      config.cache.enabled = false;
    }

    // Override cost limit
    if (options.maxCost) {
      config.costs.maxMonthly = typeof options.maxCost === 'string' ? parseFloat(options.maxCost) : options.maxCost;
    }

    return config;
  }

  private async createMockProject(options: ExtendedGenerationOptions, spec: any) {
    // Parse tools from the OpenAPI spec
    const tools = [];
    
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(pathItem as any)) {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(method) && operation) {
            const op = operation as any;
            if (op.operationId) {
              tools.push({
                name: op.operationId,
                description: op.summary || op.description || `${method.toUpperCase()} ${path}`,
                parameters: this.extractParameters(op),
                returnType: 'object',
                operation: op,
                path,
                method: method.toUpperCase()
              });
            }
          }
        }
      }
    }

    return {
      tools,
      resources: [],
      prompts: [],
      packageInfo: {
        name: options.projectName,
        version: '1.0.0',
        description: spec.info?.description || `MCP server for ${spec.info?.title || options.projectName}`,
        author: 'Generated by MCPGen',
        license: 'MIT'
      },
      authentication: {
        type: options.auth,
        config: {}
      }
    };
  }
  
  private extractParameters(operation: any): any[] {
    const params = [];
    
    if (operation.parameters) {
      for (const param of operation.parameters) {
        params.push({
          name: param.name,
          type: param.schema?.type || 'string',
          description: param.description,
          required: param.required || false,
          schema: param.schema || { type: 'string' }
        });
      }
    }
    
    if (operation.requestBody?.content?.['application/json']?.schema) {
      const schema = operation.requestBody.content['application/json'].schema;
      params.push({
        name: 'body',
        type: 'object',
        description: operation.requestBody.description || 'Request body',
        required: operation.requestBody.required || false,
        schema
      });
    }
    
    return params;
  }

  private async saveAiEnhancements(enhanced: any, options: ExtendedGenerationOptions): Promise<void> {
    const projectPath = join(resolve(options.output), options.projectName);

    // Save enhanced README if available
    if (enhanced.documentation?.readme) {
      const readmePath = join(projectPath, 'README.md');
      if (existsSync(readmePath)) {
        // Backup original and save enhanced version
        writeFileSync(readmePath + '.original', readFileSync(readmePath));
        writeFileSync(readmePath, enhanced.documentation.readme);
      }
    }

    // Save examples if available
    if (enhanced.examples?.length > 0) {
      const examplesDir = join(projectPath, 'examples');
      if (!existsSync(examplesDir)) {
        mkdirSync(examplesDir, { recursive: true });
      }

      for (const example of enhanced.examples) {
        const filename = `${example.title.toLowerCase().replace(/\s+/g, '-')}.${
          example.language === 'typescript' ? 'ts' : example.language
        }`;
        const examplePath = join(examplesDir, filename);
        writeFileSync(examplePath, `// ${example.title}\n// ${example.description}\n\n${example.code}`);
      }
    }
  }

  private displayAiResults(enhanced: any): void {
    console.log();
    this.logSuccess('AI Enhancement Results:');
    console.log();

    const features = enhanced.intelligence?.features || [];
    if (features.length > 0) {
      console.log(chalk.bold('Features applied:'));
      features.forEach((feature: string) => {
        console.log(`  ✓ ${chalk.green(feature)}`);
      });
    }

    if (enhanced.intelligence?.cost !== undefined) {
      console.log(`  Cost: ${chalk.cyan('$' + enhanced.intelligence.cost.toFixed(4))}`);
    }

    if (enhanced.intelligence?.cacheHits) {
      console.log(`  Cache hits: ${chalk.cyan(enhanced.intelligence.cacheHits)}`);
    }

    if (enhanced.intelligence?.processingTime) {
      console.log(`  Processing time: ${chalk.cyan(enhanced.intelligence.processingTime + 'ms')}`);
    }

    console.log();
  }

}