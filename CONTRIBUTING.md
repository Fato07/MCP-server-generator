# Contributing to MCPGen

We welcome contributions to MCPGen! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/mcp-server-generator.git
   cd mcp-server-generator
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Build the Project**
   ```bash
   pnpm build
   ```

4. **Run Tests**
   ```bash
   pnpm test
   ```

## 📋 Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-python-support` - New features
- `fix/openapi-parser-bug` - Bug fixes
- `docs/update-readme` - Documentation updates
- `refactor/template-engine` - Code refactoring

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run all tests
   pnpm test
   
   # Run linting
   pnpm lint
   
   # Format code
   pnpm format
   
   # Test CLI functionality
   node packages/cli/dist/cli.js new test-server --input examples/weather-api.yaml --output ./test-output
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add support for Python code generation"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or modifying tests
   - `chore:` - Maintenance tasks

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🏗️ Project Structure

Understanding the codebase structure:

```
mcpgen/
├── packages/
│   ├── core/                   # Core generation engine
│   │   ├── src/
│   │   │   ├── parsers/        # OpenAPI parsing
│   │   │   ├── generator/      # Code generation
│   │   │   ├── template/       # Template engine
│   │   │   └── types/          # TypeScript types
│   │   └── package.json
│   ├── cli/                    # CLI interface
│   │   ├── src/
│   │   │   ├── commands/       # CLI commands
│   │   │   └── utils/          # Utilities
│   │   └── package.json
│   └── templates/              # Template library
│       └── src/
├── examples/                   # Example OpenAPI specs
├── docs/                       # Documentation
└── tests/                      # Integration tests
```

## 🧪 Testing Guidelines

### Writing Tests

1. **Unit Tests**
   - Test individual functions and classes
   - Mock external dependencies
   - Focus on edge cases and error conditions

2. **Integration Tests**
   - Test complete workflows
   - Test CLI commands end-to-end
   - Validate generated code quality

3. **Test Structure**
   ```typescript
   // packages/core/src/parsers/openapi-parser.test.ts
   import { OpenAPIParser } from './openapi-parser.js';
   
   describe('OpenAPIParser', () => {
     let parser: OpenAPIParser;
     
     beforeEach(() => {
       parser = new OpenAPIParser();
     });
     
     describe('parseFromFile', () => {
       it('should parse valid OpenAPI specification', async () => {
         // Test implementation
       });
       
       it('should throw error for invalid specification', async () => {
         // Test implementation
       });
     });
   });
   ```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific package tests
pnpm --filter @mcpgen/core test

# Run tests in watch mode
pnpm test --watch
```

## 🎨 Code Style

### TypeScript Guidelines

1. **Type Safety**
   - Use strict TypeScript settings
   - Avoid `any` types
   - Define interfaces for complex objects
   - Use type guards for runtime type checking

2. **Code Organization**
   - Use barrel exports (`index.ts`) for clean imports
   - Keep functions small and focused
   - Use descriptive variable and function names
   - Add JSDoc comments for public APIs

3. **Error Handling**
   - Use custom error classes
   - Provide helpful error messages
   - Handle edge cases gracefully

### Example Code Style

```typescript
// Good
interface GenerationOptions {
  projectName: string;
  language: SupportedLanguage;
  template: string;
  outputPath: string;
}

export class ProjectGenerator {
  /**
   * Generates an MCP server project from OpenAPI specification
   */
  async generateProject(options: GenerationOptions): Promise<void> {
    try {
      const validationResult = await this.validateOptions(options);
      if (!validationResult.valid) {
        throw new ValidationError(validationResult.errors);
      }
      
      // Implementation...
    } catch (error) {
      throw new GenerationError(`Failed to generate project: ${error.message}`, error);
    }
  }
  
  private async validateOptions(options: GenerationOptions): Promise<ValidationResult> {
    // Implementation...
  }
}
```

### Formatting

We use Prettier for consistent code formatting:

```bash
# Format all code
pnpm format

# Check formatting without fixing
pnpm format:check
```

## 📝 Documentation

### Code Documentation

- Add JSDoc comments for all public APIs
- Include parameter descriptions and return types
- Provide usage examples for complex functions

### README Updates

When adding new features:
- Update the main README.md
- Add examples showing how to use the feature
- Update CLI command documentation
- Add any new configuration options

### Claude Code Integration

For development with Claude Code, use the custom slash commands for instant context:

```bash
# Start any session with complete project context
/project:context

