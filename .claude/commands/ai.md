## MCPGen AI Intelligence Layer Context

You're working on the AI features that enhance generated MCP servers with professional documentation and examples.

### AI Architecture
- **LLM Providers**: OpenAI, Anthropic Claude, Ollama (local)
- **Services**: DocumentationGenerator, ExampleGenerator
- **Caching**: SemanticCache with Redis backend
- **Cost Optimization**: 90%+ token reduction, semantic caching

### Key AI Files
- `packages/intelligence/src/services/example-generator.ts` - Generates AI-powered code examples
- `packages/intelligence/src/services/documentation-generator.ts` - Creates enhanced docs
- `packages/intelligence/src/templates/prompts.ts` - LLM prompt templates
- `packages/intelligence/src/models/llm-provider.ts` - LLM abstractions
- `packages/intelligence/src/cache/semantic-cache.ts` - Caching system

### Recent AI Fixes
✅ **Critical Context Fix**: Updated prompts to generate MCP server code, not REST client code
✅ **Prompt Engineering**: Added explicit warnings against axios/fetch in examples
✅ **Template Integration**: Fixed example generators to use corrected prompt templates
✅ **Hanging Resolution**: Added proper Redis cleanup and forced exit

### AI Generation Flow
1. Parse OpenAPI spec → Extract tools
2. Create generation context with project info
3. Generate prompts with MCP server context
4. Call LLM with optimized prompts
5. Parse responses into structured examples
6. Save to examples/ directory

### Testing AI Features
```bash
mcpgen new test-ai \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic
```

### AI Quality Indicators
- Generated examples use `@modelcontextprotocol/sdk` imports
- Code shows `server.setRequestHandler(CallToolRequestSchema, ...)`
- No axios/fetch/HTTP client code
- Proper MCP response formats with `content` arrays

Focus on maintaining MCP server context in all AI-generated content. $ARGUMENTS