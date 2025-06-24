import { DocumentationGenerator, DocumentationGeneratorOptions } from './services/documentation-generator.js';
import { ExampleGenerator, ExampleGeneratorOptions } from './services/example-generator.js';
import { LLMProviderFactory, LLMProvider } from './models/llm-provider.js';
import { SemanticCache, MemoryCache } from './cache/semantic-cache.js';
import { OpenAPIMinifier } from './pipeline/minifier.js';
import {
  IntelligenceConfig,
  LLMConfig,
  EnhancedDocumentation,
  CodeExample,
  GenerationContext,
  IntelligenceMetrics,
  MinifiedSpec,
  ExtendedGeneratedProject
} from './types/index.js';
import type { GeneratedProject } from '@mcpgen/core';
import type { OpenAPIV3 } from 'openapi-types';

export interface IntelligenceServiceOptions {
  config: IntelligenceConfig;
  features?: {
    documentation?: boolean;
    examples?: boolean;
    implementation?: boolean;
    validation?: boolean;
  };
}

export class IntelligenceService {
  private config: IntelligenceConfig;
  private features: Required<IntelligenceServiceOptions['features']>;
  private primaryProvider: LLMProvider;
  private validatorProvider?: LLMProvider;
  private localProvider?: LLMProvider;
  private documentationGenerator: DocumentationGenerator | null = null;
  private exampleGenerator: ExampleGenerator | null = null;
  private cache: SemanticCache | MemoryCache;
  private metrics: IntelligenceMetrics;

  constructor(options: IntelligenceServiceOptions) {
    this.config = options.config;
    this.features = {
      documentation: this.config.features.documentation,
      examples: this.config.features.examples,
      implementation: this.config.features.implementation,
      validation: this.config.features.validation,
      ...options.features
    };

    // Initialize metrics
    this.metrics = {
      requestCount: 0,
      successRate: 0,
      averageLatency: 0,
      totalCost: 0,
      cacheHitRate: 0,
      userSatisfaction: 0,
      featureUsage: {}
    };

    // Initialize providers first
    this.primaryProvider = LLMProviderFactory.create(this.config.llm.primary);
    this.initializeProviders();
    
    // Initialize cache
    this.cache = this.createCacheInstance();
    this.initializeCache();
    
    this.initializeServices();
  }

  /**
   * Initialize LLM providers
   */
  private initializeProviders(): void {
    // Optional validator provider for quality checks
    if (this.config.llm.validator) {
      this.validatorProvider = LLMProviderFactory.create(this.config.llm.validator);
    }

    // Optional local provider for privacy-sensitive tasks
    if (this.config.llm.local) {
      this.localProvider = LLMProviderFactory.create(this.config.llm.local);
    }
  }

  /**
   * Create cache instance
   */
  private createCacheInstance(): SemanticCache | MemoryCache {
    if (this.config.cache.enabled && this.config.cache.redis) {
      const redisUrl = `redis://${this.config.cache.redis!.host}:${this.config.cache.redis!.port}`;
      return new SemanticCache(redisUrl, this.config.cache.ttl);
    } else {
      return new MemoryCache();
    }
  }

  /**
   * Initialize semantic cache (placeholder for future async initialization)
   */
  private initializeCache(): void {
    // Cache is already initialized in constructor
    // This method is kept for future async initialization if needed
  }

  /**
   * Initialize feature-specific services
   */
  private initializeServices(): void {
    if (this.features.documentation) {
      const docOptions: DocumentationGeneratorOptions = {
        llmConfig: this.config.llm.primary,
        cacheConfig: {
          enabled: this.config.cache.enabled,
          redisUrl: this.config.cache.redis ? 
            `redis://${this.config.cache.redis!.host}:${this.config.cache.redis!.port}` : 
            undefined,
          ttl: this.config.cache.ttl
        },
        features: {
          examples: this.features.examples,
          errorCases: true,
          bestPractices: true,
          apiReference: true
        }
      };
      this.documentationGenerator = new DocumentationGenerator(docOptions);
    }

    if (this.features.examples) {
      const exampleOptions: ExampleGeneratorOptions = {
        llmConfig: this.config.llm.primary,
        cacheConfig: {
          enabled: this.config.cache.enabled,
          redisUrl: this.config.cache.redis ? 
            `redis://${this.config.cache.redis!.host}:${this.config.cache.redis!.port}` : 
            undefined,
          ttl: this.config.cache.ttl
        },
        exampleTypes: {
          quickStart: true,
          integration: true,
          errorHandling: true,
          advanced: false
        }
      };
      this.exampleGenerator = new ExampleGenerator(exampleOptions);
    }
  }

