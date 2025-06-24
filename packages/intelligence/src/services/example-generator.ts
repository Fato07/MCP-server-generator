import { LLMProvider, LLMProviderFactory } from '../models/llm-provider.js';
import { SemanticCache, MemoryCache } from '../cache/semantic-cache.js';
import { OpenAPIMinifier } from '../pipeline/minifier.js';
import { PromptTemplate } from '../templates/prompts.js';
import {
  LLMConfig,
  MinifiedSpec,
  CodeExample,
  GenerationContext
} from '../types/index.js';
import type { MCPTool, GeneratedProject } from '@mcpgen/core';

export interface ExampleGeneratorOptions {
  llmConfig: LLMConfig;
  cacheConfig?: {
    enabled: boolean;
    redisUrl?: string;
    ttl?: number;
  };
  exampleTypes?: {
    quickStart: boolean;
    integration: boolean;
    errorHandling: boolean;
    advanced: boolean;
  };
}

export class ExampleGenerator {
  private llmProvider: LLMProvider;
  private cache: SemanticCache | MemoryCache;
  private promptTemplate: PromptTemplate;
  private exampleTypes: Required<ExampleGeneratorOptions['exampleTypes']>;

  constructor(options: ExampleGeneratorOptions) {
    this.llmProvider = LLMProviderFactory.create(options.llmConfig);
    this.exampleTypes = {
      quickStart: true,
      integration: true,
      errorHandling: true,
      advanced: false,
      ...options.exampleTypes
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
   * Generate comprehensive code examples for an MCP server
   */
  async generateExamples(context: GenerationContext): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];
    const minifiedSpec = OpenAPIMinifier.minify(context.spec as any);

    // Generate quick start example
    if (this.exampleTypes.quickStart) {
      const quickStart = await this.generateQuickStartExample(context, minifiedSpec);
      if (quickStart) examples.push(quickStart);
    }

    // Generate integration examples for each tool
    if (this.exampleTypes.integration) {
      const integrationExamples = await this.generateToolIntegrationExamples(context, minifiedSpec);
      examples.push(...integrationExamples);
    }

    // Generate error handling examples
    if (this.exampleTypes.errorHandling) {
      const errorExample = await this.generateErrorHandlingExample(context, minifiedSpec);
      if (errorExample) examples.push(errorExample);
    }

    // Generate advanced usage examples
    if (this.exampleTypes.advanced) {
      const advancedExample = await this.generateAdvancedExample(context, minifiedSpec);
      if (advancedExample) examples.push(advancedExample);
    }

    return examples;
  }

  /**
   * Generate a quick start example
   */
  private async generateQuickStartExample(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<CodeExample | null> {
    const cacheKey = `quick-start-${context.project.name}-${context.language}`;
    const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);

    if (cached) {
      return JSON.parse(cached.content);
    }

    const prompt = this.buildQuickStartPrompt(context, minifiedSpec);

    try {
      console.log('🔍 Generating quick start example...');
      const response = await this.llmProvider.generate(prompt, {
        maxTokens: 500,
        temperature: 0.3
      });
      console.log('✅ Quick start example generated');

      const example = this.parseQuickStartExample(response.content, context);
      
      await this.cache.set(cacheKey, this.llmProvider.constructor.name, {
        ...response,
        content: JSON.stringify(example)
      });

      return example;

    } catch (error) {
      console.warn('Failed to generate quick start example:', error);
      return this.generateFallbackQuickStart(context);
    }
  }

