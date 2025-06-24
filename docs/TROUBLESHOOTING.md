# 🔧 Troubleshooting Guide

Common issues and solutions for MCPGen.

## 🚨 Generation Issues

### OpenAPI Specification Problems

#### "OpenAPI specification file not found"
```bash
Error: OpenAPI specification file not found: ./api.yaml
```
**Solutions:**
- Check file path is correct: `ls -la ./api.yaml`
- Use absolute path: `mcpgen new api --input /full/path/to/api.yaml`
- Verify file exists and is readable

#### "Invalid OpenAPI specification"
```bash
Error: Invalid OpenAPI specification
```
**Solutions:**
- Validate your OpenAPI spec: https://editor.swagger.io/
- Check for required fields: `openapi`, `info`, `paths`
- Ensure valid YAML/JSON syntax

#### "No operations found in specification"
```bash
Warning: No operations found in specification
```
**Solutions:**
- Add operationId to all operations:
```yaml
paths:
  /users:
    get:
      operationId: getUsers  # Required!
      responses:
        '200':
          description: User list
```

### Build and Runtime Issues

#### TypeScript Compilation Errors
```bash
src/index.ts:10:49 - error TS2345: Argument of type...
```
**Solutions:**
- Update to latest MCPGen: `git pull && npm run build`
- Check generated imports match MCP SDK version
- Regenerate project with latest template

#### Missing Dependencies
```bash
Error: Cannot find module '@modelcontextprotocol/sdk'
```
**Solutions:**
```bash
cd your-generated-project
npm install
# or if package.json is missing dependencies:
npm install @modelcontextprotocol/sdk
```

#### Server Won't Start
```bash
ReferenceError: StdioServerTransport is not defined
```
**Solutions:**
- Regenerate with latest MCPGen (this was fixed in v1.1.0)
- Add missing import:
```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
```

## 🤖 AI Features Issues

### API Key Problems

#### "No API key found for AI features"
```bash
Error: No API key found for AI features. Skipping AI enhancements.
```
**Solutions:**
```bash
# Set environment variable
export ANTHROPIC_API_KEY="your-key-here"
export OPENAI_API_KEY="your-key-here"

# Or pass directly
mcpgen new api --input spec.yaml --enhance-docs --llm-api-key "your-key"
```

#### "Authentication failed"
```bash
Error: Authentication error: Invalid API key
```
**Solutions:**
- Verify API key is correct and active
- Check API key has proper permissions
- For Anthropic: Ensure you have credit balance
- For OpenAI: Check API key isn't expired

### Generation Timeouts

#### "AI enhancement timed out"
```bash
Error: AI enhancement timed out after 2 minutes
```
**Solutions:**
- Try with smaller OpenAPI spec
- Reduce cost limit: `--max-cost 0.25`
- Use faster model: `--llm-model claude-3-haiku`
- Disable examples: remove `--generate-examples`

#### "LLM request failed"
```bash
Error: LLM request failed: Rate limit exceeded
```
**Solutions:**
- Wait and retry (rate limits reset)
- Use different LLM provider: `--llm-provider openai`
- Try local model: `--llm-provider ollama`

### Quality Issues

#### Generated Examples Use axios/REST
```bash
// Wrong: REST client code
import axios from 'axios';
const response = await axios.get('/api/weather');
```
**Solution:** This was fixed in v1.1.0. Update MCPGen:
```bash
git pull
npm run build
# Regenerate your project
```

#### Examples Don't Match API
```bash
// Generated example doesn't match your actual API
```
**Solutions:**
- Ensure OpenAPI spec is accurate and complete
- Add detailed descriptions to operations
- Use proper parameter schemas
- Regenerate with `--verbose` to see prompts

## 🔄 Cache and Performance

### Redis Connection Issues
```bash
Warning: Redis connection failed, using memory cache
```
**Solutions:**
- Install Redis: `brew install redis` (macOS) or `apt install redis` (Linux)
- Start Redis: `redis-server`
- Or disable caching: `--enable-cache=false`

