import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Ollama } from 'ollama';
import { LLMConfig, LLMResponse, ModelCapabilities } from '../types/index.js';

export interface LLMProvider {
  generate(prompt: string, options?: GenerationOptions): Promise<LLMResponse>;
  getCapabilities(): ModelCapabilities;
  estimateCost(promptTokens: number, completionTokens: number): number;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  stop?: string[];
  streaming?: boolean;
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    });
    this.model = config.model || 'gpt-4';
  }

  async generate(prompt: string, options: GenerationOptions = {}): Promise<LLMResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        stop: options.stop
      });

      const choice = completion.choices[0];
      if (!choice || !choice.message.content) {
        throw new Error('No response generated');
      }

      const usage = completion.usage;
      if (!usage) {
        throw new Error('No usage information returned');
      }

      return {
        content: choice.message.content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          cost: this.estimateCost(usage.prompt_tokens, usage.completion_tokens)
        },
        model: this.model
      };

    } catch (error: any) {
      throw new Error(`OpenAI generation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  getCapabilities(): ModelCapabilities {
    const capabilities: Record<string, ModelCapabilities> = {
      'gpt-4': {
        maxTokens: 128000,
        supportsStreaming: true,
        costPerToken: { input: 0.00003, output: 0.00006 },
        languages: ['typescript', 'python', 'go', 'javascript'],
        strengths: ['reasoning', 'code-generation', 'documentation']
      },
      'gpt-4-turbo': {
        maxTokens: 128000,
        supportsStreaming: true,
        costPerToken: { input: 0.00001, output: 0.00003 },
        languages: ['typescript', 'python', 'go', 'javascript'],
        strengths: ['reasoning', 'code-generation', 'speed']
      },
      'gpt-3.5-turbo': {
        maxTokens: 16384,
        supportsStreaming: true,
        costPerToken: { input: 0.0000015, output: 0.000002 },
        languages: ['typescript', 'python', 'go', 'javascript'],
        strengths: ['speed', 'cost-efficiency']
      }
    };

    return capabilities[this.model] || capabilities['gpt-4'];
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    const caps = this.getCapabilities();
    return (promptTokens * caps.costPerToken.input) + 
           (completionTokens * caps.costPerToken.output);
  }
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.model = config.model || 'claude-3-sonnet-20240229';
  }

  async generate(prompt: string, options: GenerationOptions = {}): Promise<LLMResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Non-text response received');
      }

      return {
        content: content.text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          cost: this.estimateCost(response.usage.input_tokens, response.usage.output_tokens)
        },
        model: this.model
      };

    } catch (error: any) {
      throw new Error(`Anthropic generation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  getCapabilities(): ModelCapabilities {
    const capabilities: Record<string, ModelCapabilities> = {
      'claude-3-opus-20240229': {
        maxTokens: 200000,
        supportsStreaming: true,
        costPerToken: { input: 0.000015, output: 0.000075 },
        languages: ['typescript', 'python', 'go', 'javascript'],
        strengths: ['reasoning', 'code-generation', 'analysis']
      },
      'claude-3-sonnet-20240229': {
        maxTokens: 200000,
        supportsStreaming: true,
        costPerToken: { input: 0.000003, output: 0.000015 },
        languages: ['typescript', 'python', 'go', 'javascript'],
        strengths: ['balanced', 'cost-efficiency', 'speed']
      },
      'claude-3-haiku-20240307': {
        maxTokens: 200000,
        supportsStreaming: true,
        costPerToken: { input: 0.00000025, output: 0.00000125 },
        languages: ['typescript', 'python', 'go', 'javascript'],
        strengths: ['speed', 'cost-efficiency']
      }
    };

    return capabilities[this.model] || capabilities['claude-3-sonnet-20240229'];
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    const caps = this.getCapabilities();
    return (promptTokens * caps.costPerToken.input) + 
           (completionTokens * caps.costPerToken.output);
  }
}

export class OllamaProvider implements LLMProvider {
  private client: Ollama;
  private model: string;

  constructor(config: LLMConfig) {
    this.client = new Ollama({
      host: config.baseURL || 'http://localhost:11434'
    });
    this.model = config.model || 'codellama';
  }

  async generate(prompt: string, options: GenerationOptions = {}): Promise<LLMResponse> {
    try {
      const response = await this.client.generate({
        model: this.model,
        prompt,
        options: {
          num_predict: options.maxTokens,
          temperature: options.temperature,
          stop: options.stop
        }
      });

      // Ollama doesn't provide token counts, so we estimate
      const promptTokens = this.estimateTokens(prompt);
      const completionTokens = this.estimateTokens(response.response);

      return {
        content: response.response,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost: 0 // Local models are free
        },
        model: this.model
      };

    } catch (error: any) {
      throw new Error(`Ollama generation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  getCapabilities(): ModelCapabilities {
    const capabilities: Record<string, ModelCapabilities> = {
      'codellama': {
        maxTokens: 16384,
        supportsStreaming: true,
        costPerToken: { input: 0, output: 0 },
        languages: ['typescript', 'python', 'go', 'javascript', 'cpp', 'java'],
        strengths: ['code-generation', 'local-inference', 'privacy']
      },
      'llama3': {
        maxTokens: 8192,
        supportsStreaming: true,
        costPerToken: { input: 0, output: 0 },
        languages: ['typescript', 'python', 'go', 'javascript'],
        strengths: ['general-purpose', 'local-inference', 'privacy']
      },
      'mistral': {
        maxTokens: 8192,
        supportsStreaming: true,
        costPerToken: { input: 0, output: 0 },
        languages: ['typescript', 'python', 'go', 'javascript'],
        strengths: ['speed', 'efficiency', 'local-inference']
      }
    };

    return capabilities[this.model] || capabilities['codellama'];
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    return 0; // Local models are free
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

export class LLMProviderFactory {
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  static getRecommendedProvider(task: 'documentation' | 'code-generation' | 'validation'): Partial<LLMConfig> {
    switch (task) {
      case 'documentation':
        return {
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307' // Fast and cost-effective for docs
        };
      case 'code-generation':
        return {
          provider: 'openai',
          model: 'gpt-4' // Best reasoning for complex code
        };
      case 'validation':
        return {
          provider: 'ollama',
          model: 'codellama' // Local validation for privacy
        };
      default:
        return {
          provider: 'openai',
          model: 'gpt-4-turbo'
        };
    }
  }
}