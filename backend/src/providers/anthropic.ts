import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider, DEFAULT_MODELS } from './base.js';
import type { LLMResponse } from '../types/index.js';

export class AnthropicProvider extends BaseLLMProvider {
  name = 'anthropic';
  private client: Anthropic;

  constructor() {
    super();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  async execute(
    prompt: string,
    model: string = DEFAULT_MODELS.anthropic,
    options?: { maxTokens?: number; systemPrompt?: string }
  ): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 2000,
      system: options?.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text content from response
    let content = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      }
    }

    return {
      content,
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      model: response.model,
    };
  }
}

