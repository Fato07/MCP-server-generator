import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { MCPGenConfig } from '@mcpgen/core';

export class ConfigManager {
  private static readonly CONFIG_FILENAMES = [
    'mcpgen.config.json',
    'mcpgen.config.js',
    '.mcpgenrc',
    '.mcpgenrc.json'
  ];

  async loadConfig(configPath?: string): Promise<Partial<MCPGenConfig>> {
    let config: Partial<MCPGenConfig> = this.getDefaultConfig();

    // Load from specified config file
    if (configPath) {
      const customConfig = await this.loadConfigFromFile(configPath);
      config = { ...config, ...customConfig };
    } else {
      // Look for config files in current directory
      const foundConfig = await this.findAndLoadConfig(process.cwd());
      if (foundConfig) {
        config = { ...config, ...foundConfig };
      }
    }

    return config;
  }

  private getDefaultConfig(): Partial<MCPGenConfig> {
    return {
      language: 'typescript',
      template: 'basic',
      plugins: [],
      validation: {
        strict: true,
        mcp_version: '2025-03-26'
      }
    };
  }

  private async findAndLoadConfig(directory: string): Promise<Partial<MCPGenConfig> | null> {
    for (const filename of ConfigManager.CONFIG_FILENAMES) {
      const configPath = join(directory, filename);
      if (existsSync(configPath)) {
        return await this.loadConfigFromFile(configPath);
      }
    }

    return null;
  }

  private async loadConfigFromFile(configPath: string): Promise<Partial<MCPGenConfig>> {
    const fullPath = resolve(configPath);
    
    if (!existsSync(fullPath)) {
      throw new Error(`Config file not found: ${fullPath}`);
    }

    try {
      if (configPath.endsWith('.js')) {
        // Dynamic import for JS config files
        const module = await import(fullPath);
        return module.default || module;
      } else {
        // JSON config files
        const content = readFileSync(fullPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      throw new Error(`Failed to load config from ${fullPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  validateConfig(config: Partial<MCPGenConfig>): void {
    // Validate language
    if (config.language && !['typescript', 'python', 'go'].includes(config.language)) {
      throw new Error(`Invalid language in config: ${config.language}`);
    }

    // Validate plugins array
    if (config.plugins && !Array.isArray(config.plugins)) {
      throw new Error('Config plugins must be an array');
    }

    // Validate validation config
    if (config.validation) {
      if (typeof config.validation.strict !== 'boolean') {
        throw new Error('Config validation.strict must be a boolean');
      }
      
      if (config.validation.mcp_version && typeof config.validation.mcp_version !== 'string') {
        throw new Error('Config validation.mcp_version must be a string');
      }
    }

    // Validate deployment config
    if (config.deployment) {
      if (!config.deployment.target) {
        throw new Error('Config deployment.target is required when deployment config is specified');
      }
    }
  }

  mergeConfigs(base: Partial<MCPGenConfig>, override: Partial<MCPGenConfig>): Partial<MCPGenConfig> {
    return {
      ...base,
      ...override,
      validation: (base.validation || override.validation) ? {
        ...base.validation,
        ...override.validation
      } : undefined,
      deployment: (base.deployment || override.deployment) ? {
        ...base.deployment,
        ...override.deployment
      } : undefined,
      plugins: override.plugins || base.plugins || []
    };
  }
}