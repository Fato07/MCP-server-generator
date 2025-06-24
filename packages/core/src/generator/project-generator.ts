import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { OpenAPIParser } from '../parsers/openapi-parser.js';
import { TemplateEngine } from '../template/template-engine.js';
import { templateRegistry } from '@mcpgen/templates';
import { 
  GenerationContext, 
  GenerationOptions, 
  GeneratedProject, 
  ValidationResult,
  SupportedLanguage,
  MCPGenConfig,
  PackageInfo
} from '../types/index.js';

export class ProjectGenerator {
  private openApiParser: OpenAPIParser;
  private templateEngine: TemplateEngine;
  private plugins: Map<string, any> = new Map();

  constructor() {
    this.openApiParser = new OpenAPIParser();
    this.templateEngine = new TemplateEngine();
  }

  async generateProject(options: GenerationOptions): Promise<void> {
    // Validate input
    const validationResult = await this.validateInput(options);
    if (!validationResult.valid) {
      throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
    }

    // Parse OpenAPI specification
    const spec = await this.openApiParser.parseFromFile(options.input);

    // Create generation context
    const context = this.createGenerationContext(options, spec);

    // Generate project structure
    await this.generateProjectStructure(context);

    // Generate code files
    await this.generateCodeFiles(context);

    // Generate configuration files
    await this.generateConfigFiles(context);

    // Generate documentation
    await this.generateDocumentation(context);

    console.log(`Project '${options.projectName}' generated successfully at: ${options.output}`);
  }

