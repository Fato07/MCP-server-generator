import type { MCPTool, GeneratedProject, MCPParameter as CoreMCPParameter } from '@mcpgen/core';

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'ollama';
  model: string;
  apiKey?: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface IntelligenceConfig {
  llm: {
    primary: LLMConfig;
    validator?: LLMConfig;
    local?: LLMConfig;
  };
  cache: {
    enabled: boolean;
    redis?: {
      host: string;
      port: number;
      password?: string;
    };
    ttl: number;
  };
  features: {
    documentation: boolean;
    examples: boolean;
    implementation: boolean;
    validation: boolean;
  };
  costs: {
    maxMonthly: number;
    alertThreshold: number;
  };
}

export interface MinifiedSpec {
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: MinifiedPath[];
  schemas: Record<string, MinifiedSchema>;
  tokenCount: number;
}

export interface MinifiedPath {
  path: string;
  operations: MinifiedOperation[];
}

export interface MinifiedOperation {
  method: string;
  operationId?: string;
  summary?: string;
  parameters?: MinifiedParameter[];
  requestBody?: MinifiedRequestBody;
  responses: Record<string, MinifiedResponse>;
}

export interface MinifiedParameter {
  name: string;
  in: 'query' | 'path' | 'header';
  required?: boolean;
  type: string;
  description?: string;
}

export interface MinifiedRequestBody {
  required?: boolean;
  schema: MinifiedSchema;
}

export interface MinifiedResponse {
  description: string;
  schema?: MinifiedSchema;
}

export interface MinifiedSchema {
  type: string;
  ref?: string;
  properties?: Record<string, MinifiedSchema>;
  items?: MinifiedSchema;
  required?: string[];
  enum?: any[];
  format?: string;
}

export interface EnhancedDocumentation {
  readme: string;
  toolDocs: ToolDocumentation[];
  examples: CodeExample[];
  errorGuide: string;
  apiReference: string;
}

export interface ToolDocumentation {
  toolName: string;
  description: string;
  usage: string;
  parameters: ParameterDoc[];
  examples: CodeExample[];
  errorCases: ErrorCase[];
  bestPractices: string[];
}

export interface ParameterDoc {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example: any;
  validation?: string;
}

export interface CodeExample {
  title: string;
  description: string;
  code: string;
  language: string;
  output?: string;
}

export interface ErrorCase {
  scenario: string;
  error: string;
  solution: string;
  code?: string;
}

export interface ImplementationHint {
  suggestedCode: string;
  explanation: string;
  confidence: number;
  alternatives?: string[];
  dependencies?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'syntax' | 'logic' | 'security' | 'performance';
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface CacheEntry {
  key: string;
  value: any;
  embedding?: number[];
  metadata: {
    created: Date;
    accessed: Date;
    hits: number;
    cost: number;
  };
}

export interface CacheStats {
  totalRequests: number;
  hits: number;
  misses: number;
  hitRate: number;
  costSavings: number;
  storageUsed: number;
}

export interface ExtendedMCPParameter extends CoreMCPParameter {
  validation?: string;
}

export interface ExtendedGeneratedProject extends GeneratedProject {
  name: string;
  files: Record<string, string>;
}

export interface GenerationContext {
  tool: MCPTool;
  project: ExtendedGeneratedProject;
  spec: MinifiedSpec;
  template: string;
  language: string;
  userPreferences?: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  model: string;
  confidence?: number;
}

export interface PromptTemplate {
  name: string;
  template: string;
  variables: string[];
  examples?: PromptExample[];
  constraints?: string[];
}

export interface PromptExample {
  input: Record<string, any>;
  output: string;
  explanation?: string;
}

export interface ModelCapabilities {
  maxTokens: number;
  supportsStreaming: boolean;
  costPerToken: {
    input: number;
    output: number;
  };
  languages: string[];
  strengths: string[];
}

export interface IntelligenceMetrics {
  requestCount: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  cacheHitRate: number;
  userSatisfaction: number;
  featureUsage: Record<string, number>;
}