  /**
   * Generate integration examples for individual tools
   */
  private async generateToolIntegrationExamples(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<CodeExample[]> {
    const examples: CodeExample[] = [];
    const maxTools = 3; // Limit to prevent token overflow

    for (let i = 0; i < Math.min(context.project.tools.length, maxTools); i++) {
      const tool = context.project.tools[i];
      const example = await this.generateToolExample(tool, context, minifiedSpec);
      if (example) examples.push(example);
    }

    return examples;
  }

  /**
   * Generate example for a specific tool
   */
  private async generateToolExample(
    tool: MCPTool,
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<CodeExample | null> {
    const cacheKey = `tool-example-${tool.name}-${context.language}`;
    const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);

    if (cached) {
      return JSON.parse(cached.content);
    }

    const prompt = this.buildToolExamplePrompt(tool, context, minifiedSpec);

    try {
      console.log('🔍 Sending prompt to LLM:', prompt.substring(0, 200) + '...');
      const response = await this.llmProvider.generate(prompt, {
        maxTokens: 400,
        temperature: 0.4
      });
      console.log('✅ LLM response received for tool:', tool.name);

      const example = this.parseToolExample(response.content, tool, context);
      
      await this.cache.set(cacheKey, this.llmProvider.constructor.name, {
        ...response,
        content: JSON.stringify(example)
      });

      return example;

    } catch (error) {
      console.warn(`Failed to generate example for tool ${tool.name}:`, error);
      return this.generateFallbackToolExample(tool, context);
    }
  }

  /**
   * Generate error handling example
   */
  private async generateErrorHandlingExample(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<CodeExample | null> {
    const cacheKey = `error-handling-${context.project.name}-${context.language}`;
    const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);

    if (cached) {
      return JSON.parse(cached.content);
    }

    const prompt = this.buildErrorHandlingPrompt(context, minifiedSpec);

    try {
      const response = await this.llmProvider.generate(prompt, {
        maxTokens: 1000,
        temperature: 0.2
      });

      const example = this.parseErrorHandlingExample(response.content, context);
      
      await this.cache.set(cacheKey, this.llmProvider.constructor.name, {
        ...response,
        content: JSON.stringify(example)
      });

      return example;

    } catch (error) {
      console.warn('Failed to generate error handling example:', error);
      return this.generateFallbackErrorExample(context);
    }
  }

  /**
   * Generate advanced usage example
   */
  private async generateAdvancedExample(
    context: GenerationContext,
    minifiedSpec: MinifiedSpec
  ): Promise<CodeExample | null> {
    const cacheKey = `advanced-${context.project.name}-${context.language}`;
    const cached = await this.cache.get(cacheKey, this.llmProvider.constructor.name);

    if (cached) {
      return JSON.parse(cached.content);
    }

    const prompt = this.buildAdvancedPrompt(context, minifiedSpec);

    try {
      const response = await this.llmProvider.generate(prompt, {
        maxTokens: 1500,
        temperature: 0.5
      });

      const example = this.parseAdvancedExample(response.content, context);
      
      await this.cache.set(cacheKey, this.llmProvider.constructor.name, {
        ...response,
        content: JSON.stringify(example)
      });

      return example;

    } catch (error) {
      console.warn('Failed to generate advanced example:', error);
      return null;
    }
  }

  // Prompt builders
  private buildQuickStartPrompt(context: GenerationContext, spec: MinifiedSpec): string {
    return `Generate a quick start example for the ${context.project.name} MCP server.

**CRITICAL REQUIREMENT**: This is an MCP SERVER that handles tool calls from AI assistants. 
DO NOT generate REST API client code that makes HTTP requests with axios/fetch.
DO NOT import non-existent packages.
DO NOT show how to call external APIs.

**MCP Server Context**:
- This is SERVER code that receives tool calls from AI assistants (like Claude Desktop)
- Tools are implemented as request handlers using CallToolRequestSchema
- The server returns structured responses to the AI assistant
- No axios, fetch, or HTTP client libraries should be used

**Project**: ${context.project.name}
**Language**: ${context.language}
**API**: ${spec.info.title}

**Available Tools**:
${context.project.tools.slice(0, 3).map(tool => `- ${tool.name}: ${tool.description || 'No description'}`).join('\n')}

**REQUIRED Format - MCP Server Implementation**:
\`\`\`${context.language}
// MCP Server setup for ${context.project.name}
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: '${context.project.name}',
  version: '1.0.0'
});

// Example tool implementations here
\`\`\`

**Requirements**:
1. Show MCP server setup with proper imports
2. Show tool handler implementations  
3. Include realistic tool responses
4. Add helpful comments about MCP
5. Show how AI assistants will call these tools
6. Include Claude Desktop configuration

**Output**: Return MCP server example code, not client code.`;
  }

  private buildToolExamplePrompt(tool: MCPTool, context: GenerationContext, spec: MinifiedSpec): string {
    return this.promptTemplate.renderExamplePrompt({
      tool: tool,
      language: context.language,
      projectName: context.project.name
    });
  }

  private buildErrorHandlingPrompt(context: GenerationContext, spec: MinifiedSpec): string {
    return `Generate comprehensive error handling for ${context.project.name} MCP server.

**CRITICAL REQUIREMENT**: This is an MCP SERVER that handles tool calls from AI assistants. 
DO NOT generate REST API client code that makes HTTP requests with axios/fetch.
Show MCP server-side error handling patterns.

**MCP Server Context**:
- This is SERVER code that receives tool calls from AI assistants
- Handle errors in tool request handlers using CallToolRequestSchema
- Return structured error responses to the AI assistant
- Use MCP SDK patterns for error handling

**Project**: ${context.project.name}
**Language**: ${context.language}
**Tools**: ${context.project.tools.length} available

**Requirements**:
1. Show MCP tool handler error patterns
2. Demonstrate proper try-catch in CallToolRequestSchema handlers
3. Return structured error responses to AI assistant
4. Show validation error handling for tool parameters
5. Include logging for debugging MCP servers
6. Handle malformed tool calls gracefully

**Required Format**:
\`\`\`${context.language}
// MCP Server error handling patterns
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // Tool implementation with error handling
  } catch (error) {
    // Return structured error to AI assistant
    return {
      content: [{
        type: 'text',
        text: 'Error: ...'
      }],
      isError: true
    };
  }
});
\`\`\`

**Output**: Return MCP server error handling code, not HTTP client error handling.`;
  }

  private buildAdvancedPrompt(context: GenerationContext, spec: MinifiedSpec): string {
    return `Generate an advanced usage example for ${context.project.name} MCP server.

**Project**: ${context.project.name}
**Language**: ${context.language}
**API**: ${spec.info.title}

**Requirements**:
1. Show complex workflows using multiple tools
2. Demonstrate advanced patterns (batching, caching, etc.)
3. Include performance optimizations
4. Show integration with other systems
5. Add monitoring and metrics
6. Use advanced ${context.language} features

Generate a sophisticated example that showcases the full potential of this MCP server.

**Output**: Return the advanced example with detailed explanations.`;
  }

  // Response parsers
  private parseQuickStartExample(response: string, context: GenerationContext): CodeExample {
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1].trim() : response;

    return {
      title: `Quick Start - ${context.project.name}`,
      description: `Get started with the ${context.project.name} MCP server in minutes`,
      code,
      language: context.language,
      output: this.extractOutputFromResponse(response)
    };
  }

