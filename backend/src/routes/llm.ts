import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getCreditBalance, spendCredits, recordProviderUsage } from '../db/supabase.js';
import {
  getProvider,
  isValidProvider,
  isValidModel,
  getDefaultModel,
  estimateTokens,
  estimateCost,
  calculateCost,
  AVAILABLE_MODELS,
} from '../providers/index.js';
import type { EstimateRequest, EstimateResponse, ExecuteRequest, ExecuteResponse } from '../types/index.js';

const router = Router();

// GET /llm/models - Get available models per provider
router.get('/models', (_req, res) => {
  res.json({
    providers: AVAILABLE_MODELS,
  });
});

// POST /llm/estimate - Estimate credit cost for a prompt
router.post('/estimate', authMiddleware, async (req, res, next) => {
  try {
    const { provider, model, prompt, max_tokens } = req.body as EstimateRequest;

    // Validate provider
    if (!provider || !isValidProvider(provider)) {
      throw new AppError(400, 'INVALID_PROVIDER', 'Invalid provider. Use: openai, anthropic, or gemini');
    }

    // Get model (use default if not specified)
    const selectedModel = model || getDefaultModel(provider);

    // Validate model if specified
    if (model && !isValidModel(provider, model)) {
      throw new AppError(400, 'INVALID_MODEL', `Invalid model for ${provider}. Available: ${AVAILABLE_MODELS[provider].join(', ')}`);
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new AppError(400, 'INVALID_PROMPT', 'Prompt is required');
    }

    // Estimate tokens and cost
    const inputTokens = estimateTokens(prompt);
    const maxOutputTokens = max_tokens ?? 1000;
    const estimatedCredits = estimateCost(selectedModel, inputTokens, maxOutputTokens);

    const response: EstimateResponse = {
      estimated_credits: estimatedCredits,
      provider,
      model: selectedModel,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /llm/execute - Execute prompt and spend credits
router.post('/execute', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { provider, model, prompt, max_tokens, system_prompt } = req.body as ExecuteRequest;

    // Validate provider
    if (!provider || !isValidProvider(provider)) {
      throw new AppError(400, 'INVALID_PROVIDER', 'Invalid provider. Use: openai, anthropic, or gemini');
    }

    // Get model (use default if not specified)
    const selectedModel = model || getDefaultModel(provider);

    // Validate model if specified
    if (model && !isValidModel(provider, model)) {
      throw new AppError(400, 'INVALID_MODEL', `Invalid model for ${provider}. Available: ${AVAILABLE_MODELS[provider].join(', ')}`);
    }

    if (!prompt || typeof prompt !== 'string') {
      throw new AppError(400, 'INVALID_PROMPT', 'Prompt is required');
    }

    // Estimate cost first
    const inputTokens = estimateTokens(prompt);
    const maxOutputTokens = max_tokens ?? 1000;
    const estimatedCredits = estimateCost(selectedModel, inputTokens, maxOutputTokens);

    // Check balance
    const balance = await getCreditBalance(userId);
    if (balance < estimatedCredits) {
      throw new AppError(402, 'INSUFFICIENT_CREDITS', `Insufficient credits. Need ${estimatedCredits}, have ${balance}`);
    }

    // Execute LLM call
    const llmProvider = getProvider(provider);
    const llmResponse = await llmProvider.execute(prompt, selectedModel, {
      maxTokens: max_tokens,
      systemPrompt: system_prompt,
    });

    // Calculate actual cost based on real token usage
    const actualCredits = calculateCost(selectedModel, llmResponse.tokensInput, llmResponse.tokensOutput);

    // Deduct credits
    const { success, newBalance } = await spendCredits(
      userId,
      actualCredits,
      `${provider}/${selectedModel}: ${llmResponse.tokensInput}+${llmResponse.tokensOutput} tokens`
    );

    if (!success) {
      throw new AppError(402, 'INSUFFICIENT_CREDITS', 'Failed to deduct credits');
    }

    // Record usage for analytics
    await recordProviderUsage(
      userId,
      provider,
      selectedModel,
      actualCredits,
      llmResponse.tokensInput,
      llmResponse.tokensOutput
    );

    const response: ExecuteResponse = {
      response: llmResponse.content,
      credits_spent: actualCredits,
      tokens_input: llmResponse.tokensInput,
      tokens_output: llmResponse.tokensOutput,
      provider,
      model: llmResponse.model,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;

