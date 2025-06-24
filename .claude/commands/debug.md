## MCPGen Debugging Context

You're troubleshooting issues with MCPGen. Here's the current state and common problems:

### Recently Fixed Issues ✅
1. **AI Context Problem**: Examples were generating REST client code instead of MCP server code
   - **Root Cause**: Prompt templates not using MCP context
   - **Fix**: Updated `buildToolExamplePrompt` to use `PromptTemplate.renderExamplePrompt`
   - **Location**: `packages/intelligence/src/services/example-generator.ts`

2. **Template Build Errors**: Generated servers had missing imports
   - **Root Cause**: Missing `StdioServerTransport` import
   - **Fix**: Updated TypeScript template in `project-generator.ts`
   - **Location**: `packages/core/src/generator/project-generator.ts`

3. **CLI Hanging**: Process wouldn't exit after AI generation
   - **Root Cause**: Redis connections not closing properly
   - **Fix**: Added forced exit timeout
   - **Location**: `packages/cli/src/commands/new.ts`

### Current Known Issues ⚠️
- Minor TypeScript compilation warnings in intelligence package (non-blocking)
- Some LLM API calls may timeout for very large specs

### Debug Commands
```bash
# Enable verbose output
mcpgen new test --input spec.yaml --verbose

# Test with minimal spec
mcpgen new test --input test-minimal.yaml

# Debug AI generation
export DEBUG=mcpgen:*
mcpgen new test --input spec.yaml --enhance-docs

# Test generated server
cd generated-project
npm install && npm run build
```

### Common Debug Scenarios

**Generated Code Issues**:
- Check imports in `src/index.ts`
- Verify tool handlers use proper MCP patterns
- Ensure no axios/fetch in generated examples

**AI Generation Issues**:
- Verify API keys: `echo $ANTHROPIC_API_KEY`
- Check prompt templates in `packages/intelligence/src/templates/prompts.ts`
- Look for MCP context in generated examples

**CLI Issues**:
- Test basic generation first (no AI flags)
- Check process exits properly
- Verify file permissions and paths

### Debug Files to Check
- Generated `src/index.ts` should have proper imports
- Examples should use `@modelcontextprotocol/sdk`
- No `axios` imports in generated code
- Process should exit after completion

### Quality Verification
```bash
# Generated server should build
cd generated-project && npm run build

# Examples should be MCP server code
grep -r "axios" examples/  # Should return nothing
grep -r "CallToolRequestSchema" examples/  # Should find MCP code
```

Focus on verifying the recent fixes are working and generated code follows MCP patterns. $ARGUMENTS