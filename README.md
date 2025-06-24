# MCPGen - Automated Model Context Protocol Server Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![AI Enhanced](https://img.shields.io/badge/AI-Enhanced-blue.svg)](https://docs.anthropic.com)

**MCPGen** is an automated CLI tool that generates production-ready **Model Context Protocol (MCP) servers** from OpenAPI specifications. Transform your existing REST APIs into MCP-compatible servers in seconds, with **AI-powered documentation and examples**, enabling seamless integration with AI assistants like Claude Desktop, ChatGPT, and other language models.

## 🚀 Quick Start

```bash
# Install globally for easy access
npm link

# Generate your first MCP server
mcpgen new my-weather-server \
  --input examples/weather-api.yaml \
  --language typescript

# 🤖 Generate with AI enhancements (NEW!)
export ANTHROPIC_API_KEY="your-api-key"
mcpgen new my-weather-server \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic

# Test the generated server
cd my-weather-server
npm install && npm run build && npm start
```

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [CLI Commands](#-cli-commands)
- [Recent Improvements](#-recent-improvements)
- [Examples](#-examples)
- [Architecture](#-architecture)
- [Documentation](#-documentation)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Capabilities
- 🔄 **OpenAPI to MCP Transformation**: Convert REST API specifications to MCP servers
- 🎯 **Multiple Language Support**: TypeScript (ready), Python & Go (coming soon)
- 🛠️ **Production Ready**: Generated servers include proper error handling, validation, and documentation
- ⚡ **Fast Generation**: Complete MCP servers in under 10 seconds
- 🔍 **Comprehensive Validation**: Multi-layer validation from OpenAPI compliance to MCP protocol adherence

### 🤖 AI Intelligence Layer (NEW!)
- 📚 **Enhanced Documentation**: AI-powered README, tool docs, and API references
- 💡 **MCP-Specific Code Examples**: Server-side implementations with proper MCP SDK usage
- 🧠 **Multiple LLM Support**: OpenAI GPT-4, Anthropic Claude, and local Ollama models
- 💰 **Cost Optimization**: 90%+ token reduction and semantic caching for 30-60% cost savings
- 🔒 **Privacy Options**: Local inference with Ollama for sensitive projects
- ⚡ **Fast Generation**: Completes in 15-30 seconds with intelligent prompt engineering
- 🎯 **Context-Aware**: Generates MCP server code, not REST client code

### Generated Features
- **MCP Tools**: Automatic tool generation from API operations
- **Parameter Validation**: Type-safe parameter handling with runtime validation
- **Error Handling**: Robust error handling with meaningful messages
- **Documentation**: Auto-generated README with tool descriptions
- **Docker Support**: Container configurations for easy deployment
- **TypeScript Types**: Full type safety with generated interfaces

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Development Setup
```bash
# Clone the repository
git clone https://github.com/your-org/mcp-server-generator.git
cd mcp-server-generator

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests (when available)
pnpm test
```

### Global Installation (Future)
```bash
# Once published to npm
npm install -g mcpgen
mcpgen --version
```

## 🎮 Usage

### Basic Generation
```bash
# Generate a TypeScript MCP server
node packages/cli/dist/cli.js new my-api-server \
  --input ./my-openapi.yaml \
  --language typescript \
  --output ./servers

# Generate with authentication
node packages/cli/dist/cli.js new secure-api \
  --input ./api-spec.json \
  --auth apikey \
  --template enterprise
```

### 🤖 AI-Enhanced Generation

Transform your API specifications into professional MCP servers with AI-powered documentation and examples:

```bash
# Enhanced documentation with Anthropic Claude
export ANTHROPIC_API_KEY="your-api-key"
node packages/cli/dist/cli.js new my-api-server \
  --input ./my-openapi.yaml \
  --enhance-docs \
  --llm-provider anthropic

# Full AI enhancement with examples
node packages/cli/dist/cli.js new my-api-server \
  --input ./my-openapi.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic \
  --max-cost 0.50

# Using OpenAI for complex APIs
export OPENAI_API_KEY="your-api-key"
node packages/cli/dist/cli.js new complex-api \
  --input ./complex-spec.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider openai \
  --llm-model gpt-4-turbo

# Local AI with Ollama (free and private)
# First: Install Ollama and run 'ollama serve'
node packages/cli/dist/cli.js new my-api-server \
  --input ./my-openapi.yaml \
  --enhance-docs \
  --llm-provider ollama \
  --llm-model codellama
```

**AI Features Include:**
- 📖 **Professional README** with installation guides and usage examples
- 🛠️ **Tool Documentation** with detailed parameter descriptions and examples
- 📝 **Code Examples** with realistic parameters and error handling
- 🚨 **Error Guides** with troubleshooting and best practices
- 📊 **API Reference** with comprehensive endpoint documentation

### Interactive Mode
```bash
# Use interactive prompts for configuration
node packages/cli/dist/cli.js new my-server --interactive
```

### Validation
```bash
# Validate an OpenAPI specification
node packages/cli/dist/cli.js validate ./openapi-spec.yaml

# Validate a generated MCP server
node packages/cli/dist/cli.js validate ./generated-server/

# Detailed validation with verbose output
node packages/cli/dist/cli.js validate ./server --verbose --format json
```

## 📚 CLI Commands

### `mcpgen new <project-name>`
Generate a new MCP server from an OpenAPI specification.

**Core Options:**
- `-i, --input <file>` - OpenAPI specification file (JSON or YAML) **[Required]**
- `-l, --language <lang>` - Target language: `typescript`, `python`, `go` (default: `typescript`)
- `-t, --template <name>` - Template to use: `basic`, `enterprise`, `minimal` (default: `basic`)
- `-o, --output <dir>` - Output directory (default: current directory)
- `-a, --auth <type>` - Authentication type: `none`, `oauth`, `apikey`, `jwt` (default: `none`)
- `--interactive` - Use interactive mode with prompts
- `-v, --verbose` - Enable verbose output

**🤖 AI Enhancement Options:**
- `--enhance-docs` - Enable AI-powered documentation enhancement
- `--generate-examples` - Generate AI-powered code examples
- `--llm-provider <provider>` - LLM provider: `openai`, `anthropic`, `ollama` (default: `anthropic`)
- `--llm-model <model>` - Specific LLM model to use (e.g., `gpt-4-turbo`, `claude-3-5-sonnet`)
- `--llm-api-key <key>` - API key for LLM provider (or use environment variables)
- `--enable-cache` - Enable semantic caching for cost reduction (default: `true`)
- `--max-cost <amount>` - Maximum cost limit for AI features in USD (default: `1.00`)

**Examples:**
```bash
# Basic generation
mcpgen new weather-api --input ./weather.yaml

# With authentication and custom output
mcpgen new secure-api \
  --input ./api.json \
  --auth oauth \
  --output ./my-servers \
  --template enterprise

# Interactive mode
mcpgen new my-api --interactive
```

### `mcpgen validate [target]`
Validate OpenAPI specifications or MCP server projects.

**Options:**
- `-s, --strict` - Enable strict validation mode
- `-f, --format <type>` - Output format: `table`, `json` (default: `table`)
- `-v, --verbose` - Show detailed validation information

**Examples:**
```bash
# Validate OpenAPI specification
mcpgen validate ./openapi.yaml

# Validate generated MCP server
mcpgen validate ./my-server/

# Strict validation with JSON output
mcpgen validate ./api.yaml --strict --format json
```

### `mcpgen add <component> <name>`
Add components to existing MCP servers (Coming Soon).

**Components:**
- `tool` - Add a new tool
- `resource` - Add a new resource  
- `prompt` - Add a new prompt

### `mcpgen deploy [options]`
Generate deployment configurations (Coming Soon).

**Targets:**
- `docker` - Generate Dockerfile and docker-compose
- `railway` - Railway deployment configuration
- `vercel` - Vercel deployment configuration

### `mcpgen dev [directory]`
Start development server with hot reload (Coming Soon).

## 🆕 Recent Improvements

### Version 1.1.0 - AI Intelligence Layer
- ✅ **AI Context Fix**: Examples now generate proper MCP server code instead of REST client code
- ✅ **Template Fixes**: Generated servers now build without errors (fixed missing imports)
- ✅ **Hanging Issues Resolved**: CLI now properly exits after AI generation completes
- ✅ **Multiple LLM Support**: Added OpenAI, Anthropic Claude, and Ollama provider support
- ✅ **Cost Optimization**: Implemented semantic caching and token reduction strategies
- ✅ **Prompt Engineering**: Enhanced prompts generate context-aware MCP server implementations

### Version 1.0.0 - Core Foundation
- ✅ **OpenAPI to MCP Transformation**: Complete conversion pipeline
- ✅ **TypeScript Support**: Full type safety with generated interfaces
- ✅ **Validation System**: Multi-layer validation from OpenAPI to MCP compliance
- ✅ **CLI Interface**: Comprehensive command-line interface with interactive mode

## 📖 Examples

### Example 1: Weather API Service

Using the included weather API example:

```bash
# Generate weather MCP server
node packages/cli/dist/cli.js new weather-service \
  --input examples/weather-api.yaml \
  --language typescript \
  --auth apikey \
  --output ./examples/generated

cd examples/generated/weather-service
npm install
npm run build
npm start
```

**Generated Tools:**
- `getCurrentWeather` - Get current weather for a location
- `getWeatherForecast` - Get multi-day weather forecast  
- `getWeatherAlerts` - Get active weather alerts
- `searchLocations` - Search for locations by name
- `getWeatherHistory` - Get historical weather data
- `getAirQuality` - Get air quality information

### Example 2: E-commerce API

```yaml
# ecommerce-api.yaml
openapi: 3.0.3
info:
  title: E-commerce API
  version: 1.0.0
paths:
  /products:
    get:
      operationId: getProducts
      summary: List products
      parameters:
        - name: category
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Products list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Product'
components:
  schemas:
    Product:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        price:
          type: number
```

```bash
# Generate e-commerce MCP server
mcpgen new ecommerce-api \
  --input ./ecommerce-api.yaml \
  --template enterprise \
  --auth oauth
```

## 🏗️ Architecture

MCPGen follows a **microkernel architecture** with clear separation of concerns:

```
mcpgen/
├── packages/
│   ├── core/                   # Core generation engine
│   │   ├── src/
│   │   │   ├── parsers/        # OpenAPI parsing logic
│   │   │   ├── generators/     # Code generation
│   │   │   ├── templates/      # Template management
│   │   │   ├── validators/     # Validation logic
│   │   │   └── types/          # Type definitions
│   │   └── package.json
│   ├── cli/                    # CLI interface
│   │   ├── src/
│   │   │   ├── commands/       # CLI commands
│   │   │   └── utils/          # CLI utilities
│   │   └── package.json
│   └── templates/              # Template library
│       ├── src/
│       └── templates/          # Template files
├── examples/                   # Example specifications
└── docs/                       # Documentation
```

### Core Components

#### **OpenAPI Parser** (`@mcpgen/core`)
- Parses OpenAPI 3.x specifications (JSON/YAML)
- Resolves `$ref` references and schema definitions
- Extracts tools, resources, and parameters
- Validates specification compliance

#### **Template Engine** (`@mcpgen/core`)
- Handlebars-based templating with custom helpers
- Language-specific code generation
- Extensible plugin system for custom templates
- Built-in helpers for type conversion and validation

#### **CLI Interface** (`@mcpgen/cli`)
- Commander.js-based command structure
- Interactive and non-interactive modes
- Comprehensive error handling and validation
- Configuration file support

#### **Template Library** (`@mcpgen/templates`)
- Pre-built templates for TypeScript, Python, Go
- Project structure templates
- Component templates (tools, resources, prompts)
- Deployment configuration templates

## ⚙️ Configuration

### Configuration File

Create a `mcpgen.config.json` file in your project root:

```json
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

### Environment Variables

```bash
# Default language for generation
MCPGEN_DEFAULT_LANGUAGE=typescript

# Default template
MCPGEN_DEFAULT_TEMPLATE=basic

# Enable debug logging
MCPGEN_DEBUG=true
```

## 🛠️ Development

### Project Structure

```
mcpgen/
├── packages/           # Monorepo packages
├── examples/           # Example OpenAPI specs
├── docs/              # Documentation
├── tests/             # Integration tests
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
└── README.md
```

### Building from Source

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Clean build artifacts
pnpm clean
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific package tests
pnpm --filter @mcpgen/core test
```

### Adding New Templates

1. Create template files in `packages/templates/templates/`
2. Register templates in `packages/templates/src/index.ts`
3. Add template-specific helpers if needed
4. Update documentation

### Adding New Languages

1. Create language-specific generator in `packages/core/src/generators/`
2. Add language templates in `packages/templates/`
3. Update CLI language validation
4. Add tests and documentation

## 📚 Documentation

### Comprehensive Guides
- **[AI Features Guide](docs/AI_FEATURES.md)** - Complete guide to AI-powered documentation and examples
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[API Reference](docs/API.md)** - Detailed API documentation (coming soon)
- **[Template Development](docs/TEMPLATES.md)** - Creating custom templates (coming soon)

### Quick References
- **CLI Commands**: All commands documented above with examples
- **OpenAPI Support**: Full OpenAPI 3.0.x specification support
- **MCP Compliance**: Generated servers follow MCP protocol specification
- **Environment Variables**: Configuration options for all features

### Examples and Tutorials
- **Basic Usage**: See [Examples](#-examples) section above
- **Advanced Patterns**: Check `examples/` directory for real-world specs
- **Integration Examples**: How to connect with Claude Desktop and other AI assistants

### Claude Code Integration
- **[Custom Commands](.claude/README.md)** - Slash commands for instant project context
- **Development Context**: Pre-configured commands for different work areas
- **Team Onboarding**: Quick context loading for new contributors

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. **Load project context**: Use `/project:context` in Claude Code for instant understanding
4. Make your changes and add tests
5. Run the test suite: `pnpm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Claude Code Setup
If you're using Claude Code, take advantage of the custom commands:

```bash
# Get complete project context
/project:context

# Working on specific areas
/project:ai      # AI intelligence features
/project:core    # Core generation engine  
/project:cli     # Command-line interface
/project:debug   # Troubleshooting issues
/project:test    # Testing and validation
```

### Code Style

- Follow TypeScript best practices
- Use Prettier for formatting: `pnpm format`
- Lint code: `pnpm lint`
- Write tests for new features
- Update documentation for user-facing changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the MCP specification
- [OpenAPI Initiative](https://www.openapis.org/) for the OpenAPI specification
- [Handlebars.js](https://handlebarsjs.com/) for templating
- [Commander.js](https://github.com/tj/commander.js/) for CLI framework

## 🔗 Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

**MCPGen** - Bridging the gap between existing APIs and the MCP ecosystem. Generate production-ready MCP servers in seconds, not hours.