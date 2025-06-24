import type { OpenAPIV3 } from 'openapi-types';
import { MinifiedSpec, MinifiedOperation, MinifiedParameter, MinifiedSchema } from '../types/index.js';

export class OpenAPIMinifier {
  private static readonly EXCLUDED_FIELDS = new Set([
    'examples',
    'example',
    'externalDocs',
    'xml',
    'contact',
    'license',
    'termsOfService',
    'servers',
    'tags',
    'security',
    'callbacks',
    'links'
  ]);

  /**
   * Minifies an OpenAPI specification for LLM consumption
   * Removes unnecessary fields and optimizes for token efficiency
   */
  static minify(spec: OpenAPIV3.Document): MinifiedSpec {
    const minified: MinifiedSpec = {
      info: {
        title: spec.info.title,
        version: spec.info.version,
        description: this.truncateDescription(spec.info.description)
      },
      paths: this.minifyPaths(spec.paths || {}),
      schemas: this.minifySchemas(spec.components?.schemas || {}),
      tokenCount: 0
    };

    // Calculate approximate token count
    const content = JSON.stringify(minified);
    minified.tokenCount = this.estimateTokens(content);

    return minified;
  }

  /**
   * Creates a minimal spec focused on specific operations
   */
  static minifyForOperation(spec: OpenAPIV3.Document, operationIds: string[]): MinifiedSpec {
    const relevantPaths = this.filterPathsByOperations(spec.paths || {}, operationIds);
    const relevantSchemas = this.extractRelevantSchemas(relevantPaths, spec.components?.schemas || {});

    return {
      info: {
        title: spec.info.title,
        version: spec.info.version
      },
      paths: this.minifyPaths(relevantPaths),
      schemas: this.minifySchemas(relevantSchemas),
      tokenCount: 0
    };
  }

  /**
   * Optimizes spec for specific token limit
   */
  static optimizeForTokenLimit(minified: MinifiedSpec, maxTokens: number): MinifiedSpec {
    if (minified.tokenCount <= maxTokens) {
      return minified;
    }

    // Progressive optimization strategies
    let optimized = { ...minified };

    // 1. Remove descriptions
    optimized = this.removeDescriptions(optimized);
    if (this.estimateTokens(JSON.stringify(optimized)) <= maxTokens) {
      optimized.tokenCount = this.estimateTokens(JSON.stringify(optimized));
      return optimized;
    }

    // 2. Simplify schemas
    optimized = this.simplifySchemas(optimized);
    if (this.estimateTokens(JSON.stringify(optimized)) <= maxTokens) {
      optimized.tokenCount = this.estimateTokens(JSON.stringify(optimized));
      return optimized;
    }

    // 3. Reduce operations
    optimized = this.reduceOperations(optimized, maxTokens);
    optimized.tokenCount = this.estimateTokens(JSON.stringify(optimized));

    return optimized;
  }

  private static minifyPaths(paths: OpenAPIV3.PathsObject): any[] {
    const minifiedPaths: any[] = [];

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem) continue;