### Slow Generation
```bash
AI enhancement taking too long...
```
**Solutions:**
- Enable caching: `--enable-cache` (default)
- Use smaller cost limit: `--max-cost 0.50`
- Try local model for development: `--llm-provider ollama`
- Simplify OpenAPI spec (remove unused schemas)

## 🌐 Network and Connectivity

### SSL/TLS Issues
```bash
Error: certificate verify failed
```
**Solutions:**
- Check internet connection
- Try different network (corporate firewalls can block API calls)
- Set NODE_TLS_REJECT_UNAUTHORIZED=0 (development only)

### Proxy Issues
```bash
Error: connect ECONNREFUSED
```
**Solutions:**
- Configure proxy if behind corporate firewall
- Use local models: `--llm-provider ollama`
- Check firewall allows HTTPS to api.anthropic.com or api.openai.com

## 📱 Platform-Specific Issues

### macOS Issues

#### Permission Denied
```bash
Error: EACCES: permission denied
```
**Solutions:**
```bash
sudo chown -R $(whoami) ~/.npm
# or use a different directory
mcpgen new api --output ~/my-projects/
```

#### Homebrew SSL Issues
```bash
Error: unable to get local issuer certificate
```
**Solutions:**
```bash
# Update Homebrew and certificates
brew update
brew install ca-certificates
```

### Windows Issues

#### Path Separators
```bash
Error: cannot resolve path 'folder\file.yaml'
```
**Solutions:**
- Use forward slashes: `--input ./api/spec.yaml`
- Or escape backslashes: `--input .\\api\\spec.yaml`

#### PowerShell Execution Policy
```bash
Error: execution of scripts is disabled
```
**Solutions:**
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Linux Issues

#### Node.js Version
```bash
Error: Unsupported Node.js version
```
**Solutions:**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 🛠️ Development and Debugging

### Enable Debug Mode
```bash
# Verbose output
mcpgen new api --input spec.yaml --verbose

# Debug AI prompts (development)
DEBUG=mcpgen:* mcpgen new api --enhance-docs
```

### Check Generated Files
```bash
# Validate generated project
mcpgen validate ./generated-project/

# Test build manually
cd generated-project
npm install
npm run build
npm run lint    # if available
npm run test    # if available
```

### Common File Issues

#### Missing Files
```bash
src/index.ts: No such file or directory
```
**Solutions:**
- Check generation completed successfully
- Look for error messages during generation
- Regenerate project: `mcpgen new api --input spec.yaml`

#### Permission Issues
```bash
Error: EACCES: permission denied, open 'package.json'
```
**Solutions:**
```bash
# Fix permissions
chmod -R 755 ./generated-project/
# or generate in different directory
mcpgen new api --output ~/writable-directory/
```

## 📋 Getting Help

### Collect Debug Information
```bash
# Version info
mcpgen --version
node --version
npm --version

# System info
uname -a  # Linux/macOS
echo $PATH

# Test with minimal example
mcpgen new test --input examples/minimal.yaml --verbose
```

### Create Minimal Reproduction
```yaml
# minimal-test.yaml
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /test:
    get:
      operationId: testOperation
      responses:
        '200':
          description: Success
```

```bash
mcpgen new test --input minimal-test.yaml --verbose
```

### Report Issues
Include in your issue report:
1. MCPGen version (`mcpgen --version`)
2. Node.js version (`node --version`)
3. Operating system
4. Full command used
5. Complete error message
6. Minimal OpenAPI spec that reproduces the issue

**GitHub Issues**: https://github.com/your-org/mcp-server-generator/issues

## 🚀 Recovery Steps

### Complete Reset
```bash
# Clean everything and start fresh
rm -rf node_modules package-lock.json
npm install
npm run build

# Test with simple example
mcpgen new test --input examples/weather-api.yaml
```

### Fallback Options
```bash
# Generate without AI if having issues
mcpgen new api --input spec.yaml
# No --enhance-docs or --generate-examples

# Use local AI to avoid API issues
mcpgen new api --input spec.yaml --enhance-docs --llm-provider ollama
```