# AI-Enhanced MCP Server Generation Workflow

This example demonstrates how to use MCPGen's AI intelligence features to generate enhanced MCP servers with professional documentation and code examples.

## Prerequisites

Before using AI features, you'll need:

1. **API Keys** (choose one):
   - Anthropic Claude: `export ANTHROPIC_API_KEY="your-key"`
   - OpenAI GPT: `export OPENAI_API_KEY="your-key"`
   - Ollama (local): Install [Ollama](https://ollama.ai) and run `ollama serve`

2. **Optional: Redis** for cost optimization:
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or install locally
   brew install redis && redis-server
   ```

## Basic AI Enhancement

Generate an MCP server with AI-powered documentation:

```bash
# Using Anthropic Claude (recommended for cost-efficiency)
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --llm-provider anthropic

# Using OpenAI GPT (best for complex reasoning)
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --llm-provider openai \
  --llm-model gpt-4-turbo

# Using local Ollama (free, privacy-focused)
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --llm-provider ollama \
  --llm-model codellama
```

## Full AI Enhancement

Generate with documentation AND code examples:

```bash
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic \
  --llm-model claude-3-haiku-20240307 \
  --max-cost 0.50
```

## Interactive Mode with AI

Use interactive mode for guided setup:

```bash
mcpgen new weather-service --interactive
```

The CLI will prompt you for:
- OpenAPI specification file
- Target language (TypeScript, Python, Go)
- Template (basic, enterprise, minimal)
- Authentication type
- **AI enhancement options**
- **LLM provider selection**

## Advanced Configuration

### Cost-Controlled Generation

Set spending limits and enable caching:

```bash
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --generate-examples \
  --max-cost 0.25 \
  --enable-cache
```

### Custom Model Selection

Use specific models for different tasks:

```bash
# Fast and cheap documentation with Claude Haiku
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --llm-provider anthropic \
  --llm-model claude-3-haiku-20240307

# High-quality examples with GPT-4
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --generate-examples \
  --llm-provider openai \
  --llm-model gpt-4
```

### Environment-Based Configuration

Set up environment variables for seamless usage:

```bash
# ~/.bashrc or ~/.zshrc
export ANTHROPIC_API_KEY="your-anthropic-key"
export OPENAI_API_KEY="your-openai-key"
export MCPGEN_DEFAULT_PROVIDER="anthropic"
export MCPGEN_DEFAULT_MODEL="claude-3-haiku-20240307"
export MCPGEN_MAX_COST="1.00"

# Then use simplified commands
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --generate-examples
```

## Generated Output

When AI enhancement is enabled, MCPGen generates:

### Enhanced Documentation
- **Professional README.md** with installation, usage, and examples
- **Detailed tool documentation** with parameter descriptions
- **API reference** with endpoint details and examples
- **Error handling guide** with common scenarios and solutions

### Code Examples
- **Quick start guide** for immediate usage
- **Tool-specific examples** with realistic parameters
- **Error handling patterns** with retry logic
- **Advanced usage patterns** with optimizations

### File Structure
```
weather-service/
├── README.md                 # ✨ AI-enhanced
├── src/
│   ├── tools/
│   │   ├── getCurrentWeather.ts
│   │   └── getWeatherHistory.ts
│   ├── resources/
│   └── server.ts
├── examples/                 # ✨ AI-generated
│   ├── quick-start.ts
│   ├── using-getcurrentweather.ts
│   ├── using-getweatherhistory.ts
│   └── error-handling.ts
├── docs/                     # ✨ AI-enhanced
│   ├── api-reference.md
│   └── error-guide.md
├── package.json
└── tsconfig.json
```

## Cost Optimization

MCPGen includes several cost optimization features:

### Semantic Caching
Automatically caches similar requests to reduce API calls:
```bash
# Enable caching (default: true)
mcpgen new weather-service \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --enable-cache
```

### Token Optimization
Automatically minifies OpenAPI specs by 90%+ for LLM processing:
- Removes unnecessary fields (examples, servers, tags)
- Compresses schema definitions
- Optimizes for specific operations

### Cost Estimation
Preview costs before generation:
```bash
# Estimate costs first
mcpgen estimate \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic

# Expected output:
# Estimated tokens: 2,450
# Estimated cost: $0.0037
# Cache hit probability: 45%
# Proceed? (y/n)
```

## Performance Metrics

After generation, MCPGen displays:

```
✅ MCP server generated successfully
✅ AI enhancements applied successfully

AI Enhancement Results:
  ✓ enhanced-documentation
  ✓ code-examples
  Cost: $0.0031
  Cache hits: 2
  Processing time: 1,247ms

Project details:
  Language: typescript
  Template: basic
  Authentication: none
  AI Enhanced: Yes (anthropic)
  Location: ./weather-service
```

## Troubleshooting

### Common Issues

**No API key found:**
```bash
# Set environment variable
export ANTHROPIC_API_KEY="your-key"

# Or pass via CLI
mcpgen new weather-service --llm-api-key "your-key"
```

**Ollama not running:**
```bash
# Start Ollama service
ollama serve

# Pull required model
ollama pull codellama
```

**High costs:**
```bash
# Use cheaper models
mcpgen new weather-service \
  --enhance-docs \
  --llm-provider anthropic \
  --llm-model claude-3-haiku-20240307 \
  --max-cost 0.10
```

**Slow generation:**
```bash
# Use local models
mcpgen new weather-service \
  --enhance-docs \
  --llm-provider ollama \
  --llm-model codellama
```

## Best Practices

1. **Start Small**: Begin with `--enhance-docs` only
2. **Use Caching**: Enable `--enable-cache` for cost savings
3. **Set Limits**: Always use `--max-cost` for cost control
4. **Choose Right Provider**:
   - **Anthropic Claude**: Best balance of cost and quality
   - **OpenAI GPT**: Best for complex reasoning
   - **Ollama**: Best for privacy and cost (free)
5. **Batch Generations**: Generate multiple servers to leverage caching

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/generate-mcp-servers.yml
name: Generate MCP Servers
on:
  push:
    paths: ['apis/*.yaml']

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install MCPGen
        run: npm install -g @mcpgen/cli
      
      - name: Generate MCP Servers
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          for api in apis/*.yaml; do
            name=$(basename "$api" .yaml)
            mcpgen new "$name-service" \
              --input "$api" \
              --enhance-docs \
              --generate-examples \
              --max-cost 0.50
          done
```

### Package.json Scripts

```json
{
  "scripts": {
    "generate:basic": "mcpgen new my-service --input api.yaml",
    "generate:enhanced": "mcpgen new my-service --input api.yaml --enhance-docs --generate-examples",
    "generate:local": "mcpgen new my-service --input api.yaml --enhance-docs --llm-provider ollama",
    "estimate": "mcpgen estimate --input api.yaml --enhance-docs --generate-examples"
  }
}
```

This AI-enhanced workflow transforms OpenAPI specifications into production-ready MCP servers with professional documentation and realistic code examples, all powered by state-of-the-art language models.