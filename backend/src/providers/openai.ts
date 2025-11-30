import OpenAI from 'openai';
import { BaseLLMProvider, DEFAULT_MODELS } from './base.js';
import type { LLMResponse } from '../types/index.js';

export class OpenAIProvider extends BaseLLMProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    super();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async execute(
    prompt: string,
    model: string = DEFAULT_MODELS.openai,
    options?: { maxTokens?: number; systemPrompt?: string }
  ): Promise<LLMResponse> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 2000,
    });

    const content = response.choices[0]?.message?.content ?? '';
    const usage = response.usage;

    return {
      content,
      tokensInput: usage?.prompt_tokens ?? 0,
      tokensOutput: usage?.completion_tokens ?? 0,
      model: response.model,
    };
  }
}