# Working on specific areas
/project:ai       # AI intelligence features and LLM providers
/project:core     # Core generation engine and templates  
/project:cli      # CLI interface and user experience
/project:debug    # Troubleshooting and recently fixed issues
/project:test     # Testing strategies and quality validation
```

**Benefits:**
- ✅ **Instant Context**: Get up to speed on the project immediately
- ✅ **Targeted Help**: Context specific to your work area
- ✅ **Recent Fixes**: Awareness of all v1.1.0 improvements
- ✅ **Team Onboarding**: New contributors get context fast

The commands are defined in `.claude/commands/` and include awareness of recent improvements like the AI context fix, template fixes, and hanging issues resolution.

### Example Documentation

```typescript
/**
 * Parses an OpenAPI specification and extracts MCP tools
 * 
 * @param filePath - Path to the OpenAPI specification file
 * @returns Promise resolving to parsed OpenAPI document
 * 
 * @example
 * ```typescript
 * const parser = new OpenAPIParser();
 * const spec = await parser.parseFromFile('./api.yaml');
 * const tools = parser.extractTools();
 * ```
 * 
 * @throws {Error} When the specification is invalid or file cannot be read
 */
async parseFromFile(filePath: string): Promise<OpenAPIV3.Document> {
  // Implementation...
}
```

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Minimal steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: 
   - Node.js version
   - Operating system
   - MCPGen version
6. **Sample Files**: Include OpenAPI specifications that trigger the bug

### Bug Report Template

```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Run command: `mcpgen new test --input api.yaml`
2. Observe error in generated code
3. ...

## Expected Behavior
The generated code should compile without errors

## Actual Behavior
TypeScript compilation fails with error: ...

## Environment
- Node.js: v18.17.0
- OS: macOS 13.4
- MCPGen: v1.0.0

## Additional Context
- OpenAPI specification attached
- Generated code attached
```

## 💡 Feature Requests

For new features:

1. **Check Existing Issues**: Look for similar requests
2. **Describe the Use Case**: Explain why this feature is needed
3. **Provide Examples**: Show how the feature would be used
4. **Consider Implementation**: Suggest how it might work

## 🔧 Adding New Features

### Adding a New Language

1. **Core Generator**
   ```typescript
   // packages/core/src/generators/python-generator.ts
   export class PythonGenerator implements LanguageGenerator {
     async generateProject(context: GenerationContext): Promise<void> {
       // Implementation
     }
   }
   ```

2. **Templates**
   ```typescript
   // packages/templates/src/index.ts
   this.registerTemplate('python', 'server', 'basic', pythonServerTemplate);
   ```

3. **CLI Support**
   ```typescript
   // Update language validation in CLI commands
   const supportedLanguages: SupportedLanguage[] = ['typescript', 'python', 'go'];
   ```

4. **Tests**
   ```typescript
   // Add comprehensive tests for the new language
   describe('PythonGenerator', () => {
     // Test cases
   });
   ```

5. **Documentation**
   - Update README with Python examples
   - Add Python-specific configuration options
   - Update CLI help text

### Adding New CLI Commands

1. **Command Implementation**
   ```typescript
   // packages/cli/src/commands/new-command.ts
   export class NewCommand extends BaseCommand {
     register(program: Command): void {
       program
         .command('new-command')
         .description('Description of the new command')
         .action(async (options) => {
           await this.execute(options);
         });
     }
   }
   ```

2. **Registration**
   ```typescript
   // packages/cli/src/cli.ts
   new NewCommand().register(program);
   ```

3. **Tests**
   ```typescript
   // Test the command functionality
   describe('NewCommand', () => {
     it('should execute successfully', async () => {
       // Test implementation
     });
   });
   ```

## 🏆 Recognition

Contributors will be recognized in:
- README.md acknowledgments
- CHANGELOG.md for releases
- GitHub releases notes

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: All PRs receive thorough code review

## 📋 Checklist

Before submitting a PR:

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] PR description explains the changes
- [ ] No merge conflicts

Thank you for contributing to MCPGen! 🎉