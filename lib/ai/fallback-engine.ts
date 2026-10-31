import {
  ClusterMatchingResult,
  ExistingCluster,
  IdentifiedSubProblemArea,
  ProblemCategory,
  ProblemClassificationResult,
  ProblemReport,
  ProblemSubmissionInput,
  ProblemUrgency,
  ProblemValidationResult,
  RecommendedProblem,
  StructuredProblemStatement,
  UserDiscoveryProfile,
  PROBLEM_CATEGORIES,
} from './types';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to',
  'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'we',
  'i', 'you', 'he', 'she', 'it', 'they', 'our', 'my', 'their', 'app', 'apps', 'needs', 'need',
  'have', 'has', 'had', 'having', 'get', 'gets', 'got', 'cannot', 'cant', 'also', 'many',
]);

const CATEGORY_KEYWORDS: Record<ProblemCategory, string[]> = {
  Transportation: ['bus', 'bmtc', 'metro', 'train', 'traffic', 'commute', 'transit', 'vehicle', 'route', 'tracking', 'signal', 'auto', 'fare'],
  Healthcare: ['hospital', 'doctor', 'clinic', 'medicine', 'phc', 'patient', 'insulin', 'ambulance', 'health', 'disease', 'medical', 'prescription'],
  Education: ['school', 'college', 'teacher', 'student', 'classroom', 'exam', 'tuition', 'syllabus', 'education', 'books', 'university'],
  Environment: ['garbage', 'pollution', 'lake', 'waste', 'smoke', 'toxic', 'river', 'plastic', 'burning', 'sewage', 'tree', 'cleanliness', 'odor'],
  Agriculture: ['crop', 'farmer', 'soil', 'irrigation', 'fertilizer', 'harvest', 'pest', 'farming', 'seeds', 'mandi', 'yield'],
  'Public Infrastructure': ['pothole', 'streetlights', 'road', 'drainage', 'sidewalk', 'bridge', 'pipeline', 'water supply', 'electricity', 'power cut'],
  Accessibility: ['wheelchair', 'ramp', 'braille', 'blind', 'disability', 'handicap', 'elderly', 'elevator', 'accessible', 'screen reader'],
  Finance: ['bank', 'atm', 'loan', 'payment', 'upi', 'fraud', 'tax', 'interest', 'finances', 'subsidy'],
  Technology: ['app', 'software', 'website', 'bug', 'crash', 'ui', 'interface', 'ux', 'server', 'login', 'network', 'digital'],
  Community: ['park', 'safety', 'noise', 'stray', 'dogs', 'theft', 'harassment', 'community', 'playground', 'lighting', 'neighbor'],
  Other: ['general', 'miscellaneous', 'other'],
};

/**
 * Tokenize and extract clean keywords
 */
export function extractKeywordsFromText(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Frequency count to take top distinctive keywords
  const counts = new Map<string, number>();
  for (const w of words) {
    counts.set(w, (counts.get(w) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 8);
}

/**
 * Check if text has signs of spam or gibberish
 */
function isSpamText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 5) return true;

  // Repetition check: "aaaaaa", "asdfasdfasdf"
  if (/(.)\1{5,}/.test(trimmed)) return true;

  // Spam promotion patterns
  if (/https?:\/\/[^\s]+/.test(trimmed) && /(buy|free|crypto|casino|bet|cash|discount)/i.test(trimmed)) {
    return true;
  }

  // Pure consonant or pure digit mash
  const alphaOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (alphaOnly.length > 8 && !/[aeiouy]/i.test(alphaOnly)) {
    return true;
  }

  return false;
}

/**
 * Infer category from keyword hits
 */
