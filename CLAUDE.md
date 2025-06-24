# MCPGen - Automated Model Context Protocol Server Generator

## Project Overview

**MCPGen** is an advanced CLI tool that automatically generates production-ready Model Context Protocol (MCP) servers from OpenAPI specifications. It transforms existing REST APIs into MCP-compatible servers that can integrate seamlessly with AI assistants like Claude Desktop, ChatGPT, and other language models.

## Key Features

### Core Capabilities
- **OpenAPI to MCP Transformation**: Converts REST API specs to MCP servers with full type safety
- **Multi-Language Support**: TypeScript (ready), Python & Go (planned)
- **AI Intelligence Layer**: Enhanced documentation and examples using OpenAI, Anthropic Claude, or local Ollama models
- **Production Ready**: Generated servers include proper error handling, validation, and documentation
- **Fast Generation**: Complete MCP servers in 15-30 seconds

### AI-Powered Features (NEW!)
- **Enhanced Documentation**: AI-generated README, tool docs, and API references
- **MCP-Specific Examples**: Server-side implementations with proper MCP SDK usage
- **Cost Optimization**: 90%+ token reduction and semantic caching for 30-60% cost savings
- **Context-Aware**: Generates MCP server code, not REST client code
- **Multi-LLM Support**: OpenAI GPT-4, Anthropic Claude, and local Ollama models

## Architecture

```
mcpgen/
├── packages/
│   ├── core/                   # Core generation engine
│   │   ├── src/
│   │   │   ├── generator/      # Project generators
│   │   │   ├── parser/         # OpenAPI parsers
│   │   │   ├── types/          # Core types
│   │   │   └── utils/          # Utilities
│   ├── intelligence/           # AI Intelligence Layer
│   │   ├── src/
│   │   │   ├── cache/          # Semantic caching
│   │   │   ├── models/         # LLM providers
│   │   │   ├── services/       # AI services
│   │   │   ├── templates/      # Prompt templates
│   │   │   └── types/          # Intelligence types
│   ├── cli/                    # Command-line interface
│   │   ├── src/
│   │   │   ├── commands/       # CLI commands
│   │   │   ├── utils/          # CLI utilities
│   │   │   └── types/          # CLI types
│   └── templates/              # Generation templates
├── examples/                   # Example OpenAPI specs
├── docs/                       # Documentation
└── test-output/               # Generated test projects
```

## Recent Major Improvements (v1.1.0)

### Fixed Critical Issues
- ✅ **AI Context Fix**: Examples now generate proper MCP server code instead of REST client code
- ✅ **Template Fixes**: Generated servers build without errors (fixed missing imports)
- ✅ **Hanging Issues**: CLI properly exits after AI generation completes
- ✅ **Prompt Engineering**: Enhanced prompts generate context-aware MCP implementations

### Key Technical Fixes
1. **Updated prompt templates** in `packages/intelligence/src/templates/prompts.ts` with explicit MCP context
2. **Fixed core template** in `packages/core/src/generator/project-generator.ts` with proper imports
3. **Added forced exit** in `packages/cli/src/commands/new.ts` to prevent hanging
4. **Improved error handling** throughout the AI enhancement pipeline

## Usage Examples

### Basic Generation
```bash
mcpgen new my-weather-server \
  --input examples/weather-api.yaml \
  --language typescript
```

### AI-Enhanced Generation
```bash
export ANTHROPIC_API_KEY="your-api-key"
mcpgen new my-weather-server \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic
```

### Cost-Optimized Generation
```bash
mcpgen new api-server \
  --input spec.yaml \
  --enhance-docs \
  --generate-examples \
  --max-cost 0.50 \
  --enable-cache
```

## Development Workflow

### Building
```bash
pnpm install
pnpm build
npm link  # Make mcpgen globally available
```

### Testing
```bash
# Test basic generation
mcpgen new test --input examples/weather-api.yaml

# Test AI features
mcpgen new test-ai --input examples/weather-api.yaml --enhance-docs --generate-examples
```

### Key Development Commands
```bash
# Build all packages
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format

# Clean build artifacts
pnpm clean
```

## Important Files and Directories

### Core Generation
- `packages/core/src/generator/project-generator.ts` - Main project generator with templates
- `packages/core/src/parser/openapi-parser.ts` - OpenAPI specification parser
- `packages/core/src/types/` - Core type definitions

### AI Intelligence
- `packages/intelligence/src/services/example-generator.ts` - AI example generation
- `packages/intelligence/src/services/documentation-generator.ts` - AI documentation
- `packages/intelligence/src/templates/prompts.ts` - LLM prompt templates
- `packages/intelligence/src/models/llm-provider.ts` - LLM provider abstractions

### CLI Interface
- `packages/cli/src/commands/new.ts` - Main generation command
- `packages/cli/src/commands/validate.ts` - Validation command
- `packages/cli/src/utils/config-manager.ts` - Configuration management

### Generated Output Structure
```
generated-server/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── tools/               # Individual tool implementations
│   ├── types/               # TypeScript types
│   └── resources/           # Resource handlers
├── examples/                # AI-generated examples (if enabled)
├── docs/                    # Documentation
├── package.json
├── tsconfig.json
└── README.md               # AI-enhanced README (if enabled)
```

## Common Issues and Solutions

### Build Issues
- **Missing imports**: Fixed in v1.1.0, regenerate project with latest version
- **TypeScript errors**: Ensure all packages are built with `pnpm build`

### AI Issues
- **Wrong example type**: Fixed in v1.1.0, examples now generate MCP server code
- **API timeouts**: Use `--max-cost` to limit generation scope
- **No API key**: Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` environment variables

### Performance
- **Slow generation**: Enable caching with `--enable-cache` (default)
- **High costs**: Use local models with `--llm-provider ollama`

## Contributing Guidelines

### Development Preferences
- **File Operations**: Always use MCP filesystem tools (`mcp__filesystem__*`) instead of standard file tools (Read, Write, Edit, LS, etc.)
- **Tool Priority**: Default to MCP-provided tools when available for better integration

### Code Organization
- Each package has specific responsibilities (core, intelligence, cli)
- Use TypeScript for all code with strict type checking
- Follow existing patterns for new features
- Add tests for new functionality

### AI Feature Development
- Prompt templates in `packages/intelligence/src/templates/`
- LLM providers in `packages/intelligence/src/models/`
- Ensure prompts generate MCP server code, not REST client code
- Test with multiple LLM providers

### Testing New Features
1. Build all packages: `pnpm build`
2. Link CLI globally: `npm link`
3. Test with example specs: `mcpgen new test --input examples/weather-api.yaml`
4. Verify generated code builds: `cd test && npm install && npm run build`

## Environment Variables

```bash
# LLM API Keys
ANTHROPIC_API_KEY="your-anthropic-key"
OPENAI_API_KEY="your-openai-key"

# Redis for caching (optional)
REDIS_URL="redis://localhost:6379"

# Debug mode
DEBUG="mcpgen:*"
```

## Project Goals

1. **Simplify MCP Adoption**: Make it easy to convert existing APIs to MCP servers
2. **AI Enhancement**: Provide professional documentation and examples automatically
3. **Production Ready**: Generate servers that can be deployed immediately
4. **Cost Effective**: Optimize AI features for minimal cost while maximizing value
5. **Developer Experience**: Fast, reliable generation with excellent error handling

## Current Status

- ✅ Core generation engine complete
- ✅ TypeScript support complete
- ✅ AI Intelligence Layer complete
- ✅ CLI interface complete
- ✅ Critical bugs fixed (v1.1.0)
- 🔄 Python/Go support in development
- 🔄 Advanced AI features planned