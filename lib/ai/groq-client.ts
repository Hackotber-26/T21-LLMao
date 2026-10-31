import Groq from 'groq-sdk';
import { ZodSchema } from 'zod';
import { getAIConfig } from './config';

export class AIExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_JSON' | 'API_ERROR' | 'MISSING_API_KEY',
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AIExecutionError';
  }
}

let groqInstance: Groq | null = null;

/**
 * Returns a singleton Groq client instance safely on the server side
 */
export function getGroqClient(): Groq | null {
  if (typeof window !== 'undefined') {
    throw new Error('Groq client cannot be initialized in client-side code.');
  }

  const { groqApiKey } = getAIConfig();
  if (!groqApiKey) {
    return null;
  }

  if (!groqInstance) {
    groqInstance = new Groq({
      apiKey: groqApiKey,
    });
  }

  return groqInstance;
}

/**
 * Sleep helper for retry exponential backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface GroqStructuredRequestOptions<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: ZodSchema<T, any, any>;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Executes a structured Groq completion with automatic retries, rate-limit backoff,
 * timeout handling, and strict Zod validation.
 */
export async function executeGroqStructuredQuery<T>({
  systemPrompt,
  userPrompt,
  schema,
  temperature = 0.1,
  maxTokens = 2000,
}: GroqStructuredRequestOptions<T>): Promise<{ data: T; model: string }> {
  const config = getAIConfig();
  const client = getGroqClient();

  if (!client || !config.groqApiKey) {
    throw new AIExecutionError(
      'GROQ_API_KEY is not set or invalid in environment.',
      'MISSING_API_KEY'
    );
  }

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await client.chat.completions.create(
        {
          model: config.groqModel,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested schema. Do not enclose in markdown blocks if possible, or use clean json. No commentary outside JSON.`,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature,
          max_tokens: maxTokens,
        },
        {
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutHandle);

      const rawContent = response.choices?.[0]?.message?.content?.trim();
      if (!rawContent) {
        throw new AIExecutionError(
          'Received empty response from Groq model.',
          'INVALID_JSON'
        );
      }

      // Clean any accidental markdown code fence wrapping
      const cleaned = rawContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        throw new AIExecutionError(
          `Failed to parse JSON response: ${(parseErr as Error).message}`,
          'INVALID_JSON',
          parseErr
        );
      }

      // Validate against the Zod schema
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        const errorDetails = validation.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join(', ');
        throw new AIExecutionError(
          `Groq output failed schema validation: ${errorDetails}`,
          'INVALID_JSON',
          validation.error
        );
      }

      return {
        data: validation.data,
        model: response.model || config.groqModel,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutHandle);
      lastError = err;

      const isAbort = (err as Error)?.name === 'AbortError';
      const isRateLimit =
        (err as { status?: number })?.status === 429 ||
        ((err as Error)?.message && /rate limit/i.test((err as Error).message));
      const isServerDown =
        (err as { status?: number })?.status === 503 ||
        (err as { status?: number })?.status === 500;

      if (isAbort) {
        if (attempt === config.maxRetries) {
          throw new AIExecutionError(
            `Groq request timed out after ${config.timeoutMs}ms (Attempt ${attempt}/${config.maxRetries}).`,
            'TIMEOUT',
            err
          );
        }
      } else if (isRateLimit || isServerDown) {
        if (attempt === config.maxRetries) {
          throw new AIExecutionError(
            `Groq rate limit or server error exceeded maximum retries.`,
            isRateLimit ? 'RATE_LIMIT' : 'API_ERROR',
            err
          );
        }
        // Exponential backoff with jitter
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
        await sleep(backoffMs);
        continue;
      } else if (err instanceof AIExecutionError && err.code === 'INVALID_JSON') {
        // Retry if JSON validation failed
        if (attempt === config.maxRetries) {
          throw err;
        }
        await sleep(500);
        continue;
      } else {
        // Non-retriable error
        throw new AIExecutionError(
          `Groq API execution failed: ${(err as Error).message}`,
          'API_ERROR',
          err
        );
      }
    }
  }

  throw new AIExecutionError(
    `Groq execution failed after ${config.maxRetries} attempts.`,
    'API_ERROR',
    lastError
  );
}
