import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TemplateContext, SupportedLanguage } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private registeredTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private registeredPartials: Map<string, string> = new Map();

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerBuiltinHelpers();
  }

  registerTemplate(name: string, templateContent: string): void {
    const compiled = this.handlebars.compile(templateContent);
    this.registeredTemplates.set(name, compiled);
  }

  registerTemplateFromFile(name: string, filePath: string): void {
    const templateContent = readFileSync(filePath, 'utf-8');
    this.registerTemplate(name, templateContent);
  }

  registerPartial(name: string, partialContent: string): void {
    this.handlebars.registerPartial(name, partialContent);
    this.registeredPartials.set(name, partialContent);
  }

  registerPartialFromFile(name: string, filePath: string): void {
    const partialContent = readFileSync(filePath, 'utf-8');
    this.registerPartial(name, partialContent);
  }

  registerHelper(name: string, helper: Handlebars.HelperDelegate): void {
    this.handlebars.registerHelper(name, helper);
  }

  render(templateName: string, context: TemplateContext): string {
    const template = this.registeredTemplates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return template(context);
  }

  renderString(templateContent: string, context: TemplateContext): string {
    const template = this.handlebars.compile(templateContent);
    return template(context);
  }

  private registerBuiltinHelpers(): void {
    // Type conversion helpers
    this.handlebars.registerHelper('toTypescriptType', (type: string) => {
      return this.convertToTypescriptType(type);
    });

    this.handlebars.registerHelper('toPythonType', (type: string) => {
      return this.convertToPythonType(type);
    });

    this.handlebars.registerHelper('toGoType', (type: string) => {
      return this.convertToGoType(type);
    });

    // String manipulation helpers
    this.handlebars.registerHelper('camelCase', (str: string) => {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    });

    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
    });

    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, '');
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    this.handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    this.handlebars.registerHelper('and', (a: any, b: any) => a && b);
    this.handlebars.registerHelper('or', (a: any, b: any) => a || b);

    // Array helpers
    this.handlebars.registerHelper('first', (array: any[]) => array?.[0]);
    this.handlebars.registerHelper('last', (array: any[]) => array?.[array.length - 1]);
    this.handlebars.registerHelper('length', (array: any[]) => array?.length || 0);
    this.handlebars.registerHelper('isEmpty', (array: any[]) => !array || array.length === 0);

    // JSON helpers
    this.handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));
    this.handlebars.registerHelper('jsonInline', (obj: any) => JSON.stringify(obj));

    // Code generation helpers
    this.handlebars.registerHelper('indent', (text: string, spaces: number = 2) => {
      const indentation = ' '.repeat(spaces);
      return text.split('\n').map(line => line ? indentation + line : line).join('\n');
    });

    this.handlebars.registerHelper('comment', (text: string, language: SupportedLanguage) => {
      switch (language) {
        case 'typescript':
          return `// ${text}`;
        case 'python':
          return `# ${text}`;
        case 'go':
          return `// ${text}`;
        default:
          return `// ${text}`;
      }
    });

    this.handlebars.registerHelper('multilineComment', (text: string, language: SupportedLanguage) => {
      switch (language) {
        case 'typescript':
          return `/*\n * ${text.split('\n').join('\n * ')}\n */`;
        case 'python':
          return `"""\n${text}\n"""`;
        case 'go':
          return `/*\n${text.split('\n').map(line => ` * ${line}`).join('\n')}\n */`;
        default:
          return `/*\n * ${text.split('\n').join('\n * ')}\n */`;
      }
    });

    // Parameter validation helpers
    this.handlebars.registerHelper('generateValidation', (parameter: any, language: SupportedLanguage) => {
      return this.generateParameterValidation(parameter, language);
    });

    // Import statement helpers
    this.handlebars.registerHelper('generateImports', (tools: any[], language: SupportedLanguage) => {
      return this.generateImportStatements(tools, language);
    });
  }

  private convertToTypescriptType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'number',
      'integer': 'number',
      'boolean': 'boolean',
      'object': 'object',
      'array': 'any[]',
      'unknown': 'unknown'
    };

    return typeMap[type] || 'unknown';
  }

  private convertToPythonType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'str',
      'number': 'float',
      'integer': 'int',
      'boolean': 'bool',
      'object': 'dict',
      'array': 'list',
      'unknown': 'Any'
    };

    return typeMap[type] || 'Any';
  }

  private convertToGoType(type: string): string {
    const typeMap: Record<string, string> = {
      'string': 'string',
      'number': 'float64',
      'integer': 'int',
      'boolean': 'bool',
      'object': 'map[string]interface{}',
      'array': '[]interface{}',
      'unknown': 'interface{}'
    };

    return typeMap[type] || 'interface{}';
  }

  private generateParameterValidation(parameter: any, language: SupportedLanguage): string {
    switch (language) {
      case 'typescript':
        return this.generateTypescriptValidation(parameter);
      case 'python':
        return this.generatePythonValidation(parameter);
      case 'go':
        return this.generateGoValidation(parameter);
      default:
        return '';
    }
  }

  private generateTypescriptValidation(parameter: any): string {
    const validations: string[] = [];

    if (parameter.required) {
      validations.push(`if (args.${parameter.name} === undefined || args.${parameter.name} === null) {
        throw new Error('Parameter ${parameter.name} is required');
      }`);
    }

    if (parameter.type === 'string' && parameter.schema?.minLength) {
      validations.push(`if (args.${parameter.name}.length < ${parameter.schema.minLength}) {
        throw new Error('Parameter ${parameter.name} must be at least ${parameter.schema.minLength} characters long');
      }`);
    }

    return validations.join('\n');
  }

  private generatePythonValidation(parameter: any): string {
    const validations: string[] = [];

    if (parameter.required) {
      validations.push(`if ${parameter.name} is None:
        raise ValueError('Parameter ${parameter.name} is required')`);
    }

    if (parameter.type === 'string' && parameter.schema?.minLength) {
      validations.push(`if len(${parameter.name}) < ${parameter.schema.minLength}:
        raise ValueError('Parameter ${parameter.name} must be at least ${parameter.schema.minLength} characters long')`);
    }

    return validations.join('\n');
  }

  private generateGoValidation(parameter: any): string {
    const validations: string[] = [];

    if (parameter.required && parameter.type === 'string') {
      validations.push(`if ${parameter.name} == "" {
        return fmt.Errorf("parameter ${parameter.name} is required")
      }`);
    }

    return validations.join('\n');
  }

  private generateImportStatements(tools: any[], language: SupportedLanguage): string {
    switch (language) {
      case 'typescript':
        return `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';`;
      case 'python':
        return `from mcp.server.fastmcp import FastMCP
from typing import Dict, Any, Optional`;
      case 'go':
        return `import (
    "context"
    "fmt"
    "github.com/mark3labs/mcp-go/mcp"
)`;
      default:
        return '';
    }
  }
}