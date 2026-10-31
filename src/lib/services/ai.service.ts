import {
  validateProblem,
  classifyProblem,
  findRelatedProblems as aiFindRelatedProblems,
  generateStructuredProblem as aiGenerateStructuredProblem,
  recommendProblemsForUser as aiRecommendProblemsForUser,
  ProblemSubmissionInput,
  ExistingCluster,
  ProblemValidationResult,
  ClusterMatchingResult,
  StructuredProblemStatement,
  ProblemReport,
  UserDiscoveryProfile,
  ProblemRecommendationResult,
} from '@/lib/ai';

/**
 * Solvyn Unified AI Service
 *
 * Connects Member 3's high-performance AI modules
 * (validation, classification, clustering, aggregation, and discovery chatbot)
 * directly into Member 2's backend and API routes.
 */
export class AIService {
  /**
   * 1. Validate and understand citizen problem report
   */
  public static async validateAndClassifyProblem(
    originalText: string,
    suggestedCategory?: string,
    location?: string
  ): Promise<ProblemValidationResult> {
    const input: ProblemSubmissionInput = {
      description: originalText,
      submittedCategory: suggestedCategory,
      location,
    };
    return await validateProblem(input);
  }

  /**
   * 2. Quick classification helper
   */
  public static async classifyProblem(
    originalText: string,
    suggestedCategory?: string
  ) {
    const input: ProblemSubmissionInput = {
      description: originalText,
      submittedCategory: suggestedCategory,
    };
    return await classifyProblem(input);
  }

  /**
   * 3. Match report against candidate clusters from Supabase
   */
  public static async findRelatedProblems(
    input: {
      title?: string;
      description: string;
      submittedCategory?: string;
    },
    candidateClusters: ExistingCluster[]
  ): Promise<ClusterMatchingResult> {
    return await aiFindRelatedProblems(input, candidateClusters);
  }

  /**
   * 4. Synthesize multiple reports into a structured problem statement
   */
  public static async generateStructuredProblem(
    cluster: ExistingCluster,
    reports: ProblemReport[]
  ): Promise<StructuredProblemStatement> {
    return await aiGenerateStructuredProblem(cluster, reports);
  }

  /**
   * 5. Matchmaker recommendation assistant for problem discovery
   */
  public static async recommendProblems(
    profile: UserDiscoveryProfile,
    availableClusters: ExistingCluster[]
  ): Promise<ProblemRecommendationResult> {
    return await aiRecommendProblemsForUser(profile, availableClusters);
  }
}
