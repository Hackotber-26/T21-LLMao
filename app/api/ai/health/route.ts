import { NextResponse } from 'next/server';
import { getAIConfig } from '@/lib/ai/config';
import { getGroqClient } from '@/lib/ai/groq-client';

export async function GET() {
  const config = getAIConfig();
  const hasClient = Boolean(getGroqClient());

  return NextResponse.json({
    status: 'healthy',
    service: 'Solvyn AI Engine (Member 3)',
    timestamp: new Date().toISOString(),
    config: {
      groq_model: config.groqModel,
      is_ai_enabled: config.isAiEnabled,
      has_groq_api_key: Boolean(config.groqApiKey),
      timeout_ms: config.timeoutMs,
      max_retries: config.maxRetries,
      clustering_threshold: config.clusteringConfidenceThreshold,
      review_threshold: config.reviewConfidenceThreshold,
    },
    capabilities: [
      'Problem Validation & Understanding',
      'Semantic & Heuristic Problem Clustering',
      'Sub-problem Granular Grouping',
      'Structured Problem Synthesis with Exact Database Metrics',
      'Personalized Discovery Chatbot Grounded in Supabase Records',
      'Zero-hallucination Deterministic Fallback Engine',
    ],
    mode: config.isAiEnabled ? 'Groq AI Live' : 'Deterministic Fallback Active',
  });
}
