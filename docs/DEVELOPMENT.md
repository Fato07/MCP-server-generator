# Development Guide for MCPGen

This guide helps you get started with MCPGen development, including setup, workflows, and tools.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Git
- Claude Code (optional but recommended)

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/your-org/mcp-server-generator.git
cd mcp-server-generator

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link CLI globally for testing
npm link
```

### Test Your Setup
```bash
# Test basic generation
mcpgen new test-setup --input examples/weather-api.yaml

# Test AI features (requires API key)
export ANTHROPIC_API_KEY="your-key"
mcpgen new test-ai --input examples/weather-api.yaml --enhance-docs
```

## 🛠️ Development Tools

### Claude Code Integration

If you're using Claude Code, this project includes custom slash commands for instant context:

#### Available Commands
- **`/project:context`** - Complete project overview and recent fixes
- **`/project:ai`** - AI intelligence features and LLM providers
- **`/project:core`** - Core generation engine and templates
- **`/project:cli`** - CLI interface and user experience
- **`/project:debug`** - Troubleshooting and recently fixed issues
- **`/project:test`** - Testing strategies and quality validation

#### Usage Examples
```bash
# Start any session with complete context
/project:context

# Working on AI features
/project:ai I need to improve prompt templates

# Debugging generated code
/project:debug The server builds but examples are wrong

# Testing new features
/project:test Verify AI examples generate proper MCP code
```

#### Benefits
- ✅ **Instant Context**: Get up to speed immediately
- ✅ **Targeted Help**: Context specific to your work area
- ✅ **Recent Fixes**: Awareness of all v1.1.0 improvements
- ✅ **Team Onboarding**: New contributors get context fast

## 📁 Project Structure

### Monorepo Layout
```
mcpgen/
├── packages/
│   ├── core/                   # Core generation engine
│   │   ├── src/
│   │   │   ├── generator/      # Project generators
│   │   │   ├── parser/         # OpenAPI parsers
│   │   │   └── types/          # Core types
│   ├── intelligence/           # AI Intelligence Layer
│   │   ├── src/
│   │   │   ├── cache/          # Semantic caching
│   │   │   ├── models/         # LLM providers
│   │   │   ├── services/       # AI services
│   │   │   └── templates/      # Prompt templates
│   ├── cli/                    # Command-line interface
│   │   ├── src/
│   │   │   ├── commands/       # CLI commands
│   │   │   └── utils/          # CLI utilities
│   └── templates/              # Generation templates
├── examples/                   # Example OpenAPI specs
├── docs/                       # Documentation
├── .claude/                    # Claude Code commands
└── test-output/               # Generated test projects
```

### Key Files for Development

#### Core Generation
- `packages/core/src/generator/project-generator.ts` - Main generator with templates
- `packages/core/src/parser/openapi-parser.ts` - OpenAPI specification parser
- `packages/core/src/types/` - Core type definitions

#### AI Intelligence
- `packages/intelligence/src/services/example-generator.ts` - AI example generation
- `packages/intelligence/src/templates/prompts.ts` - LLM prompt templates
- `packages/intelligence/src/models/llm-provider.ts` - LLM provider abstractions

#### CLI Interface
- `packages/cli/src/commands/new.ts` - Main generation command
- `packages/cli/src/commands/validate.ts` - Validation command
- `packages/cli/src/utils/config-manager.ts` - Configuration management

## 🔄 Development Workflow

### 1. Choose Your Work Area
Use Claude Code commands to get context:
```bash
/project:core     # Working on generation engine
/project:ai       # Working on AI features
/project:cli      # Working on CLI interface
```

### 2. Development Commands
```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @mcpgen/core build

# Watch mode for development
pnpm --filter @mcpgen/core dev

# Lint code
pnpm lint

# Format code
pnpm format
```

### 3. Testing Your Changes
```bash
# Test basic generation
mcpgen new test --input examples/weather-api.yaml

