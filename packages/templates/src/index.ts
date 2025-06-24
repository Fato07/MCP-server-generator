import { SupportedLanguage } from '@mcpgen/core';

export interface TemplateRegistry {
  getTemplate(language: SupportedLanguage, templateType: string, templateName: string): string;
  listTemplates(language: SupportedLanguage): string[];
  registerTemplate(language: SupportedLanguage, templateType: string, templateName: string, content: string): void;
}

export class DefaultTemplateRegistry implements TemplateRegistry {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.loadBuiltinTemplates();
  }

  getTemplate(language: SupportedLanguage, templateType: string, templateName: string): string {
    const key = `${language}:${templateType}:${templateName}`;
    const template = this.templates.get(key);
    
    if (!template) {
      throw new Error(`Template not found: ${key}`);
    }
    
    return template;
  }

  listTemplates(language: SupportedLanguage): string[] {
    const prefix = `${language}:`;
    return Array.from(this.templates.keys())
      .filter(key => key.startsWith(prefix))
      .map(key => key.substring(prefix.length));
  }

  registerTemplate(language: SupportedLanguage, templateType: string, templateName: string, content: string): void {
    const key = `${language}:${templateType}:${templateName}`;
    this.templates.set(key, content);
  }

  private loadBuiltinTemplates(): void {
    // Load TypeScript templates
    this.loadTypescriptTemplates();
    
    // Load Python templates
    this.loadPythonTemplates();
    
    // TODO: Load Go templates
    // this.loadGoTemplates();
  }

  private loadTypescriptTemplates(): void {
    // Basic TypeScript server template
    this.registerTemplate('typescript', 'server', 'basic', `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

class {{pascalCase project.packageInfo.name}}Server {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: '{{project.packageInfo.name}}',
      version: '{{project.packageInfo.version}}'
    }, {
      capabilities: {
        tools: {}
      }
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {{#each project.tools}}
          {
            name: '{{name}}',
            description: '{{description}}',
            inputSchema: {
              type: 'object',
              properties: {
                {{#each parameters}}
                {{name}}: {
                  type: '{{type}}',
                  description: '{{description}}'{{#if required}},
                  required: true{{/if}}
                }{{#unless @last}},{{/unless}}
                {{/each}}
              }
            }
          }{{#unless @last}},{{/unless}}
          {{/each}}
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        {{#each project.tools}}
        case '{{name}}':
          return await this.{{camelCase name}}(args);
        {{/each}}
        default:
          throw new Error(\`Unknown tool: \${name}\`);
      }
    });
  }

  {{#each project.tools}}
  private async {{camelCase name}}(args: any): Promise<any> {
    // TODO: Implement {{name}}
    // This tool maps to: {{method}} {{path}}
    
    {{#each parameters}}
    const {{name}} = args.{{name}};
    {{/each}}

    return {
      content: [
        {
          type: 'text',
          text: 'Tool {{name}} executed successfully'
        }
      ]
    };
  }

  {{/each}}

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('{{project.packageInfo.name}} MCP server running on stdio');
  }
}

async function main(): Promise<void> {
  const server = new {{pascalCase project.packageInfo.name}}Server();
  await server.run();
}

main().catch(console.error);
`);

    // TypeScript package.json template
    this.registerTemplate('typescript', 'config', 'package.json', `{
  "name": "{{project.packageInfo.name}}",
  "version": "{{project.packageInfo.version}}",
  "description": "{{project.packageInfo.description}}",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "mcp",
    "model-context-protocol"
  ],
  "author": "{{project.packageInfo.author}}",
  "license": "{{project.packageInfo.license}}"
}`);

    // TypeScript tsconfig.json template
    this.registerTemplate('typescript', 'config', 'tsconfig.json', `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"
  ]
}`);

    // Basic README template
    this.registerTemplate('typescript', 'docs', 'README.md', `# {{project.packageInfo.name}}

{{project.packageInfo.description}}

## Description

This MCP server was automatically generated from an OpenAPI specification using MCPGen.

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm run build
npm start
\`\`\`

For development:

\`\`\`bash
npm run dev
\`\`\`

## Generated Tools

{{#each project.tools}}
### {{name}}

{{description}}

**Method:** {{method}} {{path}}

**Parameters:**
{{#each parameters}}
- \`{{name}}\` ({{type}}){{#if required}} - Required{{/if}}: {{description}}
{{/each}}

{{/each}}

{{#if project.resources}}
## Generated Resources

{{#each project.resources}}
### {{name}}

{{description}}

**URI:** {{uri}}
{{#if mimeType}}**MIME Type:** {{mimeType}}{{/if}}

{{/each}}
{{/if}}

## Configuration

This server can be configured using environment variables or a configuration file.

## Development

To contribute to this project:

1. Make your changes
2. Run tests: \`npm test\`
3. Build: \`npm run build\`
4. Test the server: \`npm start\`

## License

{{project.packageInfo.license}}
`);

    // Docker template
    this.registerTemplate('typescript', 'deployment', 'Dockerfile', `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcpserver -u 1001

# Change ownership of the app directory
RUN chown -R mcpserver:nodejs /app
USER mcpserver

# Expose port (if using HTTP transport)
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
`);
  }

  private loadPythonTemplates(): void {
    // Basic Python server template using fastmcp
    this.registerTemplate('python', 'server', 'basic', `
from mcp.server.fastmcp import FastMCP
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastMCP server
app = FastMCP("{{project.packageInfo.name}}")

{{#each project.tools}}
@app.tool()
def {{snake_case name}}({{#each parameters}}{{name}}: {{toPythonType type}}{{#unless @last}}, {{/unless}}{{/each}}) -> Dict[str, Any]:
    """{{description}}
    
    Args:
{{#each parameters}}
        {{name}} ({{toPythonType type}}): {{description}}
{{/each}}
    
    Returns:
        Dict[str, Any]: Result of the {{name}} operation
    """
    logger.info(f"Executing tool: {{name}}")
    
    # TODO: Implement {{name}}
    # This tool maps to: {{method}} {{path}}
    
    {{#each parameters}}
    # Parameter: {{name}} = {{{name}}}
    {{/each}}
    
    return {
        "success": True,
        "message": "Tool {{name}} executed successfully",
        "data": {}
    }

{{/each}}

if __name__ == "__main__":
    logger.info("Starting {{project.packageInfo.name}} MCP server")
    app.run()
`);

    // Python pyproject.toml template
    this.registerTemplate('python', 'config', 'pyproject.toml', `[project]
name = "{{project.packageInfo.name}}"
version = "{{project.packageInfo.version}}"
description = "{{project.packageInfo.description}}"
readme = "README.md"
license = {text = "{{project.packageInfo.license}}"}
authors = [
    {{#if project.packageInfo.author}}{name = "{{project.packageInfo.author}}"},{{/if}}
]
classifiers = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.8",
    "Programming Language :: Python :: 3.9",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
]
requires-python = ">= 3.8"
dependencies = [
    "fastmcp>=0.1.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
    "black>=23.0.0",
    "flake8>=6.0.0",
    "mypy>=1.0.0",
    "pre-commit>=3.0.0",
]

[project.urls]
Homepage = "https://github.com/example/{{project.packageInfo.name}}"
Repository = "https://github.com/example/{{project.packageInfo.name}}.git"
Issues = "https://github.com/example/{{project.packageInfo.name}}/issues"

[project.scripts]
{{snake_case project.packageInfo.name}} = "{{snake_case project.packageInfo.name}}.main:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/{{snake_case project.packageInfo.name}}"]

[tool.black]
line-length = 88
target-version = ["py38"]
include = '\.pyi?
python_version = "3.8"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
addopts = "--cov=src --cov-report=term-missing"
testpaths = ["tests"]
`);

    // Python README template
    this.registerTemplate('python', 'docs', 'README.md', `# {{project.packageInfo.name}}

{{project.packageInfo.description}}

## Description

This MCP server was automatically generated from an OpenAPI specification using MCPGen.
It uses the FastMCP framework for easy development and deployment.

## Installation

### From PyPI (when published)

\`\`\`bash
pip install {{project.packageInfo.name}}
\`\`\`

### Development Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd {{project.packageInfo.name}}

# Install in development mode
pip install -e .

# Or install with development dependencies
pip install -e ".[dev]"
\`\`\`

## Usage

### Running the Server

\`\`\`bash
# Run directly
python src/main.py

# Or using the installed script
{{snake_case project.packageInfo.name}}
\`\`\`

### Configuration

The server can be configured using environment variables:

\`\`\`bash
# Set log level
export LOG_LEVEL=DEBUG

# Run the server
python src/main.py
\`\`\`

## Generated Tools

{{#each project.tools}}
### {{name}}

{{description}}

**Method:** {{method}} {{path}}

**Parameters:**
{{#each parameters}}
- \`{{name}}\` ({{toPythonType type}}){{#if required}} - Required{{/if}}: {{description}}
{{/each}}

**Example Usage:**
\`\`\`python
result = {{snake_case name}}({{#each parameters}}{{name}}="example_value"{{#unless @last}}, {{/unless}}{{/each}})
print(result)
\`\`\`

{{/each}}

{{#if project.resources}}
## Generated Resources

{{#each project.resources}}
### {{name}}

{{description}}

**URI:** {{uri}}
{{#if mimeType}}**MIME Type:** {{mimeType}}{{/if}}

{{/each}}
{{/if}}

## Development

### Setting up Development Environment

\`\`\`bash
# Install development dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
\`\`\`

### Running Tests

\`\`\`bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html
\`\`\`

### Code Quality

\`\`\`bash
# Format code
black src/ tests/

# Lint code
flake8 src/ tests/

# Type checking
mypy src/
\`\`\`

## License

{{project.packageInfo.license}}

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Submit a pull request
`);

    // Python Dockerfile template
    this.registerTemplate('python', 'deployment', 'Dockerfile', `FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create app directory
WORKDIR /app

# Create non-root user
RUN groupadd -r mcpuser && useradd -r -g mcpuser mcpuser

# Copy requirements and install dependencies
COPY pyproject.toml ./
RUN pip install -e .

# Copy application code
COPY src/ ./src/

# Change ownership to non-root user
RUN chown -R mcpuser:mcpuser /app
USER mcpuser

# Expose port (if using HTTP transport)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Start the server
CMD ["python", "src/main.py"]
`);

    // Python requirements.txt template (for simpler deployments)
    this.registerTemplate('python', 'config', 'requirements.txt', `fastmcp>=0.1.0
pydantic>=2.0.0
`);

    // Python .gitignore template
    this.registerTemplate('python', 'config', '.gitignore', `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
.python-version

# celery beat schedule file
celerybeat-schedule

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/
`);
  }
}

