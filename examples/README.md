# MCPGen Examples

This directory contains example OpenAPI specifications that demonstrate MCPGen's capabilities.

## 📋 Available Examples

### 🌤️ Weather API (`weather-api.yaml`)

A comprehensive weather service API that showcases:

- **Multiple HTTP Methods**: GET and POST operations
- **Complex Parameters**: Query parameters, path parameters, and request bodies
- **Rich Schemas**: Nested objects, arrays, and enums
- **Authentication**: API key authentication
- **Multiple Endpoints**: 6 different weather-related operations

**Generated Tools:**
- `getCurrentWeather` - Get current weather for a location
- `getWeatherForecast` - Get multi-day weather forecast
- `getWeatherAlerts` - Get active weather alerts  
- `searchLocations` - Search for locations by name
- `getWeatherHistory` - Get historical weather data (POST operation)
- `getAirQuality` - Get air quality data with coordinates

**Try it:**
```bash
node packages/cli/dist/cli.js new weather-service \
  --input examples/weather-api.yaml \
  --language typescript \
  --auth apikey \
  --output ./test-output
```

## 🎯 Testing Your Own APIs

To test MCPGen with your own OpenAPI specifications:

1. **Prepare Your OpenAPI Spec**
   - Ensure it's valid OpenAPI 3.x format
   - Include operation IDs for better tool names
   - Add descriptions for better documentation

2. **Generate MCP Server**
   ```bash
   node packages/cli/dist/cli.js new my-server \
     --input ./your-api.yaml \
     --output ./output
   ```

3. **Validate the Result**
   ```bash
   node packages/cli/dist/cli.js validate ./output/my-server
   ```

## 📝 OpenAPI Best Practices for MCP

### Operation IDs
Use descriptive operation IDs that will become MCP tool names:

```yaml
paths:
  /users/{id}:
    get:
      operationId: getUserById  # Becomes 'getUserById' tool
      summary: Get user by ID
```

### Parameter Descriptions
Add clear descriptions for all parameters:

```yaml
parameters:
  - name: location
    in: query
    required: true
    description: Location name (city, state, country)
    schema:
      type: string
      example: "San Francisco, CA"
```

### Response Schemas
Define clear response schemas for better tool output handling:

```yaml
responses:
  '200':
    description: User information
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
```

### Component Reuse
Use components for reusable schemas:

```yaml
components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
```

## 🔧 Example Customizations

### Adding Authentication

```yaml
# Add to your OpenAPI spec
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - ApiKeyAuth: []
```

Generate with authentication:
```bash
node packages/cli/dist/cli.js new secure-api \
  --input ./your-api.yaml \
  --auth apikey
```

### Complex Request Bodies

```yaml
paths:
  /search:
    post:
      operationId: searchItems
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - query
              properties:
                query:
                  type: string
                  description: Search query
                filters:
                  type: object
                  properties:
                    category:
                      type: string
                    priceRange:
                      type: object
                      properties:
                        min:
                          type: number
                        max:
                          type: number
```

## 🚀 Real-World API Examples

Here are some public APIs you could try with MCPGen:

### GitHub API
```bash
# Download GitHub's OpenAPI spec
curl -o github-api.yaml https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.yaml

# Generate MCP server (note: this is a large spec, might need filtering)
node packages/cli/dist/cli.js new github-server --input github-api.yaml
```

### JSONPlaceholder API
Create a simple test API spec:

```yaml
openapi: 3.0.3
info:
  title: JSONPlaceholder API
  version: 1.0.0
  description: Simple testing API
servers:
  - url: https://jsonplaceholder.typicode.com
paths:
  /posts:
    get:
      operationId: getPosts
      summary: Get all posts
      responses:
        '200':
          description: List of posts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Post'
  /posts/{id}:
    get:
      operationId: getPostById
      summary: Get post by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Post details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
components:
  schemas:
    Post:
      type: object
      properties:
        id:
          type: integer
        userId:
          type: integer
        title:
          type: string
        body:
          type: string
```

## 📚 Learning Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.3)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [OpenAPI Generator](https://openapi-generator.tech/) - For comparison with other tools

## 🤝 Contributing Examples

Have a great OpenAPI specification that would make a good example? 

1. Ensure it's publicly available or you have permission to share
2. Add it to this directory with a descriptive name
3. Update this README with the example details
4. Submit a pull request

### Example Criteria
- **Educational Value**: Demonstrates specific MCPGen features
- **Realistic**: Based on real-world API patterns
- **Well-Documented**: Clear descriptions and examples
- **Manageable Size**: Not too large for quick testing

## 🐛 Troubleshooting

### Common Issues

**OpenAPI Validation Errors:**
```bash
# Validate your OpenAPI spec first
node packages/cli/dist/cli.js validate ./your-api.yaml
```

**Generation Failures:**
- Check that your OpenAPI spec has valid operation IDs
- Ensure required fields are properly marked
- Verify schema definitions are complete

**Empty Tool Generation:**
- Make sure your API has operations (GET, POST, etc.)
- Check that operations have valid responses
- Verify the specification isn't using unsupported features

Need help? Open an issue on GitHub with your OpenAPI specification and the error you're encountering.