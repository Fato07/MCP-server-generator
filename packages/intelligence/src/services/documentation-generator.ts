import { LLMProvider, LLMProviderFactory } from '../models/llm-provider.js';
import { SemanticCache, MemoryCache } from '../cache/semantic-cache.js';
import { OpenAPIMinifier } from '../pipeline/minifier.js';
import { PromptTemplate } from '../templates/prompts.js';
import {
  LLMConfig,
  MinifiedSpec,
  EnhancedDocumentation,
  ToolDocumentation,
  CodeExample,
  ErrorCase,
  ParameterDoc,
  GenerationContext
} from '../types/index.js';
import type { MCPTool, GeneratedProject } from '@mcpgen/core';

export interface DocumentationGeneratorOptions {
  llmConfig: LLMConfig;
  cacheConfig?: {
    enabled: boolean;
    redisUrl?: string;
    ttl?: number;
  };
  features?: {
    examples: boolean;
    errorCases: boolean;
    bestPractices: boolean;
    apiReference: boolean;
  };
}

export class DocumentationGenerator {
  private llmProvider: LLMProvider;
  private cache: SemanticCache | MemoryCache;
  private promptTemplate: PromptTemplate;
  private features: Required<DocumentationGeneratorOptions['features']>;

  constructor(options: DocumentationGeneratorOptions) {
    this.llmProvider = LLMProviderFactory.create(options.llmConfig);
    this.features = {
      examples: true,
      errorCases: true,
      bestPractices: true,
      apiReference: true,
      ...options.features
    };

    // Initialize cache
    if (options.cacheConfig?.enabled && options.cacheConfig?.redisUrl) {
      this.cache = new SemanticCache(options.cacheConfig.redisUrl, options.cacheConfig.ttl);
    } else {
      this.cache = new MemoryCache();
    }

    this.promptTemplate = new PromptTemplate();
  }

  /**
   * Generate enhanced documentation for an MCP server project
   */
  async generateEnhancedDocs(
    context: GenerationContext,
    existingReadme?: string
  ): Promise<EnhancedDocumentation> {
    const minifiedSpec = OpenAPIMinifier.minify(context.spec as any);
    
    // Generate main README
    const readme = await this.generateReadme(context, minifiedSpec, existingReadme);
    
    // Generate tool-specific documentation
    const toolDocs = await this.generateToolDocumentation(context, minifiedSpec);
    
    // Generate code examples
    const examples = this.features.examples 
      ? await this.generateCodeExamples(context, minifiedSpec)
      : [];
    
    // Generate error handling guide
    const errorGuide = this.features.errorCases
      ? await this.generateErrorGuide(context, minifiedSpec)
      : '';
    
    // Generate API reference
    const apiReference = this.features.apiReference
      ? await this.generateApiReference(context, minifiedSpec)
      : '';

    return {
      readme,
      toolDocs,
      examples,
      errorGuide,
      apiReference
    };
  }

  /**
   * Generate an enhanced README file
   */
  private async generateReadme(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec,
    existingReadme?: string
  ): Promise<string> {
    const cacheKey = `readme-${context.project.name}-${minifiedSpec.info.version}`;
    const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);
    
    if (cached) {
      return cached.content;
    }

    const prompt = this.promptTemplate.renderReadmePrompt({
      projectName: context.project.name,
      description: minifiedSpec.info.description || '',
      tools: context.project.tools,
      spec: minifiedSpec,
      existingReadme,
      language: context.language
    });