export function inferCategoryFromText(text: string): ProblemCategory {
  const lower = text.toLowerCase();
  let bestCategory: ProblemCategory = 'Other';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ProblemCategory, string[]][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/**
 * Infer urgency from keyword cues
 */
export function inferUrgencyFromText(text: string): ProblemUrgency {
  const lower = text.toLowerCase();
  if (/(fatal|death|danger|accident|toxic|poison|severe hazard|life-threatening)/i.test(lower)) {
    return 'critical';
  }
  if (/(urgent|unsafe|overflow|risk|broken|critical|emergency|immediately)/i.test(lower)) {
    return 'high';
  }
  if (/(slow|delay|confusing|interface|glitch|annoying|difficult)/i.test(lower)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Infer target users
 */
function inferTargetUsers(category: ProblemCategory, text: string): string[] {
  const lower = text.toLowerCase();
  if (category === 'Transportation' || lower.includes('commute') || lower.includes('bus')) {
    return ['Daily commuters', 'Public transit riders'];
  }
  if (category === 'Healthcare') {
    return ['Patients', 'Healthcare workers', 'Local residents'];
  }
  if (category === 'Education') {
    return ['Students', 'Teachers', 'Parents'];
  }
  if (category === 'Environment' || category === 'Public Infrastructure') {
    return ['Local residents', 'Pedestrians', 'Community members'];
  }
  if (category === 'Accessibility') {
    return ['Persons with disabilities', 'Elderly citizens'];
  }
  return ['General public', 'Local community members'];
}

/**
 * Deterministic fallback validation & understanding
 */
export function fallbackValidateAndUnderstand(input: ProblemSubmissionInput): ProblemValidationResult {
  const combinedText = `${input.title || ''} ${input.description}`.trim();
  const spam = isSpamText(combinedText);
  const keywords = extractKeywordsFromText(combinedText);

  // Even short problems (e.g. "Potholes on 80ft road") are valid real-world issues
  const isValid = !spam && combinedText.length >= 6;
  const category = (input.submittedCategory as ProblemCategory) && PROBLEM_CATEGORIES.includes(input.submittedCategory as ProblemCategory)
    ? (input.submittedCategory as ProblemCategory)
    : inferCategoryFromText(combinedText);

  const urgency = inferUrgencyFromText(combinedText);
  const targetUsers = inferTargetUsers(category, combinedText);

  // Sub-problem extraction
  let subProblem = 'General Issue';
  const lower = combinedText.toLowerCase();
  if (lower.includes('interface') || lower.includes('ui') || lower.includes('ux') || lower.includes('navigation') || lower.includes('confusing')) {
    subProblem = 'UI/UX & Usability';
  } else if (lower.includes('tracking') || lower.includes('live') || lower.includes('real time') || lower.includes('gps')) {
    subProblem = 'Real-time Tracking & Visibility';
  } else if (lower.includes('delay') || lower.includes('schedule') || lower.includes('frequency') || lower.includes('late')) {
    subProblem = 'Scheduling & Timeliness';
  } else if (lower.includes('clean') || lower.includes('smell') || lower.includes('dirty') || lower.includes('waste')) {
    subProblem = 'Sanitation & Cleanliness';
  } else if (keywords.length > 0) {
    subProblem = keywords.slice(0, 2).map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(' ');
  }

  // Normalized title
  let normalizedTitle = input.title?.trim();
  if (!normalizedTitle || normalizedTitle.length < 5) {
    const preview = input.description.trim().slice(0, 40);
    normalizedTitle = `Addressing ${subProblem}: ${preview}...`;
  }

  const needsClarification = combinedText.length < 15 && isValid;
  const clarificationQuestion = needsClarification
    ? 'Could you share the specific location, frequency, or impact of this issue?'
    : null;

  return {
    is_valid: isValid,
    category,
    normalized_title: normalizedTitle,
    problem_description: input.description.trim(),
    keywords: keywords.length > 0 ? keywords : ['community', 'issue'],
    sub_problem: subProblem,
    urgency,
    target_users: targetUsers,
    reason: isValid
      ? '[Deterministic Fallback Engine] Identified genuine real-world issue through heuristic pattern matching.'
      : spam
      ? '[Deterministic Fallback Engine] Submission flagged as invalid, spam, or lacking meaningful content.'
      : '[Deterministic Fallback Engine] Content description too sparse to identify a real-world problem.',
    is_spam: spam,
    needs_clarification: needsClarification,
    clarification_question: clarificationQuestion,
    confidence: isValid ? 0.65 : 0.85,
    source: 'fallback',
    processed_at: new Date().toISOString(),
  };
}

/**
 * Deterministic fallback related problem / cluster matching
 */
export function fallbackFindRelatedProblems(
  newProblem: ProblemSubmissionInput,
  candidateClusters: ExistingCluster[]
): ClusterMatchingResult {
  const combinedText = `${newProblem.title || ''} ${newProblem.description}`.toLowerCase();
  const inputKeywords = new Set(extractKeywordsFromText(combinedText));
  const inputCategory =
    newProblem.submittedCategory && PROBLEM_CATEGORIES.includes(newProblem.submittedCategory as any)
      ? (newProblem.submittedCategory as ProblemCategory)
      : inferCategoryFromText(combinedText);

  let bestCluster: ExistingCluster | null = null;
  let bestScore = 0;
  const similarityScores: Record<string, number> = {};

  for (const cluster of candidateClusters) {
    let score = 0;

    // 1. Category alignment (25% weight)
    const categoryMatches = cluster.category.toLowerCase() === inputCategory.toLowerCase();
    if (categoryMatches) {
      score += 0.25;
    }

    // 2. Cluster keywords set
    const clusterKeywords = new Set([
      ...extractKeywordsFromText(cluster.title.toLowerCase()),
      ...extractKeywordsFromText(cluster.description.toLowerCase()),
      ...(cluster.keywords || []).map((k) => k.toLowerCase()),
      ...(cluster.sub_problems || []).flatMap((sp) => extractKeywordsFromText(sp.toLowerCase())),
    ]);

    // 3. Entity & brand overlap boost (e.g. "bmtc", "metro", "bellandur", "indiranagar", "mandya")
    let hasDirectEntityMatch = false;
    for (const kw of inputKeywords) {
      if (clusterKeywords.has(kw) && (kw.length >= 4 || kw === 'bus' || kw === 'phc')) {
        hasDirectEntityMatch = true;
        break;
      }
    }
    if (hasDirectEntityMatch) {
      score += 0.35;
    }

    // 4. Keyword containment/recall relative to the input report (40% weight)
    let overlap = 0;
    for (const kw of inputKeywords) {
      if (clusterKeywords.has(kw)) overlap += 1;
    }

    const keywordRecall = inputKeywords.size > 0 ? overlap / inputKeywords.size : 0;
    score += keywordRecall * 0.40;

    // Normalize between 0 and 1
    const finalScore = Math.min(1.0, Math.round(score * 100) / 100);
    similarityScores[cluster.id] = finalScore;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestCluster = cluster;
    }
  }

  // Derive sub-problem
  let subProblem = 'General Sub-Problem';
  if (
    combinedText.includes('interface') ||
    combinedText.includes('ui') ||
    combinedText.includes('ux') ||
    combinedText.includes('confusing') ||
    combinedText.includes('navigation')
  ) {
    subProblem = 'UI/UX & App Navigation';
  } else if (
    combinedText.includes('track') ||
    combinedText.includes('live') ||
    combinedText.includes('real time') ||
    combinedText.includes('location') ||
    combinedText.includes('gps')
  ) {
    subProblem = 'Real-time Bus Tracking';
  } else {
    const topKeywords = Array.from(inputKeywords).slice(0, 2);
    if (topKeywords.length > 0) {
      subProblem = topKeywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(' ');
    }
  }

  if (bestCluster && bestScore >= 0.65) {
    return {
      match_decision: 'MATCH_EXISTING',
      matched_cluster_id: bestCluster.id,
      matched_cluster_title: bestCluster.title,
      sub_problem: subProblem,
      confidence: bestScore,
      reason: `[Deterministic Fallback Engine] High category and entity keyword alignment (${(bestScore * 100).toFixed(0)}%) with cluster "${bestCluster.title}".`,
      flagged_for_review: false,
      candidate_similarity_scores: similarityScores,
      source: 'fallback',
      candidate_count: candidateClusters.length,
    };
  }

  if (bestCluster && bestScore >= 0.40) {
    return {
      match_decision: 'NEEDS_REVIEW',
      matched_cluster_id: bestCluster.id,
      matched_cluster_title: bestCluster.title,
      sub_problem: subProblem,
      confidence: bestScore,
      reason: `[Deterministic Fallback Engine] Moderate match (${(bestScore * 100).toFixed(0)}%) with "${bestCluster.title}". Flagged for manual review to avoid premature merging.`,
      flagged_for_review: true,
      candidate_similarity_scores: similarityScores,
      source: 'fallback',
      candidate_count: candidateClusters.length,
    };
  }

  return {
    match_decision: 'NEW_CLUSTER',
    matched_cluster_id: null,
    matched_cluster_title: null,
    sub_problem: subProblem,
    confidence: Math.max(0.7, 1 - bestScore),
    reason: '[Deterministic Fallback Engine] No existing candidate cluster met the similarity threshold. Recommended creating a new cluster.',
    flagged_for_review: false,
    candidate_similarity_scores: similarityScores,
    source: 'fallback',
    candidate_count: candidateClusters.length,
  };
}

/**
 * Deterministic fallback structured problem aggregation
 * Guarantees ACTUAL report counts and NEVER invents statistics
 */
export function fallbackGenerateStructuredProblem(
  cluster: ExistingCluster,
  reports: ProblemReport[]
): StructuredProblemStatement {
  const totalReports = reports.length;

  // Group reports by sub-problem
  const subProblemGroups = new Map<string, { count: number; quotes: string[] }>();
  const urgencyCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  const allTargetUsers = new Set<string>();

  for (const report of reports) {
    const sp = report.sub_problem?.trim() || 'General Issue';
    const existing = subProblemGroups.get(sp) || { count: 0, quotes: [] };
    existing.count += 1;
    if (existing.quotes.length < 2 && report.raw_description) {
      existing.quotes.push(report.raw_description.slice(0, 100));
    }
    subProblemGroups.set(sp, existing);

    const urg = (report.urgency || 'medium').toLowerCase() as ProblemUrgency;
    if (urg in urgencyCounts) {
      urgencyCounts[urg] += 1;
    } else {
      urgencyCounts.medium += 1;
    }

    if (report.target_users) {
      for (const u of report.target_users) allTargetUsers.add(u);
    }
  }

  const identifiedAreas: IdentifiedSubProblemArea[] = Array.from(subProblemGroups.entries())
    .map(([areaName, data]) => ({
      area_name: areaName,
      description: `Reported by ${data.count} commuter(s)/user(s) in Solvyn reports.`,
      report_count: data.count,
      percentage: totalReports > 0 ? Math.round((data.count / totalReports) * 1000) / 10 : 0,
      sample_quotes: data.quotes,
    }))
    .sort((a, b) => b.report_count - a.report_count);

  return {
    title: cluster.title,
    description: `Aggregated analysis of ${totalReports} verified report(s) regarding ${cluster.title}. Commuters and citizens highlight challenges across multiple key operational areas.`,
    category: cluster.category,
    identified_areas: identifiedAreas,
    target_users: allTargetUsers.size > 0 ? Array.from(allTargetUsers) : ['General public', 'Daily commuters'],
    urgency_breakdown: urgencyCounts,
    total_reports: totalReports,
    recommended_solution_focus: identifiedAreas.map((a) => `Improve ${a.area_name} based on commuter reports`),
    source: 'fallback',
    generated_at: new Date().toISOString(),
  };
}

/**
 * Deterministic fallback recommendation for discovery chatbot
 * Strictly grounded in available database records
 */
export function fallbackRecommendProblems(
  profile: UserDiscoveryProfile,
  availableProblems: ExistingCluster[]
): RecommendedProblem[] {
  const profileTokens = new Set([
    ...profile.skills.map((s) => s.toLowerCase()),
    ...profile.interests.map((i) => i.toLowerCase()),
    ...(profile.preferred_categories || []).map((c) => c.toLowerCase()),
    ...(profile.query ? extractKeywordsFromText(profile.query) : []),
  ]);

  const scored: { item: RecommendedProblem; score: number }[] = [];

  for (const cluster of availableProblems) {
    let matchScore = 0;
    const matchReasons: string[] = [];

    const clusterTokens = [
      ...extractKeywordsFromText(cluster.title),
      ...extractKeywordsFromText(cluster.description),
      cluster.category.toLowerCase(),
      ...(cluster.keywords || []).map((k) => k.toLowerCase()),
      ...(cluster.sub_problems || []).map((sp) => sp.toLowerCase()),
    ];

    for (const token of clusterTokens) {
      if (profileTokens.has(token)) {
        matchScore += 0.2;
        if (matchReasons.length < 3) {
          matchReasons.push(`Matches your interest in "${token}"`);
        }
      }
    }

    if (profile.preferred_categories?.some((c) => c.toLowerCase() === cluster.category.toLowerCase())) {
      matchScore += 0.3;
      matchReasons.push(`Direct category match in ${cluster.category}`);
    }

    const normalizedScore = Math.min(0.95, Math.max(0.2, Math.round(matchScore * 100) / 100));

    if (matchReasons.length === 0) {
      matchReasons.push(`High impact opportunity in ${cluster.category} with ${cluster.report_count} citizen reports`);
    }

    scored.push({
      item: {
        cluster_id: cluster.id,
        title: cluster.title,
        category: cluster.category,
        description: cluster.description,
        sub_problems: cluster.sub_problems || ['General improvements'],
        actual_report_count: cluster.report_count,
        match_score: normalizedScore,
        match_reasons: matchReasons,
        suggested_contributions: [
          `Build technical solutions for ${cluster.sub_problems?.[0] || cluster.title}`,
          `Collaborate with reporters in the ${cluster.category} domain`,
        ],
      },
      score: normalizedScore,
    });
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
}
