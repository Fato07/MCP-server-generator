import { Command } from 'commander';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { templateRegistry } from '@mcpgen/templates';
import { TemplateEngine } from '@mcpgen/core';
import { BaseCommand } from './base-command.js';

interface AddCommandOptions {
  verbose?: boolean;
}

export class AddCommand extends BaseCommand {
  private templateEngine: TemplateEngine;

  constructor() {
    super();
    this.templateEngine = new TemplateEngine();
  }
  register(program: Command): void {
    const addCommand = program
      .command('add')
      .description('Add components to an existing MCP server');

    addCommand
      .command('tool <name>')
      .description('Add a new tool to the MCP server')
      .option('-t, --template <name>', 'Tool template to use')
      .option('-v, --verbose', 'Verbose output', false)
      .action(async (name: string, options: AddCommandOptions) => {
        await this.addTool(name, options);
      });

    addCommand
      .command('resource <name>')
      .description('Add a new resource to the MCP server')
      .option('-t, --template <name>', 'Resource template to use')
      .option('-v, --verbose', 'Verbose output', false)
      .action(async (name: string, options: AddCommandOptions) => {
        await this.addResource(name, options);
      });

    addCommand
      .command('prompt <name>')
      .description('Add a new prompt to the MCP server')
      .option('-t, --template <name>', 'Prompt template to use')
      .option('-v, --verbose', 'Verbose output', false)
      .action(async (name: string, options: AddCommandOptions) => {
        await this.addPrompt(name, options);
      });
  }

  private async addTool(name: string, options: AddCommandOptions): Promise<void> {
    try {
      this.startSpinner(`Adding tool '${name}'...`);
      
      // Detect project language and structure
      const projectInfo = await this.detectProjectStructure();
      if (!projectInfo) {
        throw new Error('Could not detect MCP project structure. Make sure you\'re in a valid MCP server directory.');
      }

      // Validate tool name
      this.validateToolName(name);
      
      // Create tool file
      await this.createToolFile(name, projectInfo, options);
      
      // Update main server file to register the tool
      await this.updateMainServerFile(name, projectInfo);
      
      this.succeedSpinner(`Tool '${name}' added successfully`);
      this.logInfo(`Tool created at: ${this.getToolFilePath(name, projectInfo)}`);
      this.logInfo('Don\'t forget to implement the tool logic and test it!');
      
    } catch (error) {
      await this.handleError(error as Error, 'Adding tool');
    }
  }

  private async addResource(name: string, options: AddCommandOptions): Promise<void> {
    try {
      this.startSpinner(`Adding resource '${name}'...`);
      
      // TODO: Implement resource addition
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      
      this.succeedSpinner(`Resource '${name}' added successfully`);
      this.logInfo('Don\'t forget to implement the resource logic and test it!');
      
    } catch (error) {
      await this.handleError(error as Error, 'Adding resource');
    }
  }

  private async addPrompt(name: string, options: AddCommandOptions): Promise<void> {
    try {
      this.startSpinner(`Adding prompt '${name}'...`);
      
      // TODO: Implement prompt addition
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
      
      this.succeedSpinner(`Prompt '${name}' added successfully`);
      this.logInfo('Don\'t forget to implement the prompt logic and test it!');
      
    } catch (error) {
      await this.handleError(error as Error, 'Adding prompt');
    }
  }

  private async detectProjectStructure(): Promise<{ language: string; rootPath: string } | null> {
    const cwd = process.cwd();
    
    // Check for TypeScript project
    if (existsSync(join(cwd, 'package.json')) && existsSync(join(cwd, 'tsconfig.json'))) {
      return { language: 'typescript', rootPath: cwd };
    }
    
    // Check for Python project
    if (existsSync(join(cwd, 'pyproject.toml')) || existsSync(join(cwd, 'requirements.txt'))) {
      return { language: 'python', rootPath: cwd };
    }
    
    // Check for Go project
    if (existsSync(join(cwd, 'go.mod'))) {
      return { language: 'go', rootPath: cwd };
    }
    
    return null;
  }

