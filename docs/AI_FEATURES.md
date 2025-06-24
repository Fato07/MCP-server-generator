# 🤖 AI Intelligence Features

MCPGen's AI Intelligence Layer transforms your OpenAPI specifications into professional MCP servers with enhanced documentation, realistic code examples, and intelligent optimizations.

## 🌟 Features Overview

### 📚 Enhanced Documentation
- **Professional README**: AI-generated README with installation guides, usage examples, and comprehensive tool documentation
- **Tool Documentation**: Detailed parameter descriptions, return types, and usage patterns
- **API Reference**: Complete endpoint documentation with examples
- **Error Guides**: Comprehensive troubleshooting and best practices

### 💡 Code Examples
- **MCP Server Examples**: Proper server-side implementations using MCP SDK
- **Tool Usage Examples**: Realistic parameter examples with proper error handling
- **Integration Examples**: How to connect with Claude Desktop and other AI assistants
- **Best Practices**: Performance optimization and error handling patterns

### 🧠 Multi-LLM Support
- **Anthropic Claude**: Recommended for complex API documentation (Sonnet 3.5, Haiku 3.5)
- **OpenAI GPT**: Great for code generation (GPT-4, GPT-4-turbo)
- **Local Ollama**: Privacy-focused local inference (CodeLlama, Llama 3.1)

## 🚀 Quick Start

### Basic AI Enhancement
```bash
export ANTHROPIC_API_KEY="your-api-key"
mcpgen new my-api-server \
  --input ./api-spec.yaml \
  --enhance-docs \
  --generate-examples
```

### Advanced Configuration
```bash
mcpgen new complex-api \
  --input ./complex-spec.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic \
  --llm-model claude-3-5-sonnet-20241022 \
  --max-cost 2.00 \
  --enable-cache
```

### Local AI (Privacy-First)
```bash
# Start Ollama first: ollama serve
# Pull a model: ollama pull codellama
mcpgen new private-api \
  --input ./spec.yaml \
  --enhance-docs \
  --llm-provider ollama \
  --llm-model codellama
```

## 💰 Cost Optimization

### Token Reduction (90%+ savings)
- **OpenAPI Minification**: Removes unnecessary fields and descriptions
- **Smart Context**: Only relevant spec sections sent to LLM
- **Prompt Optimization**: Efficient prompts that generate better results with fewer tokens

### Semantic Caching (30-60% savings)
- **Cache Similar Requests**: Reuses responses for similar API patterns
- **Redis Backend**: Persistent caching across sessions
- **Smart Invalidation**: Cache expires intelligently based on content

### Cost Controls
```bash
# Set maximum cost limit
mcpgen new api --enhance-docs --max-cost 0.50

# Enable aggressive caching
mcpgen new api --enhance-docs --enable-cache

# Use local models (free)
mcpgen new api --enhance-docs --llm-provider ollama
```

## 🎯 Generated Content Quality

### Before AI Enhancement
```typescript
// Basic generated tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'getWeather') {
    // TODO: Add your implementation here
    return {
      content: [{ type: 'text', text: 'Tool executed successfully' }]
    };
  }
});
```

### After AI Enhancement
```typescript
// AI-enhanced tool with realistic implementation
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'getWeather') {
    const { location, units = 'metric' } = request.params.arguments || {};
    
    if (!location) {
      return {
        content: [{ type: 'text', text: 'Error: location parameter is required' }],
        isError: true
      };
    }
    
    try {
      // Implementation would call actual weather service here
      const weatherData = await getWeatherFromService(location, units);
      
      return {
        content: [{
          type: 'text',
          text: `Current weather in ${location}: ${weatherData.temperature}°${units === 'metric' ? 'C' : 'F'}, ${weatherData.description}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error fetching weather: ${error.message}` }],
        isError: true
      };
    }
  }
});
```

## 🛠️ Configuration Options

### Environment Variables
```bash
# LLM API Keys
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"

# Redis for caching (optional)
export REDIS_URL="redis://localhost:6379"
```

### LLM Provider Settings

#### Anthropic Claude
```bash
mcpgen new api \
  --llm-provider anthropic \
  --llm-model claude-3-5-sonnet-20241022 \
  --enhance-docs
```

#### OpenAI GPT
```bash
mcpgen new api \
  --llm-provider openai \
  --llm-model gpt-4-turbo \
  --enhance-docs
```

#### Ollama (Local)
```bash
# First setup Ollama
ollama serve
ollama pull codellama

mcpgen new api \
  --llm-provider ollama \
  --llm-model codellama \
  --enhance-docs
```

## 📊 Performance & Costs

### Typical Generation Times
- **Small API** (1-3 tools): 15-30 seconds
- **Medium API** (4-10 tools): 30-60 seconds  
- **Large API** (10+ tools): 1-3 minutes

### Cost Examples (Anthropic Claude)
- **Small API** with examples: $0.05-0.15
- **Medium API** with full enhancement: $0.20-0.50
- **Large API** with all features: $0.50-2.00

### Optimization Tips
1. **Use caching**: Reduces repeat costs by 30-60%
2. **Set cost limits**: Use `--max-cost` to control spending
3. **Choose right model**: Haiku for simple docs, Sonnet for complex APIs
4. **Local models**: Ollama for privacy and zero cost

## 🔧 Troubleshooting

### Common Issues

#### API Key Not Found
```bash
Error: No API key found for AI features
```
**Solution**: Set environment variable or use `--llm-api-key`
```bash
export ANTHROPIC_API_KEY="your-key"
# or
mcpgen new api --llm-api-key "your-key"
```

#### Generation Timeout
```bash
Error: AI enhancement timed out
```
**Solution**: Try smaller API or increase timeout
```bash
mcpgen new api --enhance-docs --max-cost 0.25
```

#### Cache Issues
```bash
Warning: Redis connection failed
```
**Solution**: Caching falls back to memory automatically, or disable:
```bash
mcpgen new api --enhance-docs --enable-cache=false
```

## 🎯 Best Practices

### 1. Start Small
```bash
# First try basic enhancement
mcpgen new test-api --input small-spec.yaml --enhance-docs

# Then add examples if satisfied
mcpgen new api --input spec.yaml --enhance-docs --generate-examples
```

### 2. Use Appropriate Models
- **Documentation**: Anthropic Claude (better at structured writing)
- **Code Examples**: OpenAI GPT-4 (strong at code generation)
- **Privacy**: Ollama CodeLlama (local, no data sent to external APIs)

### 3. Cost Management
```bash
# Set budgets
mcpgen new api --enhance-docs --max-cost 1.00

# Use caching for iterations
mcpgen new api --enhance-docs --enable-cache

# Try local models first
mcpgen new api --enhance-docs --llm-provider ollama
```

### 4. Quality Control
- Review generated examples before using in production
- Test generated servers: `npm run build && npm start`
- Use `mcpgen validate` to check MCP compliance

## 🔮 Future Enhancements

### Planned Features
- **Smart Template Selection**: AI chooses optimal template based on API complexity
- **Natural Language Interface**: "Generate a weather MCP server with caching"
- **Performance Optimization**: AI suggests performance improvements
- **Testing Generation**: AI-generated test suites
- **Multi-language Support**: Python and Go AI enhancement

### Contributing
The AI Intelligence Layer is actively developed. Contributions welcome:
- Prompt improvements in `packages/intelligence/src/templates/`
- New LLM providers in `packages/intelligence/src/models/`
- Cost optimization strategies
- Quality metrics and validation