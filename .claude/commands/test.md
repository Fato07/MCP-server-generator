## MCPGen Testing Context

You're testing MCPGen functionality and ensuring generated code works correctly.

### Testing Strategy
1. **Core Generation**: Verify basic OpenAPI → MCP transformation
2. **AI Features**: Test enhanced documentation and examples
3. **Generated Code**: Ensure output builds and runs
4. **Integration**: Test with real OpenAPI specifications

### Test Commands
```bash
# Basic generation test
mcpgen new basic-test --input examples/weather-api.yaml

# AI features test
mcpgen new ai-test \
  --input examples/weather-api.yaml \
  --enhance-docs \
  --generate-examples \
  --llm-provider anthropic

# Minimal spec test (faster)
mcpgen new minimal-test --input test-minimal.yaml
```

### Test Specifications

**Minimal Test Spec** (`test-minimal.yaml`):
```yaml
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /hello:
    get:
      operationId: sayHello
      parameters:
        - name: name
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Success
```

### Quality Checklist

**Generated Server**:
- ✅ Builds without TypeScript errors
- ✅ Has proper MCP SDK imports
- ✅ Uses `CallToolRequestSchema` handlers
- ✅ Includes error handling for unknown tools
- ✅ No missing dependencies

**AI-Generated Examples**:
- ✅ Use MCP server patterns, not REST client
- ✅ Import `@modelcontextprotocol/sdk`
- ✅ Show proper tool implementations
- ✅ No axios/fetch HTTP client code
- ✅ Include realistic error handling

**CLI Behavior**:
- ✅ Commands complete and exit properly
- ✅ Clear progress indicators
- ✅ Helpful error messages
- ✅ Proper file creation

### Test Validation
```bash
# Verify generated server builds
cd generated-project
npm install
npm run build  # Should succeed
npm start      # Should start MCP server

# Check AI examples quality
grep -r "import.*@modelcontextprotocol" examples/
grep -r "server.setRequestHandler" examples/
```

### Performance Testing
- Small API (1-3 tools): ~15-30 seconds with AI
- Medium API (4-10 tools): ~30-60 seconds with AI
- Large API (10+ tools): ~1-3 minutes with AI

### Regression Testing
Test the major fixes:
1. **AI Context**: Verify examples are MCP server code
2. **Template**: Verify generated servers build
3. **Hanging**: Verify CLI exits properly

Focus on end-to-end testing and verifying the recent improvements work correctly. $ARGUMENTS