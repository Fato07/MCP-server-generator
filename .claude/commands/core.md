## MCPGen Core Generation Engine Context

You're working on the core generation engine that transforms OpenAPI specs into MCP servers.

### Core Architecture
- **ProjectGenerator**: Main orchestrator in `project-generator.ts`
- **OpenAPIParser**: Parses and validates OpenAPI specs
- **Template System**: Handlebars-based code generation
- **Type Generation**: Creates TypeScript interfaces from schemas

### Key Core Files
- `packages/core/src/generator/project-generator.ts` - Main generator with templates
- `packages/core/src/parser/openapi-parser.ts` - OpenAPI specification parser
- `packages/core/src/types/` - Core type definitions
- `packages/core/src/utils/` - Utility functions

### Recent Core Fixes
✅ **Template Fix**: Fixed missing `StdioServerTransport` import in TypeScript template
✅ **Request Handler**: Changed to single handler with switch statement for better error handling
✅ **Error Responses**: Added proper error handling for unknown tools

### Generated Server Structure
```typescript
// Fixed template now generates:
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  switch (toolName) {
    case 'toolName':
      // Tool implementation
      return { content: [{ type: 'text', text: 'response' }] };
    default:
      return { 
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
        isError: true 
      };
  }
});
```

### Core Generation Flow
1. Parse OpenAPI spec
2. Extract operations → Convert to MCP tools
3. Generate TypeScript types from schemas
4. Apply Handlebars templates
5. Create complete project structure
6. Generate package.json, tsconfig.json, etc.

### Testing Core Generation
```bash
mcpgen new test --input examples/weather-api.yaml --language typescript
cd test && npm install && npm run build  # Should build without errors
```

### Core Quality Indicators
- Generated code compiles without TypeScript errors
- Proper MCP SDK imports included
- All tools have request handlers
- Error handling for unknown tools
- Clean project structure with docs

Focus on ensuring generated servers are production-ready and follow MCP best practices. $ARGUMENTS