# Test with AI features
mcpgen new test-ai --input examples/weather-api.yaml --enhance-docs --generate-examples

# Test generated server builds
cd test && npm install && npm run build
```

### 4. Quality Checks
```bash
# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Type check
pnpm type-check

# Validate generated code quality
mcpgen validate ./test/
```

## 🧪 Testing Strategy

### Unit Tests
```bash
# Run tests for specific package
pnpm --filter @mcpgen/core test
pnpm --filter @mcpgen/intelligence test
pnpm --filter @mcpgen/cli test
```

### Integration Tests
```bash
# Test end-to-end generation
mcpgen new integration-test --input examples/weather-api.yaml
cd integration-test
npm install && npm run build && npm start
```

### AI Feature Testing
```bash
# Test AI with different providers
mcpgen new ai-openai --input examples/weather-api.yaml --enhance-docs --llm-provider openai
mcpgen new ai-anthropic --input examples/weather-api.yaml --enhance-docs --llm-provider anthropic

# Test local AI (requires Ollama)
mcpgen new ai-local --input examples/weather-api.yaml --enhance-docs --llm-provider ollama
```

## 🎯 Focus Areas

### Recent Improvements (v1.1.0)
When working on the project, be aware of these recent fixes:

1. **AI Context Fix**: Examples now generate proper MCP server code
   - Location: `packages/intelligence/src/services/example-generator.ts`
   - What changed: Prompt templates now use MCP context

2. **Template Fix**: Generated servers build without errors
   - Location: `packages/core/src/generator/project-generator.ts`
   - What changed: Added missing imports and proper error handling

3. **Hanging Fix**: CLI exits properly after AI generation
   - Location: `packages/cli/src/commands/new.ts`
   - What changed: Added forced exit timeout

### Quality Standards
- Generated servers must build without TypeScript errors
- AI examples must be MCP server code, not REST client code
- CLI must exit cleanly after operations
- All generated code should follow MCP SDK patterns

## 🐛 Debugging Tips

### Common Issues
1. **Generated code won't build**: Check for missing imports in templates
2. **AI generates wrong code**: Verify prompt templates have MCP context
3. **CLI hangs**: Check for unclosed connections or missing exit handling

### Debug Commands
```bash
# Enable verbose output
mcpgen new test --input spec.yaml --verbose

# Debug AI generation
export DEBUG=mcpgen:*
mcpgen new test --input spec.yaml --enhance-docs

# Test with minimal spec
mcpgen new test --input test-minimal.yaml
```

### Using Claude Code for Debugging
```bash
/project:debug I'm getting TypeScript errors in generated code
/project:debug The AI is generating REST client code instead of MCP server code
/project:debug The CLI hangs after generation completes
```

## 📝 Code Style

### TypeScript Guidelines
- Use strict type checking
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### File Organization
- Keep related functionality in same directory
- Use barrel exports (index.ts) for clean imports
- Separate types into dedicated files
- Group utilities by functionality

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make commits with clear messages
git commit -m "feat: add amazing feature"
git commit -m "fix: resolve issue with templates"
git commit -m "docs: update development guide"

# Push and create PR
git push origin feature/amazing-feature
```

## 🚀 Release Process

### Version Management
- Use semantic versioning (major.minor.patch)
- Update package.json files consistently
- Tag releases in git

### Build and Publish
```bash
# Build all packages
pnpm build

# Run full test suite
pnpm test

# Publish (when ready)
pnpm publish
```

## 🤝 Getting Help

### Resources
- **Documentation**: Check `docs/` directory
- **Examples**: Use example OpenAPI specs in `examples/`
- **Claude Code**: Use `/project:debug` for troubleshooting context
- **Issues**: Report bugs and feature requests on GitHub

### Community
- Follow contributing guidelines in `CONTRIBUTING.md`
- Use clear issue descriptions with reproduction steps
- Include relevant context when asking for help

Happy coding! 🎉