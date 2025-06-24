# MCP Server Generator - Project Requirements Document

## Project Overview

**Project Name:** MCPGen - Automated Model Context Protocol Server Generator  
**Version:** 1.0.0  
**Target Delivery:** Phase 1 MVP  
**Primary Language:** TypeScript (for the generator tool)  
**Supported Output Languages:** TypeScript, Python, Go  

## Executive Summary

MCPGen is an automated CLI tool that generates production-ready MCP (Model Context Protocol) servers from OpenAPI specifications, with support for natural language annotations. The tool follows a microkernel architecture with plugin extensibility, targeting the rapidly growing MCP ecosystem that currently lacks comprehensive automation tooling.

## Technical Architecture

### Core Architecture Pattern
- **Microkernel Architecture** with plugin system
- **Template-based generation** with AST manipulation
- **Multi-language output** support
- **Schema-driven** primary input with natural language supplements

### Technology Stack
```
Generator Tool:
├── TypeScript/Node.js (core engine)
├── Commander.js (CLI framework)
├── Handlebars (templating engine)
├── TypeScript Compiler API (AST manipulation)
├── Ajv (JSON Schema validation)
└── Jest (testing framework)

Output Languages:
├── TypeScript (@modelcontextprotocol/sdk)
├── Python (fastmcp framework)
└── Go (mark3labs/mcp-go)
```

## Functional Requirements

### F1: Core Generation Engine

#### F1.1: OpenAPI to MCP Transformation
- **Input:** OpenAPI 3.x specification files (JSON/YAML)
- **Output:** Complete MCP server project with:
  - Server implementation files
  - Package configuration (package.json, pyproject.toml, go.mod)
  - Docker configuration
  - README documentation
  - Basic test files

#### F1.2: Multi-Language Support
```typescript
// TypeScript output example
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: "weather-api-server",
  version: "1.0.0"
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Generated tool implementation
});
```

```python
# Python output example
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("weather-api-server")

@mcp.tool()
def get_weather(location: str) -> dict:
    """Get weather information for a location"""
    # Generated implementation
```

#### F1.3: Template System
- **Base Templates:** Configurable project templates for each language
- **Component Templates:** Individual tool, resource, and prompt templates  
- **Custom Templates:** Plugin-based template extensions
- **Template Variables:** Dynamic content injection based on OpenAPI spec

### F2: CLI Interface

#### F2.1: Project Generation Commands
```bash
# Initialize new MCP server
mcpgen new <project-name> [options]
  --input <openapi-file>          # OpenAPI specification file
  --language <ts|python|go>       # Target language (default: typescript)
  --template <template-name>      # Base template (default: basic)
  --output <directory>            # Output directory
  --auth <none|oauth|apikey>      # Authentication type

# Add components to existing project
mcpgen add tool <tool-name> [options]
mcpgen add resource <resource-name> [options]
mcpgen add prompt <prompt-name> [options]

# Generate deployment configurations
mcpgen deploy [options]
  --target <docker|railway|vercel> # Deployment target
  --env <dev|staging|prod>         # Environment

# Validate existing MCP server
mcpgen validate [directory]

# Development server
mcpgen dev [options]
  --watch                         # Watch for changes
  --port <number>                 # Port for development server
```

#### F2.2: Configuration Management
```json
// mcpgen.config.json
{
  "language": "typescript",
  "template": "enterprise",
  "plugins": ["@mcpgen/auth-plugin"],
  "validation": {
    "strict": true,
    "mcp_version": "2025-03-26"
  },
  "deployment": {
    "target": "docker",
    "registry": "ghcr.io"
  }
}
```

### F3: Plugin System

#### F3.1: Plugin Architecture
- **Plugin Interface:** Standardized plugin API
- **Lifecycle Hooks:** Pre/post generation hooks
- **Template Extensions:** Custom template registration
- **Validation Extensions:** Custom validation rules

#### F3.2: Built-in Plugins
- **Authentication Plugin:** OAuth 2.1, API key, JWT support
- **Database Plugin:** Generate database connection tools
- **Deployment Plugin:** Docker, cloud platform configurations
- **Testing Plugin:** Generate comprehensive test suites

### F4: Validation and Quality Assurance

#### F4.1: Multi-Level Validation
- **Schema Validation:** OpenAPI spec compliance
- **MCP Protocol Validation:** Generated code compliance with MCP spec
- **Syntax Validation:** Generated code syntax checking
- **Runtime Validation:** Basic functionality testing

#### F4.2: Code Quality
- **Linting:** ESLint, Pylint, golangci-lint integration
- **Formatting:** Prettier, Black, gofmt integration
- **Type Safety:** Full TypeScript types, Python type hints
- **Documentation:** Automatic JSDoc/docstring generation

## Non-Functional Requirements

### NF1: Performance
- **Generation Time:** < 10 seconds for typical servers (5-20 tools)
- **Memory Usage:** < 500MB during generation
- **File Size:** Minimal generated code footprint