  private parseToolExample(response: string, tool: MCPTool, context: GenerationContext): CodeExample {
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1].trim() : response;

    return {
      title: `Using ${tool.name}`,
      description: `Detailed example of the ${tool.name} tool`,
      code,
      language: context.language,
      output: this.extractOutputFromResponse(response)
    };
  }

  private parseErrorHandlingExample(response: string, context: GenerationContext): CodeExample {
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1].trim() : response;

    return {
      title: 'Error Handling Best Practices',
      description: `Comprehensive error handling for ${context.project.name}`,
      code,
      language: context.language
    };
  }

  private parseAdvancedExample(response: string, context: GenerationContext): CodeExample {
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1].trim() : response;

    return {
      title: 'Advanced Usage Patterns',
      description: `Advanced techniques with ${context.project.name}`,
      code,
      language: context.language
    };
  }

  private extractOutputFromResponse(response: string): string | undefined {
    const outputMatch = response.match(/(?:output|result):?\s*```[\w]*\n([\s\S]*?)\n```/i);
    return outputMatch ? outputMatch[1].trim() : undefined;
  }

  // Fallback generators
  private generateFallbackQuickStart(context: GenerationContext): CodeExample {
    const sampleTool = context.project.tools[0];
    const params = sampleTool?.parameters.filter(p => p.required).slice(0, 2) || [];
    
    const code = context.language === 'typescript' ? 
      this.generateTypeScriptQuickStart(context, sampleTool, params) :
      this.generatePythonQuickStart(context, sampleTool, params);

    return {
      title: `Quick Start - ${context.project.name}`,
      description: `Basic usage example for ${context.project.name}`,
      code,
      language: context.language
    };
  }

  private generateFallbackToolExample(tool: MCPTool, context: GenerationContext): CodeExample {
    const params = tool.parameters.filter(p => p.required).slice(0, 3);
    
    const code = context.language === 'typescript' ?
      this.generateTypeScriptToolExample(tool, params) :
      this.generatePythonToolExample(tool, params);

    return {
      title: `Using ${tool.name}`,
      description: `Example usage of the ${tool.name} tool`,
      code,
      language: context.language
    };
  }

  private generateFallbackErrorExample(context: GenerationContext): CodeExample {
    const code = context.language === 'typescript' ?
      this.generateTypeScriptErrorExample(context) :
      this.generatePythonErrorExample(context);

    return {
      title: 'Error Handling',
      description: `Error handling patterns for ${context.project.name}`,
      code,
      language: context.language
    };
  }

  // Language-specific code generators
  private generateTypeScriptQuickStart(context: GenerationContext, tool: MCPTool | undefined, params: any[]): string {
    return `import { ${context.project.name}Server } from './${context.project.name.toLowerCase()}-server';

async function quickStart() {
  const server = new ${context.project.name}Server();
  await server.start();

  try {
    ${tool ? `// Use ${tool.name} tool
    const result = await server.tools.${tool.name}({
      ${params.map(p => `${p.name}: ${this.generateExampleValue(p.type)}`).join(',\n      ')}
    });
    
    console.log('Result:', result);` : '// Server is running and ready to use'}
  } catch (error) {
    console.error('Error:', error);
  }
}

quickStart();`;
  }

  private generatePythonQuickStart(context: GenerationContext, tool: MCPTool | undefined, params: any[]): string {
    return `from ${context.project.name.toLowerCase()}_server import ${context.project.name}Server
import asyncio

async def quick_start():
    server = ${context.project.name}Server()
    await server.start()

    try:
        ${tool ? `# Use ${tool.name} tool
        result = await server.tools.${tool.name}(
            ${params.map(p => `${p.name}=${this.generatePythonExampleValue(p.type)}`).join(',\n            ')}
        )
        
        print(f"Result: {result}")` : '# Server is running and ready to use'}
    except Exception as error:
        print(f"Error: {error}")

if __name__ == "__main__":
    asyncio.run(quick_start())`;
  }

  private generateTypeScriptToolExample(tool: MCPTool, params: any[]): string {
    return `// Example: Using ${tool.name}
async function use${tool.name}() {
  try {
    const result = await server.tools.${tool.name}({
      ${params.map(p => `${p.name}: ${this.generateExampleValue(p.type)} // ${p.description || p.type}`).join(',\n      ')}
    });
    
    console.log('Success:', result);
    return result;
  } catch (error) {
    console.error('Error calling ${tool.name}:', error);
    throw error;
  }
}`;
  }

  private generatePythonToolExample(tool: MCPTool, params: any[]): string {
    return `# Example: Using ${tool.name}
