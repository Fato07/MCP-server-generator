## MCPGen CLI Interface Context

You're working on the command-line interface that provides user-friendly access to MCPGen features.

### CLI Architecture
- **Commander.js**: CLI framework for commands and options
- **Commands**: new, validate, deploy (planned)
- **Interactive Mode**: Inquirer.js for guided setup
- **Configuration**: Support for config files and environment variables

### Key CLI Files
- `packages/cli/src/commands/new.ts` - Main generation command
- `packages/cli/src/commands/validate.ts` - Validation command
- `packages/cli/src/commands/base-command.ts` - Shared command functionality
- `packages/cli/src/utils/config-manager.ts` - Configuration handling
- `packages/cli/src/cli.ts` - Main CLI entry point

### Recent CLI Fixes
✅ **Hanging Fix**: Added forced exit after AI generation completes
✅ **AI Integration**: Seamlessly integrated AI features with CLI flags
✅ **Error Handling**: Improved error messages and user feedback
✅ **Process Management**: Proper cleanup of Redis connections

### CLI Commands Structure
```bash
# Core options
mcpgen new <project-name> \
  --input <spec-file> \
  --language typescript \
  --output <directory>

# AI enhancement options
mcpgen new <project-name> \
  --input <spec-file> \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic \
  --max-cost 1.00

# Interactive mode
mcpgen new <project-name> --interactive
```

### CLI Integration Points
- **Core Generator**: Calls `@mcpgen/core` for basic generation
- **AI Intelligence**: Calls `@mcpgen/intelligence` for AI features
- **Configuration**: Manages API keys and settings
- **Validation**: Integrates OpenAPI and MCP validation

### Recent CLI Improvements
- Added comprehensive AI flags (`--enhance-docs`, `--generate-examples`, etc.)
- Implemented proper timeout and exit handling
- Enhanced error messages for AI features
- Added cost controls and provider selection

### Testing CLI
```bash
npm link  # Install globally
mcpgen --help
mcpgen new test --input examples/weather-api.yaml --verbose
```

### CLI Quality Indicators
- Commands complete and exit properly
- Clear error messages and user feedback
- Comprehensive help text
- Proper handling of all edge cases
- Smooth integration between core and AI features

Focus on user experience, clear messaging, and reliable operation across all features. $ARGUMENTS