  /**
   * Enhance a generated MCP server project with AI-powered features
   */
  async enhanceProject(
    project: GeneratedProject,
    spec: OpenAPIV3.Document,
    options?: {
      enhanceDocumentation?: boolean;
      generateExamples?: boolean;
      validateImplementation?: boolean;
      optimizePerformance?: boolean;
    }
  ): Promise<EnhancedProject> {
    const startTime = Date.now();
    this.metrics.requestCount++;
    
    try {
      // Create extended project with required properties
      const extendedProject: ExtendedGeneratedProject = {
        ...project,
        name: project.packageInfo.name,
        files: {} // Will be populated by the project generator
      };

      // Create generation context
      const context: GenerationContext = {
        tool: project.tools[0], // Primary tool for context
        project: extendedProject,
        spec: OpenAPIMinifier.minify(spec),
        template: 'default',
        language: 'typescript' // TODO: detect from project
      };

      const enhanced: EnhancedProject = {
        ...project,
        intelligence: {
          enhanced: true,
          features: [],
          cost: 0,
          cacheHits: 0,
          processingTime: 0
        }
      };

      let totalCost = 0;
      let cacheHits = 0;

      // Enhanced documentation
      if (this.features.documentation && options?.enhanceDocumentation !== false && this.documentationGenerator) {
        this.trackFeatureUsage('documentation');
        const docs = await this.documentationGenerator.generateEnhancedDocs(context);
        enhanced.documentation = docs;
        enhanced.intelligence.features.push('enhanced-documentation');
        
        const docStats = await this.documentationGenerator.getStats();
        totalCost += docStats.cache.costSavings || 0;
        cacheHits += docStats.cache.hits || 0;
      }

      // Code examples
      if (this.features.examples && options?.generateExamples !== false && this.exampleGenerator) {
        this.trackFeatureUsage('examples');
        const examples = await this.exampleGenerator.generateExamples(context);
        enhanced.examples = examples;
        enhanced.intelligence.features.push('code-examples');
        
        const exampleStats = await this.exampleGenerator.getStats();
        cacheHits += exampleStats.cache.hits || 0;
      }

      // Implementation validation
      if (this.features.validation && options?.validateImplementation !== false) {
        this.trackFeatureUsage('validation');
        const validation = await this.validateImplementation(project, context);
        enhanced.validation = validation;
        enhanced.intelligence.features.push('implementation-validation');
      }

      // Performance optimization hints
      if (this.features.implementation && options?.optimizePerformance !== false) {
        this.trackFeatureUsage('optimization');
        const optimizations = await this.generateOptimizationHints(project, context);
        enhanced.optimizations = optimizations;
        enhanced.intelligence.features.push('performance-optimization');
      }

      // Update intelligence metadata
      const endTime = Date.now();
      enhanced.intelligence.cost = totalCost;
      enhanced.intelligence.cacheHits = cacheHits;
      enhanced.intelligence.processingTime = endTime - startTime;

      // Update metrics
      this.updateMetrics(startTime, true, totalCost);

      return enhanced;

    } catch (error) {
      this.updateMetrics(startTime, false, 0);
      console.error('Intelligence enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Validate implementation quality
   */
  private async validateImplementation(
    project: GeneratedProject,
    context: GenerationContext
  ): Promise<ValidationResult> {
    const provider = this.validatorProvider || this.primaryProvider;
    
    const prompt = `Review this MCP server implementation for quality, security, and best practices:

**Project**: ${project.name}
**Tools**: ${project.tools.length}
**Language**: TypeScript

**Key Areas to Review**:
1. Security vulnerabilities
2. Error handling completeness
3. Performance considerations
4. Code quality and patterns
5. MCP protocol compliance

**Generated Files**:
${Object.keys(project.files).slice(0, 5).join(', ')}

Provide structured feedback with specific suggestions for improvement.

**Output Format**: JSON with structure:
{
  "isValid": boolean,
  "confidence": number (0-1),
  "issues": [{"type": "error|warning|info", "severity": "high|medium|low", "message": "string", "suggestion": "string"}],
  "suggestions": ["string"]
}`;

    try {
      const response = await provider.generate(prompt, {
        maxTokens: 1000,
        temperature: 0.1
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.warn('Validation failed:', error);
      return {
        isValid: true,
        confidence: 0.5,
        issues: [],
        suggestions: ['Unable to perform automated validation']
      };
    }
  }

  /**
   * Generate performance optimization hints
   */
  private async generateOptimizationHints(
    project: GeneratedProject,
    context: GenerationContext
  ): Promise<OptimizationHint[]> {
    const provider = this.localProvider || this.primaryProvider;
    
    const prompt = `Analyze this MCP server and suggest performance optimizations:

**Project**: ${project.name}
**Tools**: ${project.tools.map(t => t.name).join(', ')}
**API**: ${context.spec.info.title}

**Analysis Areas**:
1. Request batching opportunities
2. Caching strategies
3. Memory optimization
4. Network efficiency
5. Database query optimization (if applicable)

Generate specific, actionable optimization suggestions.

**Output Format**: JSON array of:
[{
  "category": "string",
  "suggestion": "string",
  "impact": "high|medium|low",
  "implementation": "string",
  "estimatedGain": "string"
}]`;

    try {
      const response = await provider.generate(prompt, {
        maxTokens: 800,
        temperature: 0.3
      });

      return JSON.parse(response.content);

    } catch (error) {
      console.warn('Optimization analysis failed:', error);
      return [];
    }
  }

  /**
   * Get intelligence service metrics
   */
  getMetrics(): IntelligenceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get cost estimation for enhancement
   */
  async estimateEnhancementCost(
    project: GeneratedProject,
    spec: OpenAPIV3.Document,
    features: string[]
  ): Promise<CostEstimation> {
    const minified = OpenAPIMinifier.minify(spec);
    const baseTokens = minified.tokenCount;
    
    let estimatedTokens = 0;
    let estimatedCost = 0;

    if (features.includes('documentation')) {
      estimatedTokens += baseTokens * 2; // Input + output for docs
    }

    if (features.includes('examples')) {
      estimatedTokens += project.tools.length * 500; // ~500 tokens per example
    }

    if (features.includes('validation')) {
      estimatedTokens += baseTokens * 0.5; // Validation requires less context
    }

    // Get cost from primary provider
    const capabilities = this.primaryProvider.getCapabilities();
    estimatedCost = this.primaryProvider.estimateCost(
      estimatedTokens * 0.7, // Rough input ratio
      estimatedTokens * 0.3  // Rough output ratio
    );

    return {
      estimatedTokens,
      estimatedCost,
      features,
      cacheHitProbability: await this.estimateCacheHitRate(project, features)
    };
  }

  /**
   * Check if intelligence features are available
   */
  isFeatureAvailable(feature: keyof IntelligenceConfig['features']): boolean {
    return this.features[feature] === true;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await this.cache.getStats();
  }

  /**
   * Clear intelligence cache
   */
  async clearCache() {
    await this.cache.clear();
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.documentationGenerator) {
      await this.documentationGenerator.cleanup();
    }
    if (this.exampleGenerator) {
      await this.exampleGenerator.cleanup();
    }
    if (this.cache instanceof SemanticCache) {
      await this.cache.disconnect();
    }
  }

  // Private helper methods
  private trackFeatureUsage(feature: string): void {
    this.metrics.featureUsage[feature] = (this.metrics.featureUsage[feature] || 0) + 1;
  }

  private updateMetrics(startTime: number, success: boolean, cost: number): void {
    const latency = Date.now() - startTime;
    
    // Update rolling averages
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
    this.metrics.totalCost += cost;
    
    if (success) {
      this.metrics.successRate = (this.metrics.successRate + 1) / 2;
    } else {
      this.metrics.successRate = this.metrics.successRate / 2;
    }
  }

  private async estimateCacheHitRate(
    project: GeneratedProject, 
    features: string[]
  ): Promise<number> {
    // Simple heuristic based on project complexity and feature usage
    const baseRate = 0.3; // 30% base hit rate
    const complexityFactor = Math.min(project.tools.length / 10, 0.4); // More tools = higher hit rate
    const featureBonus = features.length * 0.1; // More features = more reuse

    return Math.min(baseRate + complexityFactor + featureBonus, 0.8); // Cap at 80%
  }
}

// Extended interfaces for enhanced projects
export interface EnhancedProject extends GeneratedProject {
  documentation?: EnhancedDocumentation;
  examples?: CodeExample[];
  validation?: ValidationResult;
  optimizations?: OptimizationHint[];
  intelligence: {
    enhanced: boolean;
    features: string[];
    cost: number;
    cacheHits: number;
    processingTime: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
}

export interface OptimizationHint {
  category: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  estimatedGain: string;
}

export interface CostEstimation {
  estimatedTokens: number;
  estimatedCost: number;
  features: string[];
  cacheHitProbability: number;
}