  private validateToolName(name: string): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Tool name is required');
    }
    
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error('Tool name must start with a letter and contain only letters, numbers, and underscores');
    }
    
    if (name.length < 2 || name.length > 50) {
      throw new Error('Tool name must be between 2 and 50 characters');
    }
  }

  private async createToolFile(name: string, projectInfo: { language: string; rootPath: string }, options: AddCommandOptions): Promise<void> {
    const toolsDir = this.getToolsDirectory(projectInfo);
    
    // Ensure tools directory exists
    if (!existsSync(toolsDir)) {
      mkdirSync(toolsDir, { recursive: true });
    }
    
    const toolFilePath = this.getToolFilePath(name, projectInfo);
    
    if (existsSync(toolFilePath)) {
      throw new Error(`Tool file already exists: ${toolFilePath}`);
    }
    
    // Generate tool code from template
    const toolCode = this.generateToolCode(name, projectInfo);
    
    writeFileSync(toolFilePath, toolCode, 'utf-8');
  }

  private getToolsDirectory(projectInfo: { language: string; rootPath: string }): string {
    switch (projectInfo.language) {
      case 'typescript':
        return join(projectInfo.rootPath, 'src', 'tools');
      case 'python':
        return join(projectInfo.rootPath, 'src', 'tools');
      case 'go':
        return join(projectInfo.rootPath, 'internal', 'tools');
      default:
        throw new Error(`Unsupported language: ${projectInfo.language}`);
    }
  }

  private getToolFilePath(name: string, projectInfo: { language: string; rootPath: string }): string {
    const toolsDir = this.getToolsDirectory(projectInfo);
    switch (projectInfo.language) {
      case 'typescript':
        return join(toolsDir, `${name}.ts`);
      case 'python':
        return join(toolsDir, `${name}.py`);
      case 'go':
        return join(toolsDir, `${name}.go`);
      default:
        throw new Error(`Unsupported language: ${projectInfo.language}`);
    }
  }

  private generateToolCode(name: string, projectInfo: { language: string; rootPath: string }): string {
    const templateContext = {
      tool: {
        name,
        description: `Tool ${name} implementation`,
        parameters: [],
        returnType: 'object',
        operation: null,
        path: '',
        method: ''
      },
      project: {
        packageInfo: {
          name: 'current-project'
        }
      },
      config: {
        language: projectInfo.language
      },
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

    // Generate basic tool template
    switch (projectInfo.language) {
      case 'typescript':
        return `/**
 * Tool: ${name}
 * Description: ${templateContext.tool.description}
 */

export interface ${templateContext.helpers.pascalCase(name)}Args {
  // Add your parameters here
  // example: string;
}

export async function ${templateContext.helpers.camelCase(name)}(args: ${templateContext.helpers.pascalCase(name)}Args): Promise<any> {
  // TODO: Implement ${name} tool logic
  
  return {
    success: true,
    message: 'Tool ${name} executed successfully',
    data: {}
  };
}
`;
      
      case 'python':
        return `"""
Tool: ${name}
Description: ${templateContext.tool.description}
"""

from typing import Dict, Any

def ${templateContext.helpers.snake_case(name)}(**kwargs) -> Dict[str, Any]:
    """
    ${templateContext.tool.description}
    
    Args:
        **kwargs: Tool arguments
    
    Returns:
        Dict[str, Any]: Result of the ${name} operation
    """
    
    # TODO: Implement ${name} tool logic
    
    return {
        "success": True,
        "message": "Tool ${name} executed successfully",
        "data": {}
    }
`;
      
      case 'go':
        return `package tools

import (
	"context"
	"fmt"
)

// ${templateContext.helpers.pascalCase(name)} implements the ${name} tool
func ${templateContext.helpers.pascalCase(name)}(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	// TODO: Implement ${name} tool logic
	
	return map[string]interface{}{
		"success": true,
		"message": "Tool ${name} executed successfully",
		"data":    map[string]interface{}{},
	}, nil
}
`;
      
      default:
        throw new Error(`Unsupported language: ${projectInfo.language}`);
    }
  }

  private async updateMainServerFile(name: string, projectInfo: { language: string; rootPath: string }): Promise<void> {
    const mainFilePath = this.getMainServerFilePath(projectInfo);
    
    if (!existsSync(mainFilePath)) {
      this.logWarning(`Main server file not found: ${mainFilePath}`);
      this.logInfo('You may need to manually register the tool in your main server file.');
      return;
    }
    
    // For now, just log instructions for manual update
    // TODO: Implement automatic server file updates
    this.logInfo('To register the tool in your server:');
    
    switch (projectInfo.language) {
      case 'typescript':
        this.logInfo(`1. Import the tool: import { ${this.camelCase(name)} } from './tools/${name}.js';`);
        this.logInfo(`2. Add to switch statement: case '${name}': return await ${this.camelCase(name)}(args);`);
        break;
      case 'python':
        this.logInfo(`1. Import the tool: from tools.${name} import ${this.snakeCase(name)}`);
        this.logInfo(`2. Add the @app.tool() decorator and register the function`);
        break;
      case 'go':
        this.logInfo(`1. Import the tool: import "./internal/tools"`);
        this.logInfo(`2. Register: server.AddTool("${name}", "${name} tool", tools.${this.pascalCase(name)})`);
        break;
    }
  }

  private getMainServerFilePath(projectInfo: { language: string; rootPath: string }): string {
    switch (projectInfo.language) {
      case 'typescript':
        return join(projectInfo.rootPath, 'src', 'index.ts');
      case 'python':
        return join(projectInfo.rootPath, 'src', 'main.py');
      case 'go':
        return join(projectInfo.rootPath, 'cmd', 'main.go');
      default:
        throw new Error(`Unsupported language: ${projectInfo.language}`);
    }
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1).replace(/[\s-_](.)/g, (_, char) => char.toUpperCase());
  }

  private snakeCase(str: string): string {
    return str.toLowerCase().replace(/[\s-]/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  }

  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/[\s-_](.)/g, (_, char) => char.toUpperCase());
  }
}