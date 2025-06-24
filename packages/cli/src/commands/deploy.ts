import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { templateRegistry } from '@mcpgen/templates';
import { TemplateEngine } from '@mcpgen/core';
import { BaseCommand } from './base-command.js';

interface DeployCommandOptions {
  target?: 'docker' | 'railway' | 'vercel';
  env?: 'dev' | 'staging' | 'prod';
  verbose?: boolean;
}

export class DeployCommand extends BaseCommand {
  private templateEngine: TemplateEngine;

  constructor() {
    super();
    this.templateEngine = new TemplateEngine();
  }
  register(program: Command): void {
    program
      .command('deploy [directory]')
      .description('Generate deployment configurations for MCP server')
      .option('-t, --target <platform>', 'Deployment target (docker, railway, vercel)', 'docker')
      .option('-e, --env <environment>', 'Environment (dev, staging, prod)', 'prod')
      .option('-v, --verbose', 'Verbose output', false)
      .action(async (directory: string = process.cwd(), options: DeployCommandOptions) => {
        await this.execute(directory, options);
      });
  }

  private async execute(directory: string, options: DeployCommandOptions): Promise<void> {
    try {
      this.startSpinner(`Generating ${options.target} deployment configuration...`);
      
      // Detect project type and language
      const projectInfo = await this.detectProjectStructure(directory);
      if (!projectInfo) {
        throw new Error('Could not detect MCP project structure. Make sure you\'re in a valid MCP server directory.');
      }
      
      // Generate deployment files based on target platform
      await this.generateDeploymentFiles(directory, projectInfo, options);
      
      this.succeedSpinner('Deployment configuration generated successfully');
      
      this.displayDeploymentInstructions(options);
      
    } catch (error) {
      await this.handleError(error as Error, 'Deployment configuration generation');
    }
  }

  private displayDeploymentInstructions(options: DeployCommandOptions): void {
    console.log();
    this.logInfo(`Generated ${options.target} deployment configuration for ${options.env} environment`);
    
    switch (options.target) {
      case 'docker':
        console.log('Next steps:');
        console.log('  1. docker build -t my-mcp-server .');
        console.log('  2. docker run -p 3000:3000 my-mcp-server');
        break;
        
      case 'railway':
        console.log('Next steps:');
        console.log('  1. Install Railway CLI: npm install -g @railway/cli');
        console.log('  2. Login: railway login');
        console.log('  3. Deploy: railway up');
        break;
        
      case 'vercel':
        console.log('Next steps:');
        console.log('  1. Install Vercel CLI: npm install -g vercel');
        console.log('  2. Login: vercel login');
        console.log('  3. Deploy: vercel --prod');
        break;
    }
  }

  private async detectProjectStructure(directory: string): Promise<{ language: string; rootPath: string } | null> {
    // Check for TypeScript project
    if (existsSync(join(directory, 'package.json')) && existsSync(join(directory, 'tsconfig.json'))) {
      return { language: 'typescript', rootPath: directory };
    }
    
    // Check for Python project
    if (existsSync(join(directory, 'pyproject.toml')) || existsSync(join(directory, 'requirements.txt'))) {
      return { language: 'python', rootPath: directory };
    }
    
    // Check for Go project
    if (existsSync(join(directory, 'go.mod'))) {
      return { language: 'go', rootPath: directory };
    }
    
    return null;
  }

  private async generateDeploymentFiles(
    directory: string, 
    projectInfo: { language: string; rootPath: string }, 
    options: DeployCommandOptions
  ): Promise<void> {
    const packageInfo = await this.getPackageInfo(directory, projectInfo);
    
    const templateContext = {
      project: {
        packageInfo
      },
      config: {
        language: projectInfo.language,
        environment: options.env
      },
      helpers: {}
    };

    switch (options.target) {
      case 'docker':
        await this.generateDockerFiles(directory, projectInfo, templateContext);
        break;
      case 'railway':
        await this.generateRailwayFiles(directory, projectInfo, templateContext);
        break;
      case 'vercel':
        await this.generateVercelFiles(directory, projectInfo, templateContext);
        break;
      default:
        throw new Error(`Unsupported deployment target: ${options.target}`);
    }
  }

  private async getPackageInfo(directory: string, projectInfo: { language: string; rootPath: string }): Promise<any> {
    let packageInfo = {
      name: 'mcp-server',
      version: '1.0.0',
      description: 'MCP Server'
    };

    switch (projectInfo.language) {
      case 'typescript':
        const packageJsonPath = join(directory, 'package.json');
        if (existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          packageInfo = {
            name: packageJson.name || packageInfo.name,
            version: packageJson.version || packageInfo.version,
            description: packageJson.description || packageInfo.description
          };
        }
        break;
      case 'python':
        // Try to parse pyproject.toml for package info
        // For simplicity, using defaults here
        break;
      case 'go':
        // Parse go.mod for module name
        const goModPath = join(directory, 'go.mod');
        if (existsSync(goModPath)) {
          const goModContent = readFileSync(goModPath, 'utf-8');
          const moduleMatch = goModContent.match(/module\s+(.+)/);
          if (moduleMatch) {
            packageInfo.name = moduleMatch[1].split('/').pop() || packageInfo.name;
          }
        }
        break;
    }

    return packageInfo;
  }

