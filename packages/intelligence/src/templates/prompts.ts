import { MCPTool } from '@mcpgen/core';
import { MinifiedSpec } from '../types/index.js';

export class PromptTemplate {
  /**
   * Generate prompt for README enhancement
   */
  renderReadmePrompt(context: {
    projectName: string;
    description: string;
    tools: MCPTool[];
    spec: MinifiedSpec;
    existingReadme?: string;
    language: string;
  }): string {
    return `You are an expert technical writer. Generate a comprehensive, professional README.md file for an MCP (Model Context Protocol) server.

**Project**: ${context.projectName}
**Language**: ${context.language}
**API**: ${context.spec.info.title} v${context.spec.info.version}
**Description**: ${context.description || 'MCP server for API integration'}

**Available Tools** (${context.tools.length}):
${context.tools.map(tool => `- ${tool.name}: ${tool.description || 'No description'}`).join('\n')}

${context.existingReadme ? `**Existing README to enhance**:\n${context.existingReadme}\n\n` : ''}

**Requirements**:
1. Write in clear, professional markdown
2. Include installation, setup, and usage instructions
3. Document each tool with examples
4. Add troubleshooting section
5. Include configuration options
6. Add security considerations
7. Use proper markdown formatting with badges, code blocks, and tables
8. Make it beginner-friendly but comprehensive
9. Include examples for both CLI and programmatic usage

**Output**: Return ONLY the README.md content in markdown format. Do not include explanations or meta-text.`;
  }

  /**
   * Generate prompt for tool-specific documentation
   */
  renderToolDocPrompt(context: {
    tool: MCPTool;
    spec: MinifiedSpec;
    language: string;
    includeExamples: boolean;
    includeErrorCases: boolean;
    includeBestPractices: boolean;
  }): string {
    return `You are an expert API documentation writer. Create comprehensive documentation for this MCP tool.

**Tool**: ${context.tool.name}
**Description**: ${context.tool.description || 'No description provided'}
**Language**: ${context.language}

**Parameters**:
${context.tool.parameters.map(param => 
  `- ${param.name} (${param.type})${param.required ? ' *required*' : ' *optional*'}: ${param.description || 'No description'}`
).join('\n')}

**API Context** from ${context.spec.info.title}:
${context.spec.paths.filter(path => 
  path.operations.some(op => op.operationId === context.tool.name)
).map(path => 
  `${path.path}: ${path.operations.map(op => `${op.method} ${op.summary || ''}`).join(', ')}`
).join('\n')}

Generate a JSON object with this structure:
{
  "toolName": "string",
  "description": "string - comprehensive description",
  "usage": "string - how to use this tool",
  "parameters": [
    {
      "name": "string",
      "type": "string", 
      "required": boolean,
      "description": "string",
      "example": "any - realistic example value"
    }
  ],
  ${context.includeExamples ? '"examples": [{"title": "string", "description": "string", "code": "string", "language": "string"}],' : ''}
  ${context.includeErrorCases ? '"errorCases": [{"scenario": "string", "error": "string", "solution": "string"}],' : ''}
  ${context.includeBestPractices ? '"bestPractices": ["string - actionable practice"]' : '"bestPractices": []'}
}

**Output**: Return ONLY the JSON object, no explanations or meta-text.`;
  }

  /**
   * Generate prompt for code examples
   */
  renderExamplePrompt(context: {
    tool: MCPTool;
    language: string;
    projectName: string;
  }): string {
    return `Generate a practical example for using this tool in an MCP (Model Context Protocol) server context.

**CRITICAL REQUIREMENT**: This is an MCP SERVER that handles tool calls from AI assistants. 
DO NOT generate REST API client code that makes HTTP requests with axios/fetch.
DO NOT import non-existent packages.
DO NOT show how to call external APIs.

**MCP Server Context**:
- This is SERVER code that receives tool calls from AI assistants (like Claude Desktop)
- Tools are implemented as request handlers using CallToolRequestSchema
- The server returns structured responses to the AI assistant
- No axios, fetch, or HTTP client libraries should be used

**Tool**: ${context.tool.name}
**Description**: ${context.tool.description || 'MCP tool'}
**Language**: ${context.language}
**MCP Server**: ${context.projectName}

**Parameters**:
${context.tool.parameters.map(param => 
  `- ${param.name}: ${param.type}${param.required ? ' (required)' : ' (optional)'} - ${param.description || ''}`
).join('\n')}

**Requirements**:
1. Show how to test this tool locally using the MCP test client
2. Demonstrate calling the tool with realistic parameters
3. Show the expected MCP response format
4. Include error scenarios specific to MCP
5. Add configuration examples for Claude Desktop
6. Make examples relevant to MCP server context

**REQUIRED Example Format - MCP Server Implementation**:
\`\`\`${context.language}
// MCP Server implementation for ${context.tool.name}
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server({
  name: '${context.projectName}',
  version: '1.0.0'
});

// Tool implementation: ${context.tool.name}
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === '${context.tool.name}') {
    // Extract parameters from request
    const params = request.params.arguments || {};
    
    // Implement your tool logic here
    // This runs on the server when AI assistant calls the tool
    
    return {
      content: [
        {
          type: 'text',
          text: 'Your tool response here'
        }
      ]
    };
  }
});
\`\`\`

**Claude Desktop Config**:
\`\`\`json
{
  "mcpServers": {
    "${context.projectName}": {
      "command": "node",
      "args": ["./dist/index.js"]
    }
  }
}
\`\`\`

**Output**: Return MCP-specific examples that show how to use this tool within the MCP ecosystem.`;
  }

