/**
 * Solvyn AI Engineering Module (Member 3)
 *
 * Core AI problem validation, understanding, classification,
 * clustering, structured problem generation, and discovery chatbot.
 *
 * Exposes reusable server-side AI functions for Member 2's backend.
 */

export * from './types';
export * from './config';
export * from './groq-client';
export * from './problem-validator';
export * from './problem-clustering';
export * from './structured-problem-generator';
export * from './discovery-chatbot';
export * from './fallback-engine';

// Explicit re-exports of core requested API functions for Member 2:
export { validateProblem, classifyProblem } from './problem-validator';
export { findRelatedProblems } from './problem-clustering';
export { generateStructuredProblem } from './structured-problem-generator';
export { recommendProblemsForUser } from './discovery-chatbot';

