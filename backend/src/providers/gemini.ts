import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLLMProvider, DEFAULT_MODELS, estimateTokens } from './base.js';
import type { LLMResponse } from '../types/index.js';

export class GeminiProvider extends BaseLLMProvider {
  name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor() {
    super();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async execute(
    prompt: string,
    model: string = DEFAULT_MODELS.gemini,
    options?: { maxTokens?: number; systemPrompt?: string }
  ): Promise<LLMResponse> {
    const genModel = this.client.getGenerativeModel({
      model,
      systemInstruction: options?.systemPrompt,
    });

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 2000,
      },
    });

    const response = result.response;
    const content = response.text();

    // Gemini doesn't always return token counts, so estimate if needed
    const usageMetadata = response.usageMetadata;
    const tokensInput = usageMetadata?.promptTokenCount ?? estimateTokens(prompt);
    const tokensOutput = usageMetadata?.candidatesTokenCount ?? estimateTokens(content);

    return {
      content,
      tokensInput,
      tokensOutput,
      model,
    };
  }
}