  private async generateDockerFiles(
    directory: string, 
    projectInfo: { language: string; rootPath: string }, 
    templateContext: any
  ): Promise<void> {
    try {
      // Generate Dockerfile using template registry
      const dockerfileTemplate = templateRegistry.getTemplate(projectInfo.language, 'deployment', 'Dockerfile');
      const dockerfileContent = this.templateEngine.renderString(dockerfileTemplate, templateContext);
      writeFileSync(join(directory, 'Dockerfile'), dockerfileContent);

      // Generate docker-compose.yml
      const dockerComposeContent = this.generateDockerCompose(templateContext);
      writeFileSync(join(directory, 'docker-compose.yml'), dockerComposeContent);

      // Generate .dockerignore
      const dockerignoreContent = this.generateDockerignore(projectInfo.language);
      writeFileSync(join(directory, '.dockerignore'), dockerignoreContent);

    } catch (error) {
      // Fallback to basic templates if registry templates fail
      this.logWarning('Using fallback Docker templates');
      await this.generateBasicDockerFiles(directory, projectInfo, templateContext);
    }
  }

  private async generateBasicDockerFiles(
    directory: string, 
    projectInfo: { language: string; rootPath: string }, 
    templateContext: any
  ): Promise<void> {
    const dockerfile = this.generateBasicDockerfile(projectInfo.language, templateContext);
    writeFileSync(join(directory, 'Dockerfile'), dockerfile);

    const dockerCompose = this.generateDockerCompose(templateContext);
    writeFileSync(join(directory, 'docker-compose.yml'), dockerCompose);
  }

  private generateBasicDockerfile(language: string, context: any): string {
    switch (language) {
      case 'typescript':
        return `FROM node:18-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm ci --only=production\n\nCOPY dist/ ./dist/\n\nEXPOSE 3000\n\nUSER node\n\nCMD ["node", "dist/index.js"]\n`;
      case 'python':
        return `FROM python:3.11-slim\n\nWORKDIR /app\n\nCOPY requirements.txt ./\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY src/ ./src/\n\nEXPOSE 8000\n\nCMD ["python", "src/main.py"]\n`;
      case 'go':
        return `FROM golang:1.19-alpine AS builder\n\nWORKDIR /app\nCOPY go.* ./\nRUN go mod download\n\nCOPY . .\nRUN go build -o server cmd/main.go\n\nFROM alpine:latest\nRUN apk --no-cache add ca-certificates\nWORKDIR /root/\n\nCOPY --from=builder /app/server .\n\nEXPOSE 8080\n\nCMD ["./server"]\n`;
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private generateDockerCompose(context: any): string {
    return `version: '3.8'\n\nservices:\n  mcp-server:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production\n    restart: unless-stopped\n    healthcheck:\n      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]\n      interval: 30s\n      timeout: 10s\n      retries: 3\n`;
  }

  private generateDockerignore(language: string): string {
    const common = `node_modules\nnpm-debug.log*\n.git\n.gitignore\nREADME.md\n.env\n.env.local\n.env.*.local\n`;
    
    switch (language) {
      case 'typescript':
        return `${common}src\ntsconfig.json\n*.ts\n!dist\n`;
      case 'python':
        return `${common}__pycache__\n*.pyc\n*.pyo\n*.pyd\n.pytest_cache\n.coverage\n`;
      case 'go':
        return `${common}*.go\n!go.mod\n!go.sum\n`;
      default:
        return common;
    }
  }

  private async generateRailwayFiles(
    directory: string, 
    projectInfo: { language: string; rootPath: string }, 
    templateContext: any
  ): Promise<void> {
    // Generate railway.toml
    const railwayConfig = `[build]\nbuilder = "DOCKERFILE"\n\n[deploy]\nstartCommand = "${this.getStartCommand(projectInfo.language)}"\nrestartPolicyType = "ON_FAILURE"\nrestartPolicyMaxRetries = 10\n`;
    
    writeFileSync(join(directory, 'railway.toml'), railwayConfig);
    
    // Generate Dockerfile if it doesn't exist
    if (!existsSync(join(directory, 'Dockerfile'))) {
      const dockerfile = this.generateBasicDockerfile(projectInfo.language, templateContext);
      writeFileSync(join(directory, 'Dockerfile'), dockerfile);
    }
  }

  private async generateVercelFiles(
    directory: string, 
    projectInfo: { language: string; rootPath: string }, 
    templateContext: any
  ): Promise<void> {
    if (projectInfo.language !== 'typescript') {
      throw new Error('Vercel deployment is currently only supported for TypeScript projects');
    }

    // Generate vercel.json
    const vercelConfig = {
      version: 2,
      builds: [
        {
          src: "dist/index.js",
          use: "@vercel/node"
        }
      ],
      routes: [
        {
          src: "/(.*)",
          dest: "dist/index.js"
        }
      ]
    };
    
    writeFileSync(join(directory, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
  }

  private getStartCommand(language: string): string {
    switch (language) {
      case 'typescript':
        return 'node dist/index.js';
      case 'python':
        return 'python src/main.py';
      case 'go':
        return './server';
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
}