### NF2: Reliability
- **Success Rate:** 99.9% successful generation for valid inputs
- **Error Handling:** Comprehensive error messages with suggestions
- **Recovery:** Graceful degradation for partial specifications

### NF3: Developer Experience
- **Installation Time:** < 2 minutes from npm install to first server
- **Learning Curve:** Working server in < 5 minutes for experienced developers
- **Documentation:** Comprehensive CLI help and online documentation

### NF4: Extensibility
- **Plugin API:** Stable plugin interface with versioning
- **Template System:** Easy custom template creation
- **Configuration:** Hierarchical configuration with overrides

## Project Structure

```
mcpgen/
├── packages/
│   ├── core/                   # Core generation engine
│   │   ├── src/
│   │   │   ├── generators/     # Language-specific generators
│   │   │   ├── templates/      # Base templates
│   │   │   ├── validators/     # Validation logic
│   │   │   └── plugins/        # Plugin management
│   │   └── package.json
│   ├── cli/                    # CLI interface
│   │   ├── src/
│   │   │   ├── commands/       # CLI commands
│   │   │   └── utils/          # CLI utilities
│   │   └── package.json
│   └── plugins/                # Built-in plugins
│       ├── auth/
│       ├── database/
│       └── deployment/
├── templates/                  # Language templates
│   ├── typescript/
│   ├── python/
│   └── go/
├── examples/                   # Example projects
├── docs/                       # Documentation
└── tests/                      # Integration tests
```

## Implementation Plan

### Phase 1: MVP (4-6 weeks)
**Week 1-2: Core Engine**
- OpenAPI parser implementation
- Basic template engine setup
- TypeScript generator (primary language)

**Week 3-4: CLI Interface**
- Commander.js CLI setup
- Basic commands implementation
- Configuration management

**Week 5-6: Validation & Testing**
- MCP protocol validation
- Generated code testing
- Documentation

### Phase 1 Deliverables
- Working CLI tool (`npm install -g mcpgen`)
- TypeScript MCP server generation
- Basic OpenAPI specification support
- Essential CLI commands (new, validate)
- Comprehensive documentation

### Phase 2: Language Expansion (3-4 weeks)
- Python generator implementation
- Go generator implementation
- Plugin system foundation
- Authentication plugin

### Phase 3: Advanced Features (4-5 weeks)
- Web UI for visual configuration
- Advanced deployment options
- Plugin marketplace preparation
- Performance optimizations

## Testing Strategy

### Unit Tests
- Generator logic testing
- Template rendering testing
- Validation rule testing
- CLI command testing

### Integration Tests
- End-to-end generation workflows
- Multi-language output validation
- Plugin system testing
- Generated server runtime testing

### Acceptance Tests
- Real OpenAPI specification testing
- Generated server deployment testing
- Performance benchmarking
- User experience testing

## Success Metrics

### Technical Metrics
- **Generation Success Rate:** > 99% for valid OpenAPI specs
- **Performance:** < 10 seconds generation time
- **Code Quality:** 100% passing linting and type checking
- **Test Coverage:** > 90% code coverage

### User Experience Metrics
- **Time to First Server:** < 5 minutes from installation
- **Documentation Coverage:** 100% CLI commands documented
- **Error Resolution:** Clear error messages with actionable suggestions

### Ecosystem Metrics
- **Community Adoption:** GitHub stars, npm downloads
- **Plugin Ecosystem:** Community plugin contributions
- **Integration Success:** Generated servers working with major MCP clients

## Dependencies and Constraints

### External Dependencies
- Node.js 18+ (runtime requirement)
- OpenAPI 3.x specification compliance
- MCP Protocol 2025-03-26 specification
- Target language runtimes (Node.js, Python 3.8+, Go 1.19+)

### Technical Constraints
- Must generate protocol-compliant MCP servers
- Must support all major MCP transport types (STDIO, HTTP, SSE)
- Must maintain backward compatibility with MCP specification updates
- Generated code must be production-ready without modification

### Resource Constraints
- Single developer team (initially)
- Open source development model
- Community-driven plugin ecosystem

## Risk Assessment

### High Risk
- **MCP Specification Changes:** Protocol evolution could break compatibility
- **Mitigation:** Version-specific generators, automated testing against MCP clients

### Medium Risk
- **OpenAPI Specification Complexity:** Edge cases in complex specifications
- **Mitigation:** Comprehensive test suite with real-world OpenAPI specs

### Low Risk
- **Language-Specific Issues:** Generated code syntax or runtime issues
- **Mitigation:** Language-specific validation and testing

## Getting Started

To begin development, implement the core engine first with TypeScript output support. Start with a minimal OpenAPI parser, basic Handlebars templates, and simple CLI commands. Focus on generating working MCP servers for simple OpenAPI specifications before adding advanced features.

The initial implementation should prioritize developer experience and code quality over feature completeness, establishing a solid foundation for future enhancements and community contributions.