  /**
   * Generate prompt for error handling guide
   */
  renderErrorGuidePrompt(context: {
    tools: MCPTool[];
    spec: MinifiedSpec;
    language: string;
  }): string {
    return `Create a comprehensive error handling guide for this MCP server.

**API**: ${context.spec.info.title} v${context.spec.info.version}
**Language**: ${context.language}
**Tools Count**: ${context.tools.length}

**Common Tool Categories**:
${this.categorizeTools(context.tools)}

**Requirements**:
1. Cover common error scenarios for each tool category
2. Provide specific error messages and solutions
3. Include code examples for error handling
4. Add debugging tips
5. Explain rate limiting and authentication errors
6. Include network and timeout handling
7. Provide troubleshooting checklist

**Format**: Professional markdown documentation with clear sections, code examples, and actionable solutions.

**Output**: Return ONLY the markdown content for the error handling guide.`;
  }

  /**
   * Generate prompt for API reference documentation
   */
  renderApiReferencePrompt(context: {
    spec: MinifiedSpec;
    tools: MCPTool[];
    language: string;
  }): string {
    return `Generate a comprehensive API reference for this MCP server.

**API**: ${context.spec.info.title} v${context.spec.info.version}
**Description**: ${context.spec.info.description || 'API reference documentation'}
**Language**: ${context.language}

**Available Endpoints** (${context.spec.paths.length}):
${context.spec.paths.map(path => 
  `${path.path}:\n${path.operations.map(op => 
    `  ${op.method.toUpperCase()} - ${op.summary || op.operationId || 'No description'}`
  ).join('\n')}`
).join('\n\n')}

**MCP Tools** (${context.tools.length}):
${context.tools.map(tool => `- ${tool.name}: ${tool.description || 'No description'}`).join('\n')}

**Requirements**:
1. Create clear endpoint documentation
2. Include request/response examples
3. Document authentication requirements
4. Add parameter descriptions and constraints
5. Show error response formats
6. Include rate limiting information
7. Add usage examples for each endpoint
8. Use professional API documentation format

**Format**: Professional markdown with clear sections, tables, and code examples.

**Output**: Return ONLY the markdown content for the API reference.`;
  }

  /**
   * Categorize tools for better error handling guidance
   */
  private categorizeTools(tools: MCPTool[]): string {
    const categories: Record<string, string[]> = {
      'Data Retrieval': [],
      'Data Modification': [], 
      'Search/Query': [],
      'Authentication': [],
      'File Operations': [],
      'Other': []
    };

    tools.forEach(tool => {
      const name = tool.name.toLowerCase();
      const desc = (tool.description || '').toLowerCase();
      
      if (name.includes('get') || name.includes('fetch') || name.includes('read') || desc.includes('retrieve')) {
        categories['Data Retrieval'].push(tool.name);
      } else if (name.includes('post') || name.includes('put') || name.includes('patch') || name.includes('delete') || name.includes('create') || name.includes('update')) {
        categories['Data Modification'].push(tool.name);
      } else if (name.includes('search') || name.includes('query') || name.includes('find') || desc.includes('search')) {
        categories['Search/Query'].push(tool.name);
      } else if (name.includes('auth') || name.includes('login') || name.includes('token') || desc.includes('auth')) {
        categories['Authentication'].push(tool.name);
      } else if (name.includes('file') || name.includes('upload') || name.includes('download') || desc.includes('file')) {
        categories['File Operations'].push(tool.name);
      } else {
        categories['Other'].push(tool.name);
      }
    });

    return Object.entries(categories)
      .filter(([_, tools]) => tools.length > 0)
      .map(([category, tools]) => `- ${category}: ${tools.join(', ')}`)
      .join('\n');
  }
}

/**
 * Utility function to create system prompts for different tasks
 */
export const SYSTEM_PROMPTS = {
  documentation: `You are an expert technical writer specializing in MCP (Model Context Protocol) server documentation. 
You understand that MCP servers are used by AI assistants like Claude to interact with external systems.
You write clear documentation that helps developers integrate MCP servers with AI assistants.
Focus on MCP-specific examples, tool usage patterns, and integration with Claude Desktop.`,

  codeGeneration: `You are an expert software engineer with deep knowledge of MCP (Model Context Protocol) servers. 
You understand that MCP servers:
- Expose tools that AI assistants can call
- Use stdio transport for communication
- Return structured responses in MCP format
- Are NOT REST API clients but servers that respond to tool calls
Always generate code that fits the MCP server context, not client-side API code.`,

  validation: `You are a senior code reviewer with expertise in MCP server architecture and best practices. 
You understand the MCP protocol, tool patterns, and integration requirements.
Focus on MCP-specific correctness, proper tool responses, and integration compatibility.`
};

/**
 * Pre-defined prompt templates for common tasks
 */
export const PROMPT_TEMPLATES = {
  enhanceReadme: (context: any) => new PromptTemplate().renderReadmePrompt(context),
  documentTool: (context: any) => new PromptTemplate().renderToolDocPrompt(context),
  generateExample: (context: any) => new PromptTemplate().renderExamplePrompt(context),
  errorGuide: (context: any) => new PromptTemplate().renderErrorGuidePrompt(context),
  apiReference: (context: any) => new PromptTemplate().renderApiReferencePrompt(context)
};