      const operations: MinifiedOperation[] = [];

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!this.isHttpMethod(method) || !operation) continue;

        const op = operation as OpenAPIV3.OperationObject;
        operations.push({
          method: method.toUpperCase(),
          operationId: op.operationId,
          summary: this.truncateDescription(op.summary),
          parameters: this.minifyParameters(op.parameters),
          requestBody: this.minifyRequestBody(op.requestBody),
          responses: this.minifyResponses(op.responses)
        });
      }

      if (operations.length > 0) {
        minifiedPaths.push({
          path,
          operations
        });
      }
    }

    return minifiedPaths;
  }

  private static minifyParameters(parameters?: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]): MinifiedParameter[] | undefined {
    if (!parameters) return undefined;

    return parameters.map(param => {
      if ('$ref' in param) {
        // For now, skip $ref parameters in minification
        return {
          name: 'ref_parameter',
          in: 'query',
          type: 'string'
        };
      }

      return {
        name: param.name,
        in: param.in as any,
        required: param.required,
        type: this.getParameterType(param.schema),
        description: this.truncateDescription(param.description, 50)
      };
    });
  }

  private static minifyRequestBody(requestBody?: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject): any {
    if (!requestBody || '$ref' in requestBody) return undefined;

    const content = requestBody.content;
    if (content && content['application/json']) {
      return {
        required: requestBody.required,
        schema: this.minifySchema(content['application/json'].schema)
      };
    }

    return undefined;
  }

  private static minifyResponses(responses: OpenAPIV3.ResponsesObject): Record<string, any> {
    const minified: Record<string, any> = {};

    for (const [code, response] of Object.entries(responses)) {
      if ('$ref' in response) continue;

      const responseObj = response as OpenAPIV3.ResponseObject;
      const content = responseObj.content;
      let schema;

      if (content && content['application/json']) {
        schema = this.minifySchema(content['application/json'].schema);
      }

      minified[code] = {
        description: this.truncateDescription(responseObj.description, 100),
        schema
      };
    }

    return minified;
  }

  private static minifySchemas(schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>): Record<string, MinifiedSchema> {
    const minified: Record<string, MinifiedSchema> = {};

    for (const [name, schema] of Object.entries(schemas)) {
      minified[name] = this.minifySchema(schema);
    }

    return minified;
  }

  private static minifySchema(schema?: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): MinifiedSchema {
    if (!schema) {
      return { type: 'any' };
    }

    if ('$ref' in schema) {
      return { type: 'ref', ref: schema.$ref };
    }

    const minified: MinifiedSchema = {
      type: schema.type || 'object'
    };

    if (schema.properties) {
      minified.properties = {};
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        minified.properties[propName] = this.minifySchema(propSchema);
      }
    }

    if ('items' in schema && schema.items) {
      minified.items = this.minifySchema(schema.items);
    }

    if (schema.required) {
      minified.required = schema.required;
    }

    if (schema.enum) {
      minified.enum = schema.enum;
    }

    if (schema.format) {
      minified.format = schema.format;
    }

    return minified;
  }

  private static getParameterType(schema?: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): string {
    if (!schema) return 'string';
    if ('$ref' in schema) return 'ref';
    return schema.type || 'string';
  }

  private static truncateDescription(description?: string, maxLength: number = 200): string | undefined {
    if (!description) return undefined;
    return description.length > maxLength 
      ? description.substring(0, maxLength) + '...'
      : description;
  }

  private static isHttpMethod(method: string): boolean {
    return ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method.toLowerCase());
  }

  private static estimateTokens(content: string): number {
    // Rough estimation: 1 token ≈ 4 characters for JSON
    return Math.ceil(content.length / 4);
  }

  private static filterPathsByOperations(paths: OpenAPIV3.PathsObject, operationIds: string[]): OpenAPIV3.PathsObject {
    const filtered: OpenAPIV3.PathsObject = {};

    for (const [path, pathItem] of Object.entries(paths)) {
      if (!pathItem) continue;

      const filteredPathItem: any = {};
      let hasRelevantOperation = false;

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!this.isHttpMethod(method) || !operation) continue;

        const op = operation as OpenAPIV3.OperationObject;
        if (op.operationId && operationIds.includes(op.operationId)) {
          filteredPathItem[method] = operation;
          hasRelevantOperation = true;
        }
      }

      if (hasRelevantOperation) {
        filtered[path] = filteredPathItem;
      }
    }

    return filtered;
  }

  private static extractRelevantSchemas(
    paths: OpenAPIV3.PathsObject, 
    allSchemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>
  ): Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> {
    // For now, return all schemas. In the future, we could analyze
    // which schemas are actually referenced in the filtered paths
    return allSchemas;
  }

  private static removeDescriptions(spec: MinifiedSpec): MinifiedSpec {
    const cleaned = JSON.parse(JSON.stringify(spec));
    
    // Remove all description fields recursively
    const removeDescriptionsRecursive = (obj: any) => {
      if (typeof obj === 'object' && obj !== null) {
        delete obj.description;
        for (const value of Object.values(obj)) {
          removeDescriptionsRecursive(value);
        }
      }
    };

    removeDescriptionsRecursive(cleaned);
    return cleaned;
  }

  private static simplifySchemas(spec: MinifiedSpec): MinifiedSpec {
    const simplified = { ...spec };
    
    // Simplify complex schemas to basic types
    for (const [name, schema] of Object.entries(simplified.schemas)) {
      if (schema.properties && Object.keys(schema.properties).length > 10) {
        // Reduce complex objects to key properties only
        const keyProps = Object.entries(schema.properties).slice(0, 5);
        simplified.schemas[name] = {
          type: 'object',
          properties: Object.fromEntries(keyProps)
        };
      }
    }

    return simplified;
  }

  private static reduceOperations(spec: MinifiedSpec, maxTokens: number): MinifiedSpec {
    const reduced = { ...spec };
    
    // Keep only the most important operations
    const sortedPaths = reduced.paths.sort((a, b) => {
      // Prioritize GET operations and those with operationIds
      const aScore = a.operations.reduce((score, op) => {
        return score + (op.method === 'GET' ? 2 : 1) + (op.operationId ? 1 : 0);
      }, 0);
      const bScore = b.operations.reduce((score, op) => {
        return score + (op.method === 'GET' ? 2 : 1) + (op.operationId ? 1 : 0);
      }, 0);
      return bScore - aScore;
    });

    // Keep operations until we approach the token limit
    reduced.paths = [];
    let currentTokens = this.estimateTokens(JSON.stringify({
      info: reduced.info,
      schemas: reduced.schemas
    }));

    for (const path of sortedPaths) {
      const pathTokens = this.estimateTokens(JSON.stringify(path));
      if (currentTokens + pathTokens <= maxTokens * 0.9) { // Leave 10% buffer
        reduced.paths.push(path);
        currentTokens += pathTokens;
      } else {
        break;
      }
    }

    return reduced;
  }
}