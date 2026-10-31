import { AIProblemClassification, AIMatchCandidate, AIProblemMatchingResult } from '@/types/api.types';
import Groq from 'groq-sdk';

/**
 * AI Service Interface for Solvyn
 * 
 * Owned primarily by Member 3 (AI Engineer).
 * This service provides the standard contract methods:
 * 1. validateAndClassifyProblem(originalText)
 * 2. findRelatedProblems(classification, candidates)
 * 3. generateStructuredProblem(reports)
 * 
 * When GROQ_API_KEY is configured, it executes via Groq's high-speed inference.
 * Safe fallback handling is provided when the AI service is unreachable or credentials are unconfigured.
 */
export class AIService {
  private static groq: Groq | null = null;

  private static getGroqClient(): Groq | null {
    if (!this.groq && process.env.GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return this.groq;
  }

  /**
   * Validates if the user input describes a real problem and classifies it.
   */
  public static async validateAndClassifyProblem(
    originalText: string,
    suggestedCategory?: string
  ): Promise<AIProblemClassification> {
    const groq = this.getGroqClient();
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!groq) {
      // Graceful fallback for when AI credentials are not yet populated during setup
      const trimmed = originalText.trim();
      const firstLine = trimmed.split('\n')[0].slice(0, 70);
      return {
        is_valid: true,
        category: suggestedCategory || 'General',
        normalized_title: firstLine || 'Reported Issue',
        problem_description: originalText,
        keywords: [suggestedCategory || 'General', 'Community'],
        sub_problem: 'General Issue',
        urgency: 'medium',
        target_users: ['General Public'],
      };
    }

    const systemPrompt = `You are Solvyn's AI Problem Classifier.
Analyze the user's report about a real-world difficulty.
Determine if it is a valid problem statement (meaningful, actionable difficulty or feedback).
Respond with ONLY valid JSON with this exact schema:
{
  "is_valid": boolean,
  "category": string,
  "normalized_title": string,
  "problem_description": string,
  "keywords": string[],
  "sub_problem": string,
  "urgency": "low" | "medium" | "high" | "critical",
  "target_users": string[],
  "rejection_reason": string (optional, if is_valid is false)
}`;

    try {
      const response = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Report: "${originalText}"\nSuggested Category: "${suggestedCategory || 'None'}"` },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty AI classification response');
      }

      return JSON.parse(content) as AIProblemClassification;
    } catch (error) {
      console.error('[AIService.validateAndClassifyProblem] Error:', error);
      // Safe fallback ensuring uninterrupted flow if Groq is temporarily unavailable
      return {
        is_valid: true,
        category: suggestedCategory || 'General',
        normalized_title: originalText.slice(0, 60),
        problem_description: originalText,
        keywords: [suggestedCategory || 'General'],
        sub_problem: 'Reported Issue',
        urgency: 'medium',
        target_users: ['Affected Users'],
      };
    }
  }

  /**
   * Matches a new classification against existing candidate problem clusters.
   */
  public static async findRelatedProblems(
    classification: AIProblemClassification,
    candidates: AIMatchCandidate[]
  ): Promise<AIProblemMatchingResult> {
    if (!candidates || candidates.length === 0) {
      return {
        match_found: false,
        matched_problem_id: null,
        confidence: 0,
        sub_problem: classification.sub_problem,
        reason: 'No existing candidates available in cluster pool',
      };
    }

    const groq = this.getGroqClient();
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!groq) {
      return {
        match_found: false,
        matched_problem_id: null,
        confidence: 0,
        sub_problem: classification.sub_problem,
        reason: 'Groq AI key not configured; created standalone problem cluster',
      };
    }

    const systemPrompt = `You are Solvyn's AI Cluster Matcher.
Compare a new problem report against candidate problem clusters.
If the report describes the SAME underlying core problem or system, identify it as a match (even if it's a specific sub-problem of that domain).
Return ONLY a valid JSON object matching this schema:
{
  "match_found": boolean,
  "matched_problem_id": string (or null if match_found is false),
  "confidence": number (between 0.0 and 1.0),
  "sub_problem": string,
  "reason": string
}`;

    try {
      const prompt = `New Problem:
Title: ${classification.normalized_title}
Description: ${classification.problem_description}
Category: ${classification.category}
Keywords: ${classification.keywords.join(', ')}

Candidate Clusters:
${JSON.stringify(candidates, null, 2)}`;

      const response = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty AI matching response');
      }

      const parsed = JSON.parse(content) as AIProblemMatchingResult;
      // High confidence threshold (0.75) for clustering
      if (parsed.match_found && parsed.confidence >= 0.75 && parsed.matched_problem_id) {
        return parsed;
      }

      return {
        match_found: false,
        matched_problem_id: null,
        confidence: parsed.confidence || 0,
        sub_problem: classification.sub_problem,
        reason: parsed.reason || 'Confidence threshold not met',
      };
    } catch (error) {
      console.error('[AIService.findRelatedProblems] Error:', error);
      return {
        match_found: false,
        matched_problem_id: null,
        confidence: 0,
        sub_problem: classification.sub_problem,
        reason: 'Error during matching calculation',
      };
    }
  }
}
