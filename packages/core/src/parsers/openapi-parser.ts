import SwaggerParser from '@apidevtools/swagger-parser';
import type { OpenAPIV3 } from 'openapi-types';
import { MCPTool, MCPParameter, MCPResource, ValidationResult, ValidationError } from '../types/index.js';

export class OpenAPIParser {
  private spec: OpenAPIV3.Document | null = null;

  async parseFromFile(filePath: string): Promise<OpenAPIV3.Document> {
    try {
      const api = await SwaggerParser.validate(filePath);
      this.spec = api as OpenAPIV3.Document;
      return this.spec;
    } catch (error) {
      throw new Error(`Failed to parse OpenAPI specification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async parseFromObject(spec: OpenAPIV3.Document): Promise<OpenAPIV3.Document> {
    try {
      const api = await SwaggerParser.validate(spec);
      this.spec = api as OpenAPIV3.Document;
      return this.spec;
    } catch (error) {
      throw new Error(`Failed to validate OpenAPI specification: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  extractTools(): MCPTool[] {
    if (!this.spec) {
      throw new Error('No OpenAPI specification loaded');
    }

    const tools: MCPTool[] = [];

    for (const [path, pathItem] of Object.entries(this.spec.paths || {})) {
      if (!pathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!this.isHttpMethod(method) || !operation || typeof operation !== 'object') continue;

        const tool = this.createMCPTool(path, method, operation as OpenAPIV3.OperationObject);
        if (tool) {
          tools.push(tool);
        }
      }
    }

    return tools;
  }

  extractResources(): MCPResource[] {
    if (!this.spec) {
      throw new Error('No OpenAPI specification loaded');
    }

    const resources: MCPResource[] = [];
    
    // Extract resources from response schemas that represent data entities
    for (const [path, pathItem] of Object.entries(this.spec.paths || {})) {
      if (!pathItem) continue;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!this.isHttpMethod(method) || !operation || typeof operation !== 'object' || method.toLowerCase() !== 'get') continue;

        const resource = this.createMCPResource(path, operation as OpenAPIV3.OperationObject);
        if (resource) {
          resources.push(resource);
        }
      }
    }

    return resources;
  }

  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    
    if (!this.spec) {
      errors.push({
        code: 'NO_SPEC',
        message: 'No OpenAPI specification loaded',
        path: '',
        severity: 'error'
      });
      return { valid: false, errors, warnings: [] };
    }

    // Validate OpenAPI version
    if (!this.spec.openapi || !this.spec.openapi.startsWith('3.')) {
      errors.push({
        code: 'UNSUPPORTED_VERSION',
        message: 'Only OpenAPI 3.x is supported',
        path: 'openapi',
        severity: 'error'
      });
    }

    // Validate required fields
    if (!this.spec.info) {
      errors.push({
        code: 'MISSING_INFO',
        message: 'OpenAPI info section is required',
        path: 'info',
        severity: 'error'
      });
    }

    if (!this.spec.paths || Object.keys(this.spec.paths).length === 0) {
      errors.push({
        code: 'NO_PATHS',
        message: 'No paths defined in OpenAPI specification',
        path: 'paths',
        severity: 'error'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  private createMCPTool(path: string, method: string, operation: OpenAPIV3.OperationObject): MCPTool | null {
    const operationId = operation.operationId || `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const description = operation.summary || operation.description || `${method.toUpperCase()} ${path}`;
    
    const parameters = this.extractParameters(operation);
    const returnType = this.extractReturnType(operation);

    return {
      name: operationId,
      description,
      parameters,
      returnType,
      operation,
      path,
      method: method.toUpperCase()
    };
  }

  private createMCPResource(path: string, operation: OpenAPIV3.OperationObject): MCPResource | null {
    // Only create resources for GET operations that return data
    const responses = operation.responses;
    const successResponse = responses?.['200'] || responses?.['201'];
    
    if (!successResponse) return null;

    const responseObj = successResponse as OpenAPIV3.ResponseObject;
    const content = responseObj.content;
    
    if (!content) return null;

    const resourceName = operation.operationId || path.replace(/[^a-zA-Z0-9]/g, '_');
    const description = operation.summary || operation.description || `Resource from ${path}`;

    // Determine MIME type
    const mimeTypes = Object.keys(content);
    const mimeType = mimeTypes.includes('application/json') ? 'application/json' : mimeTypes[0];

    return {
      name: resourceName,
      description,
      uri: `resource://${resourceName}`,
      mimeType
    };
  }

  private extractParameters(operation: OpenAPIV3.OperationObject): MCPParameter[] {
    const parameters: MCPParameter[] = [];

    // Extract path parameters
    if (operation.parameters) {
      for (const param of operation.parameters) {
        const paramObj = param as OpenAPIV3.ParameterObject;
        const schema = paramObj.schema && '$ref' in paramObj.schema ? 
          { type: 'object' } as OpenAPIV3.SchemaObject : 
          paramObj.schema as OpenAPIV3.SchemaObject;
          
        parameters.push({
          name: paramObj.name,
          type: this.schemaToTypeString(schema),
          description: paramObj.description,
          required: paramObj.required || false,
          schema: schema
        });
      }
    }

    // Extract request body parameters
    if (operation.requestBody) {
      const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
      const content = requestBody.content;
      
      if (content && content['application/json']) {
        const schema = content['application/json'].schema as OpenAPIV3.SchemaObject;
        // Don't use prefix for request body parameters - they should be top-level
        const bodyParams = this.extractSchemaParameters(schema);
        parameters.push(...bodyParams);
      }
    }

    return parameters;
  }

  private extractSchemaParameters(schema: OpenAPIV3.SchemaObject, prefix: string = ''): MCPParameter[] {
    const parameters: MCPParameter[] = [];

    if (schema.type === 'object' && schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const propSchemaObj = propSchema as OpenAPIV3.SchemaObject;
        const paramName = prefix ? `${prefix}.${propName}` : propName;
        
        parameters.push({
          name: paramName,
          type: this.schemaToTypeString(propSchemaObj),
          description: propSchemaObj.description,
          required: schema.required?.includes(propName) || false,
          schema: propSchemaObj
        });
      }
    }

    return parameters;
  }

  private extractReturnType(operation: OpenAPIV3.OperationObject): string {
    const responses = operation.responses;
    const successResponse = responses?.['200'] || responses?.['201'] || responses?.['204'];
    
    if (!successResponse) return 'void';

    const responseObj = successResponse as OpenAPIV3.ResponseObject;
    const content = responseObj.content;
    
    if (!content || !content['application/json']) return 'void';

    const schema = content['application/json'].schema as OpenAPIV3.SchemaObject;
    return this.schemaToTypeString(schema);
  }

  private schemaToTypeString(schema: OpenAPIV3.SchemaObject | undefined): string {
    if (!schema) return 'unknown';

    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        const itemType = this.schemaToTypeString(schema.items as OpenAPIV3.SchemaObject);
        return `${itemType}[]`;
      case 'object':
        return 'object';
      default:
        return 'unknown';
    }
  }

  private isHttpMethod(method: string): boolean {
    return ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase());
  }

  getSpec(): OpenAPIV3.Document | null {
    return this.spec;
  }
}