    try {
      const response = await this.llmProvider.generate(prompt, {
        maxTokens: 2000,
        temperature: 0.3
      });

      await this.cache.set(cacheKey, this.llmProvider.constructor.name, response);
      return response.content;

    } catch (error) {
      console.warn('Failed to generate enhanced README, using fallback:', error);
      return this.generateFallbackReadme(context, minifiedSpec);
    }
  }

  /**
   * Generate documentation for individual tools
   */
  private async generateToolDocumentation(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<ToolDocumentation[]> {
    const toolDocs: ToolDocumentation[] = [];

    for (const tool of context.project.tools) {
      const cacheKey = `tool-doc-${tool.name}-${tool.description?.substring(0, 50)}`;
      const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);

      if (cached) {
        toolDocs.push(JSON.parse(cached.content));
        continue;
      }

      try {
        const prompt = this.promptTemplate.renderToolDocPrompt({
          tool,
          spec: minifiedSpec,
          language: context.language,
          includeExamples: this.features.examples,
          includeErrorCases: this.features.errorCases,
          includeBestPractices: this.features.bestPractices
        });

        const response = await this.llmProvider.generate(prompt, {
          maxTokens: 1500,
          temperature: 0.2
        });

        const toolDoc = this.parseToolDocumentation(response.content, tool);
        toolDocs.push(toolDoc);

        await this.cache.set(cacheKey, this.llmProvider.constructor.name, {
          ...response,
          content: JSON.stringify(toolDoc)
        });

      } catch (error) {
        console.warn(`Failed to generate docs for tool ${tool.name}:`, error);
        toolDocs.push(this.generateFallbackToolDoc(tool));
      }
    }

    return toolDocs;
  }

  /**
   * Generate code examples for the MCP server
   */
  private async generateCodeExamples(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];
    const maxExamples = 5; // Limit to prevent token overflow

    for (let i = 0; i < Math.min(context.project.tools.length, maxExamples); i++) {
      const tool = context.project.tools[i];
      const cacheKey = `example-${tool.name}-${context.language}`;
      const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);

      if (cached) {
        examples.push(JSON.parse(cached.content));
        continue;
      }

      try {
        const prompt = this.promptTemplate.renderExamplePrompt({
          tool,
          language: context.language,
          projectName: context.project.name
        });

        const response = await this.llmProvider.generate(prompt, {
          maxTokens: 800,
          temperature: 0.4
        });

        const example = this.parseCodeExample(response.content, tool, context.language);
        examples.push(example);

        await this.cache.set(cacheKey, this.llmProvider.constructor.name, {
          ...response,
          content: JSON.stringify(example)
        });

      } catch (error) {
        console.warn(`Failed to generate example for tool ${tool.name}:`, error);
      }
    }

    return examples;
  }

  /**
   * Generate error handling guide
   */
  private async generateErrorGuide(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<string> {
    const cacheKey = `error-guide-${context.project.name}`;
    const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);

    if (cached) {
      return cached.content;
    }

    const prompt = this.promptTemplate.renderErrorGuidePrompt({
      tools: context.project.tools,
      spec: minifiedSpec,
      language: context.language
    });

    try {
      const response = await this.llmProvider.generate(prompt, {
        maxTokens: 1500,
        temperature: 0.2
      });

      await this.cache.set(cacheKey, this.llmProvider.constructor.name, response);
      return response.content;

    } catch (error) {
      console.warn('Failed to generate error guide:', error);
      return this.generateFallbackErrorGuide(context);
    }
  }

  /**
   * Generate API reference documentation
   */
  private async generateApiReference(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<string> {
    const cacheKey = `api-ref-${minifiedSpec.info.title}-${minifiedSpec.info.version}`;
    const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);

    if (cached) {
      return cached.content;
    }

    const prompt = this.promptTemplate.renderApiReferencePrompt({
      spec: minifiedSpec,
      tools: context.project.tools,
      language: context.language
    });

    try {
      const response = await this.llmProvider.generate(prompt, {
        maxTokens: 2500,
        temperature: 0.1
      });

      await this.cache.set(cacheKey, this.llmProvider.constructor.name, response);
      return response.content;

    } catch (error) {
      console.warn('Failed to generate API reference:', error);
      return this.generateFallbackApiReference(minifiedSpec);
    }
  }

  /**
   * Parse LLM response into structured tool documentation
   */
  private parseToolDocumentation(response: string, tool: MCPTool): ToolDocumentation {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      if (parsed.toolName && parsed.description) {
        return parsed;
      }
    } catch {
      // Fall back to markdown parsing
    }

    // Fallback: extract information from markdown response
    return {
      toolName: tool.name,
      description: tool.description || `Tool for ${tool.name}`,
      usage: this.extractUsageFromResponse(response),
      parameters: this.convertToolParameters(tool),
      examples: [],
      errorCases: [],
      bestPractices: this.extractBestPracticesFromResponse(response)
    };
  }

  /**
   * Parse code example from LLM response
   */
  private parseCodeExample(response: string, tool: MCPTool, language: string): CodeExample {
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1].trim() : response;

    return {
      title: `Using ${tool.name}`,
      description: `Example usage of the ${tool.name} tool`,
      code,
      language,
      output: this.extractOutputFromResponse(response)
    };
  }

  /**
   * Convert MCPTool parameters to documentation format
   */
  private convertToolParameters(tool: MCPTool): ParameterDoc[] {
    return tool.parameters.map(param => ({
      name: param.name,
      type: param.type,
      required: param.required,
      description: param.description || `${param.name} parameter`,
      example: this.generateExampleValue(param.type),
      validation: undefined // MCPParameter doesn't have validation property
    }));
  }

  /**
   * Generate example value for parameter type
   */
  private generateExampleValue(type: string): any {
    switch (type.toLowerCase()) {
      case 'string': return 'example-value';
      case 'number': return 42;
      case 'boolean': return true;
      case 'array': return ['item1', 'item2'];
      case 'object': return { key: 'value' };
      default: return 'example';
    }
  }

  // Fallback methods for when LLM generation fails
  private generateFallbackReadme(context: GenerationContext, spec: MinifiedSpec): string {
    return `# ${context.project.name}

MCP Server generated from ${spec.info.title} API.

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

This server provides ${context.project.tools.length} tools for interacting with the ${spec.info.title} API.

## Tools

${context.project.tools.map(tool => `- **${tool.name}**: ${tool.description || 'No description available'}`).join('\n')}
`;
  }

  private generateFallbackToolDoc(tool: MCPTool): ToolDocumentation {
    return {
      toolName: tool.name,
      description: tool.description || `Tool for ${tool.name}`,
      usage: `Use this tool to ${tool.name.toLowerCase().replace(/([A-Z])/g, ' $1').trim()}`,
      parameters: this.convertToolParameters(tool),
      examples: [],
      errorCases: [],
      bestPractices: [
        'Validate all required parameters before calling',
        'Handle errors gracefully',
        'Use appropriate timeout values'
      ]
    };
  }

  private generateFallbackErrorGuide(context: GenerationContext): string {
    return `# Error Handling Guide

This guide covers common errors and their solutions when using the ${context.project.name} MCP server.

## Common Error Types

- **Validation Errors**: Check that all required parameters are provided
- **Network Errors**: Ensure the API endpoint is accessible
- **Authentication Errors**: Verify API credentials are correct
- **Rate Limiting**: Implement appropriate retry logic

## Best Practices

- Always validate input parameters
- Implement proper error handling
- Use appropriate timeout values
- Log errors for debugging
`;
  }

  private generateFallbackApiReference(spec: MinifiedSpec): string {
    return `# API Reference

## ${spec.info.title} v${spec.info.version}

${spec.info.description || 'API documentation for this service.'}

## Endpoints

${spec.paths.map(path => 
  `### ${path.path}\n\n${path.operations.map(op => 
    `**${op.method}** - ${op.summary || op.operationId || 'No description'}`
  ).join('\n')}`
).join('\n\n')}
`;
  }

  // Helper methods for parsing LLM responses
  private extractUsageFromResponse(response: string): string {
    const usageMatch = response.match(/(?:usage|how to use):?\s*(.+?)(?:\n\n|\n#|$)/i);
    return usageMatch ? usageMatch[1].trim() : 'See examples for usage details';
  }

  private extractBestPracticesFromResponse(response: string): string[] {
    const practicesMatch = response.match(/(?:best practices?|recommendations?):?\s*((?:[-•*]\s*.+\n?)+)/i);
    if (practicesMatch) {
      return practicesMatch[1]
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*]\s*/, '').trim());
    }
    return [];
  }

  private extractOutputFromResponse(response: string): string | undefined {
    const outputMatch = response.match(/output:?\s*```[\w]*\n([\s\S]*?)\n```/i);
    return outputMatch ? outputMatch[1].trim() : undefined;
  }

  /**
   * Get generation statistics
   */
  async getStats() {
    const cacheStats = await this.cache.getStats();
    const capabilities = this.llmProvider.getCapabilities();
    
    return {
      cache: cacheStats,
      model: capabilities,
      features: this.features
    };
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.cache instanceof SemanticCache) {
      await this.cache.disconnect();
    }
  }
}