  private async validateInput(options: GenerationOptions): Promise<ValidationResult> {
    const errors: any[] = [];

    // Check if input file exists
    if (!existsSync(options.input)) {
      errors.push({
        code: 'INPUT_NOT_FOUND',
        message: `Input file not found: ${options.input}`,
        path: 'input',
        severity: 'error'
      });
    }

    // Validate language
    if (!['typescript', 'python', 'go'].includes(options.language)) {
      errors.push({
        code: 'UNSUPPORTED_LANGUAGE',
        message: `Unsupported language: ${options.language}`,
        path: 'language',
        severity: 'error'
      });
    }

    // Validate project name
    if (!options.projectName || !/^[a-zA-Z0-9-_]+$/.test(options.projectName)) {
      errors.push({
        code: 'INVALID_PROJECT_NAME',
        message: 'Project name must contain only letters, numbers, hyphens, and underscores',
        path: 'projectName',
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private createGenerationContext(options: GenerationOptions, spec: any): GenerationContext {
    const config: MCPGenConfig = {
      language: options.language,
      template: options.template,
      plugins: [],
      validation: {
        strict: true,
        mcp_version: '2025-03-26'
      }
    };

    return {
      projectName: options.projectName,
      config,
      openApiSpec: spec,
      outputPath: options.output
    };
  }

  private async generateProjectStructure(context: GenerationContext): Promise<void> {
    const { outputPath, projectName } = context;
    const projectPath = join(outputPath, projectName);

    // Create main project directory
    this.ensureDirectoryExists(projectPath);

    // Create language-specific structure
    switch (context.config.language) {
      case 'typescript':
        this.createTypescriptStructure(projectPath);
        break;
      case 'python':
        this.createPythonStructure(projectPath);
        break;
      case 'go':
        this.createGoStructure(projectPath);
        break;
    }
  }

  private createTypescriptStructure(projectPath: string): void {
    const dirs = [
      'src',
      'src/tools',
      'src/resources',
      'src/types',
      'tests',
      'docs'
    ];

    dirs.forEach(dir => {
      this.ensureDirectoryExists(join(projectPath, dir));
    });
  }

  private createPythonStructure(projectPath: string): void {
    const dirs = [
      'src',
      'src/tools',
      'src/resources',
      'tests',
      'docs'
    ];

    dirs.forEach(dir => {
      this.ensureDirectoryExists(join(projectPath, dir));
    });
  }

  private createGoStructure(projectPath: string): void {
    const dirs = [
      'cmd',
      'internal',
      'internal/tools',
      'internal/resources',
      'pkg',
      'tests',
      'docs'
    ];

    dirs.forEach(dir => {
      this.ensureDirectoryExists(join(projectPath, dir));
    });
  }

  private async generateCodeFiles(context: GenerationContext): Promise<void> {
    // Extract MCP components from OpenAPI spec
    const tools = this.openApiParser.extractTools();
    const resources = this.openApiParser.extractResources();

    const project: GeneratedProject = {
      tools,
      resources,
      prompts: [], // TODO: Implement prompt extraction
      packageInfo: this.createPackageInfo(context),
      authentication: context.config.language === 'typescript' ? { type: 'none', config: {} } : undefined
    };

    // Generate main server file
    await this.generateMainServerFile(context, project);

    // Generate tool files
    await this.generateToolFiles(context, project);

    // Generate resource files
    await this.generateResourceFiles(context, project);
  }

  private async generateMainServerFile(context: GenerationContext, project: GeneratedProject): Promise<void> {
    const { projectName, outputPath, config } = context;
    const projectPath = join(outputPath, projectName);

    let templateContent: string;
    let fileName: string;

    switch (config.language) {
      case 'typescript':
        templateContent = templateRegistry.getTemplate('typescript', 'server', 'basic');
        fileName = 'src/index.ts';
        break;
      case 'python':
        templateContent = templateRegistry.getTemplate('python', 'server', 'basic');
        fileName = 'src/main.py';
        break;
      case 'go':
        templateContent = this.getGoServerTemplate();
        fileName = 'cmd/main.go';
        break;
      default:
        throw new Error(`Unsupported language: ${config.language}`);
    }

    const templateContext = {
      project,
      config: context,
      helpers: {
        snake_case: (str: string) => str.toLowerCase().replace(/[\s-]/g, '_').replace(/[^a-zA-Z0-9_]/g, ''),
        camelCase: (str: string) => str.charAt(0).toLowerCase() + str.slice(1).replace(/[\s-_](.)/g, (_, char) => char.toUpperCase()),
        pascalCase: (str: string) => str.charAt(0).toUpperCase() + str.slice(1).replace(/[\s-_](.)/g, (_, char) => char.toUpperCase()),
        toPythonType: (type: string) => {
          switch (type.toLowerCase()) {
            case 'string': return 'str';
            case 'integer': return 'int';
            case 'number': return 'float';
            case 'boolean': return 'bool';
            case 'array': return 'List[Any]';
            case 'object': return 'Dict[str, Any]';
            default: return 'Any';
          }
        }
      }
    };

    const generatedCode = this.templateEngine.renderString(templateContent, templateContext);
    const filePath = join(projectPath, fileName);
    
    this.ensureDirectoryExists(dirname(filePath));
    writeFileSync(filePath, generatedCode, 'utf-8');
  }

  private async generateToolFiles(context: GenerationContext, project: GeneratedProject): Promise<void> {
    const { projectName, outputPath, config } = context;
    const projectPath = join(outputPath, projectName);

    for (const tool of project.tools) {
      let templateContent: string;
      let fileName: string;

      switch (config.language) {
        case 'typescript':
          templateContent = this.getTypescriptToolTemplate();
          fileName = `src/tools/${tool.name}.ts`;
          break;
        case 'python':
          templateContent = this.getPythonToolTemplate();
          fileName = `src/tools/${tool.name}.py`;
          break;
        case 'go':
          templateContent = this.getGoToolTemplate();
          fileName = `internal/tools/${tool.name}.go`;
          break;
        default:
          continue;
      }

      const templateContext = {
        tool,
        project,
        config: context,
        helpers: {}
      };

      const generatedCode = this.templateEngine.renderString(templateContent, templateContext);
      const filePath = join(projectPath, fileName);
      
      this.ensureDirectoryExists(dirname(filePath));
      writeFileSync(filePath, generatedCode, 'utf-8');
    }
  }

  private async generateResourceFiles(context: GenerationContext, project: GeneratedProject): Promise<void> {
    // Similar to generateToolFiles but for resources
    // Implementation would be similar, just different templates
  }

  private async generateConfigFiles(context: GenerationContext): Promise<void> {
    const { projectName, outputPath, config } = context;
    const projectPath = join(outputPath, projectName);
    
    const project = {
      packageInfo: this.createPackageInfo(context),
      tools: this.openApiParser.extractTools(),
      resources: this.openApiParser.extractResources(),
      prompts: []
    };

    const templateContext = {
      project,
      config: context,
      helpers: {
        snake_case: (str: string) => str.toLowerCase().replace(/[\s-]/g, '_').replace(/[^a-zA-Z0-9_]/g, ''),
        camelCase: (str: string) => str.charAt(0).toLowerCase() + str.slice(1).replace(/[\s-_](.)/g, (_, char) => char.toUpperCase()),
        pascalCase: (str: string) => str.charAt(0).toUpperCase() + str.slice(1).replace(/[\s-_](.)/g, (_, char) => char.toUpperCase())
      }
    };

    switch (config.language) {
      case 'typescript':
        await this.generateTypescriptConfigFiles(projectPath, context, templateContext);
        break;
      case 'python':
        await this.generatePythonConfigFiles(projectPath, context, templateContext);
        break;
      case 'go':
        await this.generateGoConfigFiles(projectPath, context);
        break;
    }
  }

  private async generateTypescriptConfigFiles(projectPath: string, context: GenerationContext, templateContext: any): Promise<void> {
    // Generate package.json
    const packageJson = {
      name: context.projectName,
      version: '1.0.0',
      description: context.openApiSpec.info?.description || 'Generated MCP Server',
      type: 'module',
      main: 'dist/index.js',
      scripts: {
        build: 'tsc',
        start: 'node dist/index.js',
        dev: 'tsx watch src/index.ts',
        test: 'jest'
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^0.4.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        'tsx': '^4.0.0',
        '@types/node': '^20.0.0'
      }
    };

    writeFileSync(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Generate tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: true,
        outDir: './dist',
        rootDir: './src',
        declaration: true,
        sourceMap: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    writeFileSync(join(projectPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
  }

  private async generatePythonConfigFiles(projectPath: string, context: GenerationContext, templateContext: any): Promise<void> {
    // Generate pyproject.toml
    const pyprojectTemplate = templateRegistry.getTemplate('python', 'config', 'pyproject.toml');
    const pyprojectContent = this.templateEngine.renderString(pyprojectTemplate, templateContext);
    writeFileSync(join(projectPath, 'pyproject.toml'), pyprojectContent);

    // Generate requirements.txt
    const requirementsTemplate = templateRegistry.getTemplate('python', 'config', 'requirements.txt');
    const requirementsContent = this.templateEngine.renderString(requirementsTemplate, templateContext);
    writeFileSync(join(projectPath, 'requirements.txt'), requirementsContent);

    // Generate .gitignore
    const gitignoreTemplate = templateRegistry.getTemplate('python', 'config', '.gitignore');
    const gitignoreContent = this.templateEngine.renderString(gitignoreTemplate, templateContext);
    writeFileSync(join(projectPath, '.gitignore'), gitignoreContent);
  }

  private async generateGoConfigFiles(projectPath: string, context: GenerationContext): Promise<void> {
    // Generate go.mod
    const goMod = `module ${context.projectName}

go 1.19

require (
    github.com/mark3labs/mcp-go v0.1.0
)
`;

    writeFileSync(join(projectPath, 'go.mod'), goMod);
  }

  private async generateDocumentation(context: GenerationContext): Promise<void> {
    const { projectName, outputPath, config } = context;
    const projectPath = join(outputPath, projectName);
    
    const project = {
      packageInfo: this.createPackageInfo(context),
      tools: this.openApiParser.extractTools(),
      resources: this.openApiParser.extractResources(),
      prompts: []
    };

    const templateContext = {
      project,
      config: context,
      helpers: {
        snake_case: (str: string) => str.toLowerCase().replace(/[\s-]/g, '_').replace(/[^a-zA-Z0-9_]/g, ''),
        toPythonType: (type: string) => {
          switch (type.toLowerCase()) {
            case 'string': return 'str';
            case 'integer': return 'int';
            case 'number': return 'float';
            case 'boolean': return 'bool';
            case 'array': return 'List[Any]';
            case 'object': return 'Dict[str, Any]';
            default: return 'Any';
          }
        }
      }
    };

    // Generate README using appropriate template
    const readmeTemplate = templateRegistry.getTemplate(config.language, 'docs', 'README.md');
    const readmeContent = this.templateEngine.renderString(readmeTemplate, templateContext);
    writeFileSync(join(projectPath, 'README.md'), readmeContent);
  }

  private createPackageInfo(context: GenerationContext): PackageInfo {
    return {
      name: context.projectName,
      version: '1.0.0',
      description: context.openApiSpec.info?.description || 'Generated MCP Server',
      author: context.openApiSpec.info?.contact?.name,
      license: context.openApiSpec.info?.license?.name || 'MIT'
    };
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  // Template methods - these would normally be loaded from files
  private getTypescriptServerTemplate(): string {
    return `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: '{{project.packageInfo.name}}',
  version: '{{project.packageInfo.version}}'
});

// Register request handler for all tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  
  switch (toolName) {
    {{#each project.tools}}
    case '{{name}}':
      // Implementation for {{name}}
      // TODO: Add your implementation here
      return {
        content: [
          {
            type: 'text',
            text: 'Tool {{name}} executed successfully'
          }
        ]
      };
    {{/each}}
    
    default:
      return {
        content: [
          {
            type: 'text',
            text: \`Unknown tool: \${toolName}\`
          }
        ],
        isError: true
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('{{project.packageInfo.name}} MCP server running on stdio');
}

main().catch(console.error);
`;
  }

  private getPythonServerTemplate(): string {
    return `from mcp.server.fastmcp import FastMCP

app = FastMCP("{{project.packageInfo.name}}")

{{#each project.tools}}
@app.tool()
def {{name}}({{#each parameters}}{{name}}: {{toPythonType type}}{{#unless @last}}, {{/unless}}{{/each}}) -> dict:
    """{{description}}"""
    # TODO: Implement {{name}}
    return {"result": "Tool {{name}} executed successfully"}

{{/each}}

if __name__ == "__main__":
    app.run()
`;
  }

  private getGoServerTemplate(): string {
    return `package main

import (
    "context"
    "fmt"
    "log"
    
    "github.com/mark3labs/mcp-go/mcp"
)

func main() {
    server := mcp.NewServer("{{project.packageInfo.name}}", "{{project.packageInfo.version}}")
    
    {{#each project.tools}}
    // Tool: {{name}}
    server.AddTool("{{name}}", "{{description}}", {{name}}Handler)
    {{/each}}
    
    if err := server.Serve(); err != nil {
        log.Fatal(err)
    }
}

{{#each project.tools}}
func {{name}}Handler(ctx context.Context, args map[string]interface{}) (interface{}, error) {
    // TODO: Implement {{name}}
    return map[string]interface{}{
        "result": "Tool {{name}} executed successfully",
    }, nil
}

{{/each}}
`;
  }

  private getTypescriptToolTemplate(): string {
    return `// Tool implementation for {{tool.name}}

export interface {{pascalCase tool.name}}Args {
{{#each tool.parameters}}
  {{name}}{{#unless required}}?{{/unless}}: {{toTypescriptType type}};
{{/each}}
}

export async function {{camelCase tool.name}}(args: {{pascalCase tool.name}}Args): Promise<any> {
  // Validate parameters
{{#each tool.parameters}}
  {{{generateValidation this 'typescript'}}}
{{/each}}

  // TODO: Implement the actual functionality
  // This tool maps to: {{tool.method}} {{tool.path}}
  
  return {
    success: true,
    message: 'Tool {{tool.name}} executed successfully'
  };
}
`;
  }

  private getPythonToolTemplate(): string {
    return `"""Tool implementation for {{tool.name}}"""

from typing import Dict, Any{{#if tool.parameters}}, Optional{{/if}}

def {{snake_case tool.name}}({{#each tool.parameters}}{{name}}: {{toPythonType type}}{{#unless @last}}, {{/unless}}{{/each}}) -> Dict[str, Any]:
    """{{tool.description}}
    
    Args:
    {{#each tool.parameters}}
        {{name}}: {{description}}
    {{/each}}
    
    Returns:
        Dict containing the result of the operation
    """
    
    # Validate parameters
{{#each tool.parameters}}
    {{{generateValidation this 'python'}}}
{{/each}}

    # TODO: Implement the actual functionality
    # This tool maps to: {{tool.method}} {{tool.path}}
    
    return {
        "success": True,
        "message": "Tool {{tool.name}} executed successfully"
    }
`;
  }

  private getGoToolTemplate(): string {
    return `package tools

import (
    "context"
    "fmt"
)

// {{pascalCase tool.name}} implements the {{tool.name}} tool
// This tool maps to: {{tool.method}} {{tool.path}}
func {{pascalCase tool.name}}(ctx context.Context, args map[string]interface{}) (interface{}, error) {
    // Extract parameters
{{#each tool.parameters}}
    {{name}}, ok := args["{{name}}"]
    if !ok {
        return nil, fmt.Errorf("missing required parameter: {{name}}")
    }
{{/each}}

    // TODO: Implement the actual functionality
    
    return map[string]interface{}{
        "success": true,
        "message": "Tool {{tool.name}} executed successfully",
    }, nil
}
`;
  }
}