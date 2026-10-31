import {
  validateProblem,
  classifyProblem,
  findRelatedProblems,
  generateStructuredProblem,
  recommendProblemsForUser,
  ExistingCluster,
  ProblemReport,
  ProblemSubmissionInput,
  UserDiscoveryProfile,
} from '../lib/ai';

// ANSI terminal colors for readable test output
const green = (t: string) => `\x1b[32m${t}\x1b[0m`;
const red = (t: string) => `\x1b[31m${t}\x1b[0m`;
const blue = (t: string) => `\x1b[34m${t}\x1b[0m`;
const yellow = (t: string) => `\x1b[33m${t}\x1b[0m`;
const bold = (t: string) => `\x1b[1m${t}\x1b[0m`;

async function runTestSuite() {
  console.log(bold(blue('\n======================================================')));
  console.log(bold(blue('   SOLVYN AI ENGINE - VERIFICATION & TEST SUITE       ')));
  console.log(bold(blue('======================================================\n')));

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`${green('✔ PASS:')} ${testName}`);
      testsPassed++;
    } else {
      console.log(`${red('✖ FAIL:')} ${testName}`);
      if (details) console.log(`   ${red('Details:')} ${details}`);
      testsFailed++;
    }
  }

  // =========================================================================
  // TEST CASE 1: PROBLEM VALIDATION & UNDERSTANDING (SIMILAR & DISSIMILAR)
  // =========================================================================
  console.log(bold(yellow('\n--- TEST 1: Problem Validation & Structured Understanding ---')));

  const testReports: { id: string; input: ProblemSubmissionInput; expectedValid: boolean; expectedCategory?: string }[] = [
    {
      id: 'Report A (BMTC UI)',
      input: {
        description: 'The BMTC app has a terrible interface.',
        submittedCategory: 'Transportation',
      },
      expectedValid: true,
      expectedCategory: 'Transportation',
    },
    {
      id: 'Report B (BMTC Navigation)',
      input: {
        description: 'Navigating the BMTC app is very confusing.',
        submittedCategory: 'Transportation',
      },
      expectedValid: true,
      expectedCategory: 'Transportation',
    },
    {
      id: 'Report C (BMTC Live Tracking)',
      input: {
        description: 'I cannot track BMTC buses in real time.',
        submittedCategory: 'Transportation',
      },
      expectedValid: true,
      expectedCategory: 'Transportation',
    },
    {
      id: 'Report D (BMTC App Locations)',
      input: {
        description: 'We need an app that shows live bus locations.',
      },
      expectedValid: true,
      expectedCategory: 'Transportation',
    },
    {
      id: 'Report E (Dissimilar: Healthcare Insulin)',
      input: {
        description: 'Primary Health Centers in rural Mandya lack basic insulin refrigeration and emergency medicines.',
        location: 'Mandya, Karnataka',
      },
      expectedValid: true,
      expectedCategory: 'Healthcare',
    },
    {
      id: 'Report F (Dissimilar: Environment Burning)',
      input: {
        description: 'Open garbage dumping and burning along Bellandur lake causes dense toxic smoke for residents every night.',
        location: 'Bellandur, Bangalore',
      },
      expectedValid: true,
      expectedCategory: 'Environment',
    },
    {
      id: 'Report G (Short genuine problem: Infrastructure)',
      input: {
        description: 'Potholes on 80ft road Indiranagar causing accidents.',
      },
      expectedValid: true,
      expectedCategory: 'Public Infrastructure',
    },
    {
      id: 'Report H (Spam / Non-problem)',
      input: {
        description: 'FREE CRYPTO AIRDROP CLICK NOW http://scam.xyz/free-coins-12345 to claim \$10,000 cash prize',
      },
      expectedValid: false,
    },
  ];

  const validatedResults = [];

  for (const t of testReports) {
    const res = await validateProblem(t.input);
    validatedResults.push({ id: t.id, result: res });

    assert(
      res.is_valid === t.expectedValid,
      `${t.id} validity check (is_valid: ${res.is_valid}, source: ${res.source})`
    );

    if (t.expectedCategory) {
      assert(
        res.category === t.expectedCategory,
        `${t.id} category classification (Got: "${res.category}", Expected: "${t.expectedCategory}")`
      );
    }

    // Verify required JSON fields are present and valid
    assert(
      typeof res.normalized_title === 'string' && res.normalized_title.length >= 3,
      `${t.id} has normalized_title: "${res.normalized_title}"`
    );
    assert(
      Array.isArray(res.keywords) && res.keywords.length > 0,
      `${t.id} extracted keywords: [${res.keywords.join(', ')}]`
    );
    assert(
      typeof res.sub_problem === 'string' && res.sub_problem.length > 0,
      `${t.id} sub_problem: "${res.sub_problem}"`
    );
    assert(
      ['low', 'medium', 'high', 'critical'].includes(res.urgency),
      `${t.id} urgency: "${res.urgency}"`
    );
    assert(
      Array.isArray(res.target_users) && res.target_users.length > 0,
      `${t.id} target_users: [${res.target_users.join(', ')}]`
    );
  }

  // =========================================================================
  // TEST CASE 2: PROBLEM CLUSTERING & SUB-PROBLEM GROUPING (A&B vs C&D vs E)
  // =========================================================================
  console.log(bold(yellow('\n--- TEST 2: Problem Clustering & Sub-Problem Distinction ---')));

  // Pre-existing BMTC cluster in database
  const bmtcCluster: ExistingCluster = {
    id: 'cluster-bmtc-101',
    title: 'BMTC Commuter Experience Improvement',
    category: 'Transportation',
    description: 'Multiple commuters report difficulties using the BMTC application, regarding navigation and bus tracking.',
    sub_problems: ['UI/UX & App Navigation', 'Real-time Tracking & Visibility'],
    keywords: ['bmtc', 'bus', 'tracking', 'commuter', 'interface', 'transit'],
    report_count: 12,
  };

  const healthcareCluster: ExistingCluster = {
    id: 'cluster-health-202',
    title: 'Rural Healthcare Supply Chain & Cold Storage',
    category: 'Healthcare',
    description: 'Shortage of essential medicines and cold storage in rural primary health clinics.',
    sub_problems: ['Cold Storage & Refrigeration', 'Essential Medicine Stockout'],
    keywords: ['clinic', 'medicine', 'insulin', 'phc', 'refrigeration'],
    report_count: 5,
  };

  const candidateClusters = [bmtcCluster, healthcareCluster];

  // Test Report A (UI/UX) against BMTC cluster
  const clusterResA = await findRelatedProblems(testReports[0].input, candidateClusters);
  assert(
    clusterResA.match_decision === 'MATCH_EXISTING' && clusterResA.matched_cluster_id === 'cluster-bmtc-101',
    'Report A ("terrible interface") matches BMTC cluster',
    `Decision: ${clusterResA.match_decision}, Matched ID: ${clusterResA.matched_cluster_id}, Confidence: ${clusterResA.confidence}`
  );

  // Test Report B (Navigation) against BMTC cluster
  const clusterResB = await findRelatedProblems(testReports[1].input, candidateClusters);
  assert(
    clusterResB.match_decision === 'MATCH_EXISTING' && clusterResB.matched_cluster_id === 'cluster-bmtc-101',
    'Report B ("confusing navigation") matches BMTC cluster',
    `Decision: ${clusterResB.match_decision}, Matched ID: ${clusterResB.matched_cluster_id}`
  );

  // Verify A & B are recognized as UI/UX sub-problems
  const isA_UI = /ui|ux|interface|navigation/i.test(clusterResA.sub_problem);
  const isB_UI = /ui|ux|interface|navigation/i.test(clusterResB.sub_problem);
  assert(
    isA_UI && isB_UI,
    `Reports A & B correctly identified as UI/UX sub-problem (A: "${clusterResA.sub_problem}", B: "${clusterResB.sub_problem}")`
  );

  // Test Report C (Real-time tracking) against BMTC cluster
  const clusterResC = await findRelatedProblems(testReports[2].input, candidateClusters);
  assert(
    clusterResC.match_decision === 'MATCH_EXISTING' && clusterResC.matched_cluster_id === 'cluster-bmtc-101',
    'Report C ("track in real time") matches BMTC cluster',
    `Decision: ${clusterResC.match_decision}, Matched ID: ${clusterResC.matched_cluster_id}`
  );

  // Test Report D (Live bus locations) against BMTC cluster
  const clusterResD = await findRelatedProblems(testReports[3].input, candidateClusters);
  assert(
    clusterResD.match_decision === 'MATCH_EXISTING' && clusterResD.matched_cluster_id === 'cluster-bmtc-101',
    'Report D ("live bus locations") matches BMTC cluster',
    `Decision: ${clusterResD.match_decision}, Matched ID: ${clusterResD.matched_cluster_id}`
  );

  // Verify C & D are recognized as Tracking / Location sub-problems (DISTINCT from UI/UX)
  const isC_Tracking = /track|location|live|real-time|gps/i.test(clusterResC.sub_problem);
  const isD_Tracking = /track|location|live|real-time|gps/i.test(clusterResD.sub_problem);
  assert(
    isC_Tracking && isD_Tracking,
    `Reports C & D correctly identified as Tracking sub-problem (C: "${clusterResC.sub_problem}", D: "${clusterResD.sub_problem}")`
  );

  // Verify Dissimilar Report E (Healthcare insulin) is NOT merged into BMTC!
  const clusterResE = await findRelatedProblems(testReports[4].input, [bmtcCluster]);
  assert(
    clusterResE.match_decision === 'NEW_CLUSTER' || clusterResE.matched_cluster_id !== 'cluster-bmtc-101',
    'Dissimilar Report E (Healthcare insulin) is NOT merged into BMTC cluster',
    `Decision: ${clusterResE.match_decision}, Matched ID: ${clusterResE.matched_cluster_id}`
  );

  // Verify Dissimilar Report F (Lake burning) is NOT merged into BMTC!
  const clusterResF = await findRelatedProblems(testReports[5].input, candidateClusters);
  assert(
    clusterResF.match_decision === 'NEW_CLUSTER',
    'Dissimilar Report F (Bellandur lake burning) initiates a NEW_CLUSTER',
    `Decision: ${clusterResF.match_decision}, Confidence: ${clusterResF.confidence}`
  );

  // =========================================================================
  // TEST CASE 3: STRUCTURED PROBLEM STATEMENT GENERATION WITH EXACT COUNTS
  // =========================================================================
  console.log(bold(yellow('\n--- TEST 3: Structured Problem Statement Generation ---')));

  const mockDatabaseReports: ProblemReport[] = [
    {
      id: 'rep-1',
      cluster_id: 'cluster-bmtc-101',
      raw_description: 'The BMTC app has a terrible interface.',
      normalized_title: 'BMTC App Interface Usability Failure',
      sub_problem: 'UI/UX & App Navigation',
      category: 'Transportation',
      urgency: 'medium',
      target_users: ['Daily commuters'],
    },
    {
      id: 'rep-2',
      cluster_id: 'cluster-bmtc-101',
      raw_description: 'Navigating the BMTC app is very confusing.',
      normalized_title: 'Confusing BMTC Application Navigation',
      sub_problem: 'UI/UX & App Navigation',
      category: 'Transportation',
      urgency: 'medium',
      target_users: ['Daily commuters'],
    },
    {
      id: 'rep-3',
      cluster_id: 'cluster-bmtc-101',
      raw_description: 'I cannot track BMTC buses in real time.',
      normalized_title: 'Real-time BMTC Bus Tracking Unavailable',
      sub_problem: 'Real-time Bus Tracking',
      category: 'Transportation',
      urgency: 'high',
      target_users: ['Daily commuters', 'Transit passengers'],
    },
    {
      id: 'rep-4',
      cluster_id: 'cluster-bmtc-101',
      raw_description: 'We need an app that shows live bus locations.',
      normalized_title: 'Live Bus Location Visibility Needed',
      sub_problem: 'Real-time Bus Tracking',
      category: 'Transportation',
      urgency: 'medium',
      target_users: ['Daily commuters'],
    },
  ];

  const aggregatedStatement = await generateStructuredProblem(bmtcCluster, mockDatabaseReports);

  console.log(`Aggregated Title: "${aggregatedStatement.title}"`);
  console.log(`Total Reports: ${aggregatedStatement.total_reports}`);
  console.log(`Identified Areas:`);
  aggregatedStatement.identified_areas.forEach((a) => {
    console.log(`  - ${a.area_name}: ${a.report_count} reports (${a.percentage}%)`);
  });

  assert(
    aggregatedStatement.total_reports === 4,
    'Aggregated statement has exact total report count = 4 (NEVER hallucinated)'
  );

  const totalAreaReports = aggregatedStatement.identified_areas.reduce((acc, a) => acc + a.report_count, 0);
  assert(
    totalAreaReports === 4,
    `Identified areas sum up to exactly 4 reports (Sum: ${totalAreaReports})`
  );

  assert(
    aggregatedStatement.urgency_breakdown.medium === 3 && aggregatedStatement.urgency_breakdown.high === 1,
    'Urgency distribution strictly grounded in input reports (3 medium, 1 high)'
  );

  assert(
    aggregatedStatement.identified_areas.some((a) => a.area_name.includes('UI/UX')),
    'Identified area contains UI/UX'
  );
  assert(
    aggregatedStatement.identified_areas.some((a) => a.area_name.includes('Tracking')),
    'Identified area contains Tracking'
  );

  // =========================================================================
  // TEST CASE 4: DISCOVERY CHATBOT ASSISTANT
  // =========================================================================
  console.log(bold(yellow('\n--- TEST 4: Problem Discovery Chatbot Assistant ---')));

  const userProfile: UserDiscoveryProfile = {
    skills: ['React Native', 'Mobile UI/UX', 'TypeScript'],
    interests: ['Urban mobility', 'Public transit', 'Commuter experience'],
    preferred_categories: ['Transportation'],
    query: 'Looking for a mobile app project to help city bus commuters',
  };

  const chatbotResult = await recommendProblemsForUser(userProfile, candidateClusters);

  assert(
    chatbotResult.recommendations.length > 0,
    `Chatbot returned ${chatbotResult.recommendations.length} recommendations`
  );

  const topRec = chatbotResult.recommendations[0];
  assert(
    topRec.cluster_id === 'cluster-bmtc-101',
    `Top recommendation matches BMTC cluster ("${topRec.title}")`
  );
  assert(
    topRec.actual_report_count === 12,
    `Top recommendation displays actual report count = 12 (Grounded in DB record)`
  );
  assert(
    topRec.match_reasons.length > 0,
    `Explanation provided: "${topRec.match_reasons[0]}"`
  );

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(bold(blue('\n======================================================')));
  console.log(bold(blue('                   TEST SUMMARY                       ')));
  console.log(bold(blue('======================================================')));
  console.log(`Total tests run: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${green(String(testsPassed))}`);
  console.log(`Failed: ${testsFailed > 0 ? red(String(testsFailed)) : '0'}`);

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log(bold(green('\nALL SOLVYN AI SERVICE TESTS COMPLETED SUCCESSFULLY!\n')));
  }
}

runTestSuite().catch((err) => {
  console.error(red('Fatal error during test execution:'), err);
  process.exit(1);
});

