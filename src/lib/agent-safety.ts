import { generateText } from "ai";

import { getModel } from "@/lib/model-gateway";

/**
 * Agent pipeline configuration with safety guards.
 */
export interface AgentConfig {
  maxRetries: number;
  tokenBudget: number;      // max tokens per project
  timeoutMs: number;
  backoffMs: number;        // initial backoff delay
}

const DEFAULT_CONFIG: AgentConfig = {
  maxRetries: 3,
  tokenBudget: 100_000,
  timeoutMs: 60_000,
  backoffMs: 1000,
};

/**
 * Retry with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<AgentConfig> = {},
): Promise<T> {
  const { maxRetries, backoffMs } = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on auth/validation errors.
      if (lastError.message.includes("401") || lastError.message.includes("400")) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Circuit breaker — stops retrying after repeated failures.
 */
const circuitState = new Map<string, { failures: number; lastFailure: number; isOpen: boolean }>();
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60_000;

export function checkCircuit(agentId: string): void {
  const state = circuitState.get(agentId);
  if (!state) return;

  if (state.isOpen) {
    const elapsed = Date.now() - state.lastFailure;
    if (elapsed > CIRCUIT_RESET_MS) {
      // Reset circuit
      circuitState.set(agentId, { failures: 0, lastFailure: 0, isOpen: false });
    } else {
      throw new Error(`Circuit breaker open for ${agentId}. Retry after ${Math.ceil((CIRCUIT_RESET_MS - elapsed) / 1000)}s`);
    }
  }
}

export function recordFailure(agentId: string): void {
  const state = circuitState.get(agentId) || { failures: 0, lastFailure: 0, isOpen: false };
  state.failures++;
  state.lastFailure = Date.now();
  if (state.failures >= CIRCUIT_THRESHOLD) {
    state.isOpen = true;
  }
  circuitState.set(agentId, state);
}

export function recordSuccess(agentId: string): void {
  circuitState.set(agentId, { failures: 0, lastFailure: 0, isOpen: false });
}

/**
 * Token budget tracker — prevents runaway costs.
 *
 * NOTE: this state (along with the circuit breaker above and the chat route's
 * rate limiter) is in-memory and therefore per-instance. On serverless /
 * multi-instance deployments it should be backed by a shared store such as
 * Redis/Upstash so limits and budgets apply globally.
 */
const tokenUsage = new Map<string, { used: number; budget: number }>();

export function checkTokenBudget(projectId: string, estimatedTokens: number, budget: number = DEFAULT_CONFIG.tokenBudget): void {
  const usage = tokenUsage.get(projectId) || { used: 0, budget };
  if (usage.used + estimatedTokens > usage.budget) {
    throw new Error(`Token budget exceeded for project ${projectId}. Used: ${usage.used}/${usage.budget}`);
  }
}

export function recordTokenUsage(projectId: string, tokens: number): void {
  const usage = tokenUsage.get(projectId) || { used: 0, budget: DEFAULT_CONFIG.tokenBudget };
  usage.used += tokens;
  tokenUsage.set(projectId, usage);
}

export function getTokenUsage(projectId: string): { used: number; budget: number } {
  return tokenUsage.get(projectId) || { used: 0, budget: DEFAULT_CONFIG.tokenBudget };
}

/**
 * Generate with full safety: retry + circuit breaker + token budget + timeout.
 */
export async function safeGenerate(params: {
  model: string;
  system: string;
  prompt: string;
  projectId?: string;
  agentId?: string;
  config?: Partial<AgentConfig>;
}): Promise<{ text: string; tokens: number }> {
  const {
    model,
    system,
    prompt,
    projectId = "global",
    agentId = "default",
    config = {},
  } = params;

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Circuit breaker check
  checkCircuit(agentId);

  // Token budget check (estimate ~4 chars per token)
  const estimatedTokens = Math.ceil(prompt.length / 4) + 2000; // prompt + expected output
  checkTokenBudget(projectId, estimatedTokens, mergedConfig.tokenBudget);

  // Generate with retry
  const result = await withRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), mergedConfig.timeoutMs);

    try {
      const res = await generateText({
        model: getModel(model),
        system,
        prompt,
        // Forward the signal so the timeout actually cancels a hung request.
        abortSignal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(timeout);
    }
  }, mergedConfig);

  // Record success
  recordSuccess(agentId);

  // Track token usage
  const totalTokens = result.usage?.totalTokens ?? 0;
  recordTokenUsage(projectId, totalTokens);

  return { text: result.text, tokens: totalTokens };
}
