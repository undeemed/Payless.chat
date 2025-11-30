import type { LLMProvider } from '../types/index.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GeminiProvider } from './gemini.js';
import { AVAILABLE_MODELS, DEFAULT_MODELS } from './base.js';

export { AVAILABLE_MODELS, DEFAULT_MODELS };
export { calculateCost, estimateCost, estimateTokens, COST_PER_1K_TOKENS } from './base.js';

// Lazy-initialized provider instances
const providers: Map<string, LLMProvider> = new Map();

export function getProvider(name: 'openai' | 'anthropic' | 'gemini'): LLMProvider {
  // Return cached provider if available
  const cached = providers.get(name);
  if (cached) return cached;

  // Create new provider instance
  let provider: LLMProvider;

  switch (name) {
    case 'openai':
      provider = new OpenAIProvider();
      break;
    case 'anthropic':
      provider = new AnthropicProvider();
      break;
    case 'gemini':
      provider = new GeminiProvider();
      break;
    default:
      throw new Error(`Unknown provider: ${name}`);
  }

  providers.set(name, provider);
  return provider;
}

export function isValidProvider(name: string): name is 'openai' | 'anthropic' | 'gemini' {
  return ['openai', 'anthropic', 'gemini'].includes(name);
}

export function isValidModel(provider: string, model: string): boolean {
  const models = AVAILABLE_MODELS[provider];
  return models?.includes(model) ?? false;
}

export function getDefaultModel(provider: string): string {
  return DEFAULT_MODELS[provider] ?? 'gpt-4o-mini';
}