// Export default instance
export const templateRegistry = new DefaultTemplateRegistry();
export default templateRegistry;

[tool.mypy]
python_version = "3.8"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
addopts = "--cov=src --cov-report=term-missing"
testpaths = ["tests"]
`);

    // Python README template
    this.registerTemplate('python', 'docs', 'README.md', `# {{project.packageInfo.name}}

{{project.packageInfo.description}}

## Description

This MCP server was automatically generated from an OpenAPI specification using MCPGen.
It uses the FastMCP framework for easy development and deployment.

## Installation

### From PyPI (when published)

\`\`\`bash
pip install {{project.packageInfo.name}}
\`\`\`

### Development Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd {{project.packageInfo.name}}

# Install in development mode
pip install -e .

# Or install with development dependencies
pip install -e ".[dev]"
\`\`\`

## Usage

### Running the Server

\`\`\`bash
# Run directly
python src/main.py

# Or using the installed script
{{snake_case project.packageInfo.name}}
\`\`\`

### Configuration

The server can be configured using environment variables:

\`\`\`bash
# Set log level
export LOG_LEVEL=DEBUG

# Run the server
python src/main.py
\`\`\`

## Generated Tools

{{#each project.tools}}
### {{name}}

{{description}}

**Method:** {{method}} {{path}}

**Parameters:**
{{#each parameters}}
- \`{{name}}\` ({{toPythonType type}}){{#if required}} - Required{{/if}}: {{description}}
{{/each}}

**Example Usage:**
\`\`\`python
result = {{snake_case name}}({{#each parameters}}{{name}}="example_value"{{#unless @last}}, {{/unless}}{{/each}})
print(result)
\`\`\`

{{/each}}

{{#if project.resources}}
## Generated Resources

{{#each project.resources}}
### {{name}}

{{description}}

**URI:** {{uri}}
{{#if mimeType}}**MIME Type:** {{mimeType}}{{/if}}

{{/each}}
{{/if}}

## Development

### Setting up Development Environment

\`\`\`bash
# Install development dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
\`\`\`

### Running Tests

\`\`\`bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html
\`\`\`

### Code Quality

\`\`\`bash
# Format code
black src/ tests/

# Lint code
flake8 src/ tests/

# Type checking
mypy src/
\`\`\`

## License

{{project.packageInfo.license}}

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Submit a pull request
`);

    // Python Dockerfile template
    this.registerTemplate('python', 'deployment', 'Dockerfile', `FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create app directory
WORKDIR /app

# Create non-root user
RUN groupadd -r mcpuser && useradd -r -g mcpuser mcpuser

# Copy requirements and install dependencies
COPY pyproject.toml ./
RUN pip install -e .

# Copy application code
COPY src/ ./src/

# Change ownership to non-root user
RUN chown -R mcpuser:mcpuser /app
USER mcpuser

# Expose port (if using HTTP transport)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Start the server
CMD ["python", "src/main.py"]
`);

    // Python requirements.txt template (for simpler deployments)
    this.registerTemplate('python', 'config', 'requirements.txt', `fastmcp>=0.1.0
pydantic>=2.0.0
`);

    // Python .gitignore template
    this.registerTemplate('python', 'config', '.gitignore', `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
.pytest_cache/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
.python-version

# celery beat schedule file
celerybeat-schedule

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/
`);
  }
}

// Export default instance
export const templateRegistry = new DefaultTemplateRegistry();
export default templateRegistry;