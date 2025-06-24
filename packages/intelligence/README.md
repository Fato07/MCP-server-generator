# @mcpgen/intelligence

LLM-powered intelligence layer for MCPGen that enhances generated MCP servers with AI-driven documentation, examples, and code optimization.

## Features

### Phase 1 (Current)
- **Enhanced Documentation Generation**: AI-powered README, tool docs, and API references
- **Code Example Generation**: Realistic usage examples for all tools
- **OpenAPI Minification**: 90%+ token reduction for efficient LLM processing
- **Semantic Caching**: 30-60% cost reduction through intelligent caching
- **Multi-Provider Support**: OpenAI, Anthropic Claude, and local Ollama models

### Phase 2 (Planned)
- Smart template selection based on API patterns
- Natural language interface for customizations
- Implementation suggestions and optimizations

### Phase 3 (Future)
- Full implementation generation from natural language
- Predictive editing and auto-completion
- Advanced code analysis and refactoring

## Quick Start

```typescript
import { IntelligenceService, IntelligenceUtils } from '@mcpgen/intelligence';

// Create a basic configuration
const config = IntelligenceUtils.createBasicConfig('anthropic', 'your-api-key');

// Initialize the intelligence service
const intelligence = new IntelligenceService({ config });

// Enhance a generated project
const enhanced = await intelligence.enhanceProject(project, openApiSpec, {
  enhanceDocumentation: true,
  generateExamples: true,
  validateImplementation: false
});

console.log('Enhanced features:', enhanced.intelligence.features);
console.log('Cost:', enhanced.intelligence.cost);
console.log('Cache hits:', enhanced.intelligence.cacheHits);
```

## Configuration Options

### Basic Configuration (Recommended)
```typescript
const config = IntelligenceUtils.createBasicConfig('anthropic', process.env.ANTHROPIC_API_KEY);
```

### Development Configuration (Free Local Models)
```typescript
const config = IntelligenceUtils.createDevConfig();
// Requires Ollama running locally
```

### Production Configuration (Cost-Optimized)
```typescript
const config = IntelligenceUtils.createProductionConfig(process.env.ANTHROPIC_API_KEY);
```

### Custom Configuration
```typescript
const config: IntelligenceConfig = {
  llm: {
    primary: {
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY
    },
    validator: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY
    }
  },
  cache: {
    enabled: true,
    redis: {
      host: 'localhost',
      port: 6379
    },
    ttl: 86400 // 24 hours
  },
  features: {
    documentation: true,
    examples: true,
    implementation: false,
    validation: true
  },
  costs: {
    maxMonthly: 50,
    alertThreshold: 0.8
  }
};
```

## Supported LLM Providers

### OpenAI
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Best for**: Complex reasoning and code generation
- **Cost**: Higher, but excellent quality

### Anthropic Claude
- **Models**: Claude 3 Opus, Sonnet, Haiku
- **Best for**: Balanced performance and cost
- **Cost**: Very competitive, especially Haiku

### Ollama (Local)
- **Models**: CodeLlama, Llama 3, Mistral
- **Best for**: Privacy-sensitive workloads
- **Cost**: Free (hardware requirements apply)

## Cost Optimization

The intelligence layer includes several cost optimization features:

### OpenAPI Minification
Reduces OpenAPI specs by 90%+ for LLM processing:
```typescript
import { OpenAPIMinifier } from '@mcpgen/intelligence';

const minified = OpenAPIMinifier.minify(openApiSpec);
console.log(`Token reduction: ${originalSize - minified.tokenCount} tokens`);
```

### Semantic Caching
Intelligent caching with Redis support:
```typescript
// Automatic caching - no additional setup required
const result = await intelligence.enhanceProject(project, spec);
console.log(`Cache hit rate: ${(await intelligence.getCacheStats()).hitRate}%`);
```

### Cost Estimation
Preview costs before enhancement:
```typescript
const estimation = await intelligence.estimateEnhancementCost(
  project, 
  openApiSpec, 
  ['documentation', 'examples']
);

console.log(`Estimated cost: $${estimation.estimatedCost.toFixed(4)}`);
console.log(`Estimated tokens: ${estimation.estimatedTokens}`);
console.log(`Cache hit probability: ${(estimation.cacheHitProbability * 100).toFixed(1)}%`);
```

## CLI Integration

Add AI enhancement to your MCPGen workflow:

```bash
# Generate with AI enhancements
mcpgen new my-api --enhance-docs --generate-examples

# Use local models for privacy
mcpgen new my-api --enhance-docs --llm-provider ollama

# Cost-conscious generation
mcpgen new my-api --enhance-docs --llm-model claude-3-haiku-20240307
```

## Examples

### Enhanced Documentation
The intelligence layer generates comprehensive documentation including:

- **Professional README** with installation, usage, and examples
- **Tool Documentation** with parameter details and usage patterns
- **API Reference** with endpoint descriptions and examples
- **Error Handling Guide** with common scenarios and solutions

### Code Examples
Generates realistic, runnable examples:

- **Quick Start Guide** for immediate usage
- **Tool-Specific Examples** with realistic parameters
- **Error Handling Patterns** with retry logic and debugging
- **Advanced Usage** with optimization techniques

### Implementation Validation
Reviews generated code for:

- **Security Vulnerabilities** and best practices
- **Performance Considerations** and optimizations
- **Code Quality** and maintainability
- **MCP Protocol Compliance** verification

## Metrics and Monitoring

Track intelligence usage and costs:

```typescript
const metrics = intelligence.getMetrics();
console.log({
  requests: metrics.requestCount,
  successRate: metrics.successRate,
  averageLatency: metrics.averageLatency,
  totalCost: metrics.totalCost,
  cacheHitRate: metrics.cacheHitRate,
  featureUsage: metrics.featureUsage
});
```

## Architecture

The intelligence layer follows a three-tier architecture:

1. **Data Pipeline Layer**: OpenAPI minification and preprocessing
2. **Context Enhancement Layer**: Semantic caching and prompt optimization  
3. **LLM Serving Layer**: Multi-provider abstraction and cost management

This design ensures:
- **Reliability**: Deterministic core with AI augmentation
- **Cost Efficiency**: Intelligent caching and token optimization
- **Flexibility**: Multiple providers and local model support
- **Scalability**: Horizontal scaling with Redis clustering

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## Roadmap

- **Q1 2024**: Phase 2 implementation (smart templates, natural language interface)
- **Q2 2024**: Phase 3 planning (full implementation generation)
- **Q3 2024**: Advanced features (code analysis, auto-refactoring)
- **Q4 2024**: Enterprise features (team collaboration, governance)