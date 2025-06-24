// Main Intelligence Service
export { 
  IntelligenceService, 
  type IntelligenceServiceOptions,
  type EnhancedProject,
  type ValidationResult,
  type ValidationIssue,
  type OptimizationHint,
  type CostEstimation
} from './intelligence-service.js';

// LLM Providers
export { 
  LLMProviderFactory,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
  type LLMProvider,
  type GenerationOptions
} from './models/llm-provider.js';

// Caching
export { 
  SemanticCache, 
  MemoryCache 
} from './cache/semantic-cache.js';

// Pipeline Components
export { OpenAPIMinifier } from './pipeline/minifier.js';

// Service Components
export { 
  DocumentationGenerator,
  type DocumentationGeneratorOptions
} from './services/documentation-generator.js';

export { 
  ExampleGenerator,
  type ExampleGeneratorOptions
} from './services/example-generator.js';

// Prompt Templates
export { 
  PromptTemplate,
  SYSTEM_PROMPTS,
  PROMPT_TEMPLATES
} from './templates/prompts.js';

// Types
export type {
  // Configuration Types
  LLMConfig,
  IntelligenceConfig,
  
  // Specification Types
  MinifiedSpec,
  MinifiedPath,
  MinifiedOperation,
  MinifiedParameter,
  MinifiedRequestBody,
  MinifiedResponse,
  MinifiedSchema,
  
  // Documentation Types
  EnhancedDocumentation,
  ToolDocumentation,
  ParameterDoc,
  CodeExample,
  ErrorCase,
  
  // Generation Types
  GenerationContext,
  ImplementationHint,
  
  // Cache Types
  CacheEntry,
  CacheStats,
  
  // LLM Types
  LLMResponse,
  PromptTemplate as PromptTemplateType,
  PromptExample,
  ModelCapabilities,
  
  // Metrics
  IntelligenceMetrics
} from './types/index.js';

// Utility Functions
export const IntelligenceUtils = {
  /**
   * Create a basic intelligence configuration
   */
  createBasicConfig(primaryProvider: 'openai' | 'anthropic' | 'ollama', apiKey?: string) {
    return {
      llm: {
        primary: {
          provider: primaryProvider,
          model: primaryProvider === 'openai' ? 'gpt-4-turbo' : 
                 primaryProvider === 'anthropic' ? 'claude-3-haiku-20240307' : 
                 'codellama',
          apiKey
        }
      },
      cache: {
        enabled: true,
        ttl: 3600 // 1 hour
      },
      features: {
        documentation: true,
        examples: true,
        implementation: false,
        validation: false
      },
      costs: {
        maxMonthly: 50, // $50/month
        alertThreshold: 0.8 // Alert at 80%
      }
    };
  },

  /**
   * Create a development-focused configuration with local models
   */
  createDevConfig() {
    return {
      llm: {
        primary: {
          provider: 'ollama',
          model: 'codellama',
          baseURL: 'http://localhost:11434'
        },
        validator: {
          provider: 'ollama',
          model: 'llama3',
          baseURL: 'http://localhost:11434'
        }
      },
      cache: {
        enabled: true,
        ttl: 7200 // 2 hours
      },
      features: {
        documentation: true,
        examples: true,
        implementation: true,
        validation: true
      },
      costs: {
        maxMonthly: 0, // Free local models
        alertThreshold: 1.0
      }
    };
  },

  /**
   * Create a production configuration with cost controls
   */
  createProductionConfig(apiKey: string) {
    return {
      llm: {
        primary: {
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307', // Cost-efficient
          apiKey
        },
        validator: {
          provider: 'openai',
          model: 'gpt-3.5-turbo', // Fast validation
          apiKey
        }
      },
      cache: {
        enabled: true,
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD
        },
        ttl: 86400 // 24 hours
      },
      features: {
        documentation: true,
        examples: true,
        implementation: false, // Disable expensive features
        validation: true
      },
      costs: {
        maxMonthly: 100, // $100/month
        alertThreshold: 0.9 // Alert at 90%
      }
    };
  },

  /**
   * Get recommended provider for specific task
   */
  getRecommendedProvider(task: 'documentation' | 'code-generation' | 'validation' | 'examples') {
    // Import LLMProviderFactory locally to avoid circular dependency
    const { LLMProviderFactory } = require('./models/llm-provider.js');
    return LLMProviderFactory.getRecommendedProvider(
      task === 'examples' ? 'code-generation' : task
    );
  },

  /**
   * Estimate monthly cost for usage pattern
   */
  estimateMonthlyCost(
    requestsPerDay: number, 
    avgTokensPerRequest: number, 
    provider: 'openai' | 'anthropic' | 'ollama' = 'anthropic'
  ): number {
    if (provider === 'ollama') return 0; // Local models are free
    
    const dailyTokens = requestsPerDay * avgTokensPerRequest;
    const monthlyTokens = dailyTokens * 30;
    
    // Rough cost estimates (input + output)
    const costPerToken = provider === 'openai' ? 0.00003 : 0.000003; // GPT-4 vs Claude Haiku
    
    return monthlyTokens * costPerToken;
  }
};

// Version information
export const INTELLIGENCE_VERSION = '1.0.0';
export const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'ollama'] as const;
export const SUPPORTED_FEATURES = ['documentation', 'examples', 'implementation', 'validation'] as const;