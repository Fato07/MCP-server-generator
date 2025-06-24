import type { OpenAPIV3 } from 'openapi-types';

export interface MCPGenConfig {
  language: SupportedLanguage;
  template: string;
  plugins: string[];
  validation: ValidationConfig;
  deployment?: DeploymentConfig;
}

export interface ValidationConfig {
  strict?: boolean;
  mcp_version?: string;
}

export interface DeploymentConfig {
  target?: string;
  registry?: string;
}

export type SupportedLanguage = 'typescript' | 'python' | 'go';

export interface GenerationContext {
  projectName: string;
  config: MCPGenConfig;
  openApiSpec: OpenAPIV3.Document;
  outputPath: string;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: MCPParameter[];
  returnType: string;
  operation: OpenAPIV3.OperationObject;
  path: string;
  method: string;
}

export interface MCPParameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  schema: OpenAPIV3.SchemaObject;
}

export interface MCPResource {
  name: string;
  description: string;
  uri: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments: MCPParameter[];
}

export interface GeneratedProject {
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  packageInfo: PackageInfo;
  authentication?: AuthenticationConfig;
}

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
}

export interface AuthenticationConfig {
  type: 'none' | 'oauth' | 'apikey' | 'jwt';
  config: Record<string, unknown>;
}

export interface TemplateContext {
  project: GeneratedProject;
  config: GenerationContext;
  helpers: Record<string, Function>;
}

export interface GenerationOptions {
  input: string;
  language: SupportedLanguage;
  template: string;
  output: string;
  auth: AuthenticationConfig['type'];
  projectName: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
}

export interface PluginInterface {
  name: string;
  version: string;
  initialize: (context: GenerationContext) => Promise<void>;
  beforeGeneration?: (context: GenerationContext) => Promise<void>;
  afterGeneration?: (context: GenerationContext) => Promise<void>;
  registerTemplates?: () => Record<string, string>;
  registerHelpers?: () => Record<string, Function>;
}