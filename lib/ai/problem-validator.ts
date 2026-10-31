import { executeGroqStructuredQuery } from './groq-client';
import { fallbackValidateAndUnderstand } from './fallback-engine';
import {
  ProblemClassificationResult,
  ProblemSubmissionInput,
  ProblemUnderstanding,
  ProblemUnderstandingSchema,
  ProblemValidationResult,
  PROBLEM_CATEGORIES,
} from './types';

const VALIDATION_SYSTEM_PROMPT = `You are the lead AI validation and classification engine for Solvyn, an AI-powered real-world problem discovery and solution-sharing platform.

Your mission is to evaluate community, civic, public infrastructure, and real-world problems submitted by citizens and users, and transform unstructured complaints/reports into clean, structured problem intelligence.

EVALUATION RULES:
1. Is it a genuine real-world problem? (Civic issues, public services, transport, healthcare, education, environmental hazards, public software bugs, accessibility barriers, etc.)
2. Is it relevant to Solvyn? (Solvyn focuses on discoverable problems that engineers, communities, and governments can address).
3. Is it spam or meaningless content? (Flag random gibberish, crypto/casino spam, personal insults, or non-problem chatter as invalid/spam).
4. CRITICAL RULE: DO NOT reject a genuine problem merely because the description is short! For instance, "Streetlights on 80ft road not working" or "BMTC bus 500D is always 40 mins late" are genuine, valid real-world problems. If brevity lacks nuance, mark "is_valid": true, "needs_clarification": true, and provide a polite "clarification_question".
5. Assign exactly one primary category from:
   - Transportation
   - Healthcare
   - Education
   - Environment
   - Agriculture
   - Public Infrastructure
   - Accessibility
   - Finance
   - Technology
   - Community
   - Other
6. Extract clean, normalized attributes:
   - "normalized_title": Concise, professional title (e.g., "Improving BMTC Bus Tracking", "Koramangala Pothole Safety Hazard").
   - "problem_description": Clear, well-formed summary of the core issue.
   - "keywords": 3 to 6 high-value search keywords/tags.
   - "sub_problem": The specific operational or functional facet of the problem (e.g., "Live bus tracking", "Mobile UI/UX Navigation", "Nighttime Street Illumination").
   - "urgency": "low" | "medium" | "high" | "critical" (safety hazards or severe health impacts are high/critical).
   - "target_users": Array of affected groups (e.g. ["Daily commuters", "Pedestrians"]).
   - "reason": Clear rationale for why it was validated and classified as such.`;

/**
 * Validates and converts an unstructured problem report into structured data.
 * Adheres strictly to the required Solvyn schema and guarantees graceful deterministic fallback.
 */
export async function validateProblem(
  input: ProblemSubmissionInput
): Promise<ProblemValidationResult> {
  const userPrompt = JSON.stringify({
    submitted_title: input.title || null,
    submitted_description: input.description,
    submitted_category: input.submittedCategory || null,
    location: input.location || null,
  });

  try {
    const { data, model } = await executeGroqStructuredQuery<ProblemUnderstanding>({
      systemPrompt: VALIDATION_SYSTEM_PROMPT,
      userPrompt: `Validate and structure this problem report:\n${userPrompt}`,
      schema: ProblemUnderstandingSchema,
      temperature: 0.1,
    });

    return {
      ...data,
      confidence: data.is_valid ? 0.95 : 0.9,
      source: 'ai',
      model_used: model,
      processed_at: new Date().toISOString(),
    };
  } catch (error) {
    // Graceful fallback: Never crash the platform or silently fake AI responses
    const fallback = fallbackValidateAndUnderstand(input);
    return {
      ...fallback,
      reason: `[AI Fallback Active - ${(error as Error).message}] ${fallback.reason}`,
    };
  }
}

/**
 * Classifies a problem into category, sub-problem, urgency, and keywords.
 * Reusable helper for Member 2's backend.
 */
export async function classifyProblem(
  input: ProblemSubmissionInput
): Promise<ProblemClassificationResult> {
  const validationResult = await validateProblem(input);

  const normalizedCategory = (
    PROBLEM_CATEGORIES.includes(validationResult.category as any)
      ? validationResult.category
      : 'Other'
  ) as any;

  return {
    category: normalizedCategory,
    sub_problem: validationResult.sub_problem,
    keywords: validationResult.keywords,
    urgency: validationResult.urgency,
    confidence: validationResult.confidence,
    source: validationResult.source,
  };
}

