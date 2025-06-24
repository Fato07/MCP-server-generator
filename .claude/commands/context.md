You are now working on **MCPGen**, an automated CLI tool that generates production-ready Model Context Protocol (MCP) servers from OpenAPI specifications.

## Project Overview
MCPGen transforms REST APIs into MCP servers that integrate with AI assistants like Claude Desktop. This is a sophisticated TypeScript monorepo with AI intelligence capabilities.

## Architecture
- **@mcpgen/core** - Core generation engine with OpenAPI parsing
- **@mcpgen/intelligence** - AI-powered documentation using LLMs (OpenAI, Anthropic, Ollama)
- **@mcpgen/cli** - Command-line interface
- **@mcpgen/templates** - Generation templates

## Recent Major Fixes (v1.1.0)
✅ **AI Context Fix**: Examples now generate proper MCP server code instead of REST client code
✅ **Template Fix**: Generated servers build without errors (fixed missing imports)
✅ **Hanging Fix**: CLI properly exits after AI generation
✅ **Prompt Engineering**: Enhanced prompts with explicit MCP context

## Key Files
- `packages/core/src/generator/project-generator.ts` - Main generator with templates
- `packages/intelligence/src/templates/prompts.ts` - LLM prompt templates
- `packages/cli/src/commands/new.ts` - CLI generation command
- `packages/intelligence/src/services/example-generator.ts` - AI example generation

## Current State
- Core generation working perfectly
- AI features generate proper MCP server code
- CLI exits cleanly after operations
- Generated servers build and run correctly
- Some minor TypeScript warnings (non-blocking)

## Development Commands
```bash
pnpm build          # Build all packages
npm link           # Install globally
mcpgen new test --input examples/weather-api.yaml  # Test generation
```

## Docs
@/Users/fathindosunmu/DEV/MyProjects/MCP-server-generator/docs

You now have full context about MCPGen's architecture, recent improvements, and current working state. $ARGUMENTS