async def use_${tool.name.toLowerCase()}():
    try:
        result = await server.tools.${tool.name}(
            ${params.map(p => `${p.name}=${this.generatePythonExampleValue(p.type)}  # ${p.description || p.type}`).join(',\n            ')}
        )
        
        print(f"Success: {result}")
        return result
    except Exception as error:
        print(f"Error calling ${tool.name}: {error}")
        raise`;
  }

  private generateTypeScriptErrorExample(context: GenerationContext): string {
    return `// Comprehensive error handling for ${context.project.name}
import { ${context.project.name}Server, ${context.project.name}Error } from './${context.project.name.toLowerCase()}-server';

async function robustToolUsage() {
  const server = new ${context.project.name}Server({
    timeout: 30000,
    retries: 3
  });

  try {
    await server.start();
    
    // Example with retry logic
    const result = await retryOperation(async () => {
      return await server.tools.someMethod({ param: 'value' });
    }, 3);
    
    return result;
    
  } catch (error) {
    if (error instanceof ${context.project.name}Error) {
      // Handle specific API errors
      console.error('API Error:', error.message, error.code);
    } else if (error.code === 'ENOTFOUND') {
      // Handle network errors
      console.error('Network error - check connection');
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(\`Attempt \${attempt} failed, retrying in \${delay}ms...\`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}`;
  }

  private generatePythonErrorExample(context: GenerationContext): string {
    return `# Comprehensive error handling for ${context.project.name}
import asyncio
import logging
from typing import TypeVar, Callable, Any
from ${context.project.name.toLowerCase()}_server import ${context.project.name}Server, ${context.project.name}Error

T = TypeVar('T')

async def robust_tool_usage():
    server = ${context.project.name}Server(
        timeout=30.0,
        retries=3
    )

    try:
        await server.start()
        
        # Example with retry logic
        result = await retry_operation(
            lambda: server.tools.some_method(param='value'),
            max_retries=3
        )
        
        return result
        
    except ${context.project.name}Error as error:
        # Handle specific API errors
        logging.error(f"API Error: {error.message}, Code: {error.code}")
        raise
    except ConnectionError:
        # Handle network errors
        logging.error("Network error - check connection")
        raise
    except Exception as error:
        # Handle unexpected errors
        logging.error(f"Unexpected error: {error}")
        raise

async def retry_operation(operation: Callable[[], Any], max_retries: int):
    for attempt in range(1, max_retries + 1):
        try:
            return await operation()
        except Exception as error:
            if attempt == max_retries:
                raise
            
            delay = (2 ** attempt) * 1.0  # Exponential backoff
            logging.info(f"Attempt {attempt} failed, retrying in {delay}s...")
            await asyncio.sleep(delay)
    
    raise Exception("Max retries exceeded")`;
  }

  private generateExampleValue(type: string): string {
    switch (type.toLowerCase()) {
      case 'string': return '"example-value"';
      case 'number': return '42';
      case 'boolean': return 'true';
      case 'array': return '["item1", "item2"]';
      case 'object': return '{ key: "value" }';
      default: return '"example"';
    }
  }

  private generatePythonExampleValue(type: string): string {
    switch (type.toLowerCase()) {
      case 'string': return '"example-value"';
      case 'number': return '42';
      case 'boolean': return 'True';
      case 'array': return '["item1", "item2"]';
      case 'object': return '{"key": "value"}';
      default: return '"example"';
    }
  }

  /**
   * Get generation statistics
   */
  async getStats() {
    return {
      cache: await this.cache.getStats(),
      exampleTypes: this.exampleTypes
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