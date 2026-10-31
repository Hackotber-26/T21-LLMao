import dotenv from 'dotenv';

// Load .env or .env.local if available in non-production environments
if (typeof window === 'undefined') {
  dotenv.config({ path: '.env.local' });
  dotenv.config();
}

/**
 * Server-only guard: Ensure AI configuration is never imported on client side
 */
if (typeof window !== 'undefined') {
  throw new Error('AI configuration and Groq service must NEVER be imported in client-side code.');
}

export interface AIConfig {
  groqApiKey?: string;
  groqModel: string;
  timeoutMs: number;
  maxRetries: number;
  clusteringConfidenceThreshold: number;
  reviewConfidenceThreshold: number;
  isAiEnabled: boolean;
}

export const getAIConfig = (): AIConfig => {
  const groqApiKey = process.env.GROQ_API_KEY?.trim();
  // Configurable model: default to gpt-oss-120b as specified in Solvyn specification
  const groqModel = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';
  const timeoutMs = parseInt(process.env.GROQ_TIMEOUT_MS || '25000', 10);
  const maxRetries = parseInt(process.env.GROQ_MAX_RETRIES || '3', 10);
  const clusteringConfidenceThreshold = parseFloat(
    process.env.CLUSTER_CONFIDENCE_THRESHOLD || '0.75'
  );
  const reviewConfidenceThreshold = parseFloat(
    process.env.CLUSTER_REVIEW_THRESHOLD || '0.50'
  );

  return {
    groqApiKey,
    groqModel,
    timeoutMs,
    maxRetries,
    clusteringConfidenceThreshold,
    reviewConfidenceThreshold,
    isAiEnabled: Boolean(groqApiKey && groqApiKey.length > 5),
  };
};

export const config = getAIConfig();
