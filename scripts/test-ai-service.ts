import {
  validateProblem,
  classifyProblem,
  findRelatedProblems,
  generateStructuredProblem,
  recommendProblemsForUser,
  keywordMatchesText,
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
  // TEST CASE 5: GENERALIZATION & REGRESSION VERIFICATION (TASKS 1-6)
  // =========================================================================
  console.log(bold(yellow('\n--- TEST 5: Domain Generalization & Regression Tests ---')));

  // 1. Accessibility buildings test (must not classify as UI/UX because of "buildings")
  const accessRes = await validateProblem({
    description: 'Wheelchair users cannot access many public buildings due to lack of ramps and elevators.',
  });
  assert(
    accessRes.category === 'Accessibility',
    `Accessibility buildings problem classified as Accessibility (Got: "${accessRes.category}")`
  );
  assert(
    !/ui|ux/i.test(accessRes.sub_problem),
    `Accessibility buildings problem is NOT classified as UI/UX (sub_problem: "${accessRes.sub_problem}")`
  );

  // 2. Science equipment test (must not classify as UI/UX because of "equipment")
  const equipRes = await validateProblem({
    description: 'Rural schools lack essential science lab equipment and experimental supplies for students.',
  });
  assert(
    equipRes.category === 'Education',
    `Science lab equipment problem classified as Education (Got: "${equipRes.category}")`
  );
  assert(
    !/ui|ux/i.test(equipRes.sub_problem),
    `Science lab equipment problem is NOT classified as UI/UX (sub_problem: "${equipRes.sub_problem}")`
  );

  // 3. Non-transport tracking problem (must not become Real-time Bus Tracking)
  const healthTrackInput: ProblemSubmissionInput = {
    description: 'Doctors cannot track emergency blood donation supplies in real time across district clinics.',
    submittedCategory: 'Healthcare',
  };
  const healthTrackRes = await findRelatedProblems(healthTrackInput, [healthcareCluster]);
  assert(
    healthTrackRes.sub_problem !== 'Real-time Bus Tracking',
    `Non-transport tracking is NOT labeled "Real-time Bus Tracking" (Got: "${healthTrackRes.sub_problem}")`
  );

  // 4. BMTC real-time tracking problem must still be classified sensibly
  const bmtcTrackInput: ProblemSubmissionInput = {
    description: 'I cannot track BMTC buses in real time.',
    submittedCategory: 'Transportation',
  };
  const bmtcTrackRes = await findRelatedProblems(bmtcTrackInput, [bmtcCluster]);
  assert(
    bmtcTrackRes.match_decision === 'MATCH_EXISTING' && bmtcTrackRes.matched_cluster_id === 'cluster-bmtc-101',
    'BMTC real-time tracking matches BMTC cluster'
  );
  assert(
    /track|location|live|real-time|gps/i.test(bmtcTrackRes.sub_problem),
    `BMTC tracking sub_problem is tracking-related (Got: "${bmtcTrackRes.sub_problem}")`
  );

  // 5. Healthcare appointment delays vs. medicine shortages remain distinct
  const healthApptCluster: ExistingCluster = {
    id: 'cluster-health-appt-01',
    title: 'Government Hospital Outpatient Wait Times and Scheduling',
    category: 'Healthcare',
    description: 'Patients wait 4 to 5 hours for outpatient doctor consultations in public hospitals.',
    sub_problems: ['Long Outpatient Queues', 'Doctor Scheduling'],
    keywords: ['hospital', 'wait', 'appointment', 'queue', 'doctor'],
    report_count: 8,
  };
  const healthMedsCluster: ExistingCluster = {
    id: 'cluster-health-meds-02',
    title: 'Public Hospital Essential Medicine Shortages',
    category: 'Healthcare',
    description: 'Hospital pharmacies frequently run out of essential diabetes and blood pressure medications.',
    sub_problems: ['Pharmacy Stockout', 'Supply Chain Delays'],
    keywords: ['pharmacy', 'medicine', 'insulin', 'shortage', 'drugs'],
    report_count: 6,
  };
  const healthCandidates = [healthApptCluster, healthMedsCluster];

  const apptReportRes = await findRelatedProblems(
    { description: 'Patients queue for 5 hours at civil hospital outpatient counter just for routine doctor checkup.' },
    healthCandidates
  );
  assert(
    apptReportRes.match_decision === 'MATCH_EXISTING' && apptReportRes.matched_cluster_id === 'cluster-health-appt-01',
    `Appointment delay report matches wait-times cluster (Matched: ${apptReportRes.matched_cluster_id}, Confidence: ${apptReportRes.confidence})`
  );

  const medsReportRes = await findRelatedProblems(
    { description: 'The government health center pharmacy is completely out of stock for diabetes insulin and test strips.' },
    healthCandidates
  );
  assert(
    medsReportRes.match_decision === 'MATCH_EXISTING' && medsReportRes.matched_cluster_id === 'cluster-health-meds-02',
    `Medicine shortage report matches medicine cluster (Matched: ${medsReportRes.matched_cluster_id}, Confidence: ${medsReportRes.confidence})`
  );
  assert(
    apptReportRes.matched_cluster_id !== medsReportRes.matched_cluster_id,
    'Healthcare appointment delays and medicine shortages remain distinct clusters'
  );

  // 6. Education and healthcare problems are not merged
  const eduCrossRes = await findRelatedProblems(
    { description: 'Rural school students have no science textbooks or laboratory equipment for practical exams.' },
    healthCandidates
  );
  assert(
    eduCrossRes.match_decision === 'NEW_CLUSTER',
    `Education problem is NOT merged into Healthcare clusters (Decision: ${eduCrossRes.match_decision})`
  );

  // 7. Aggregation for non-transport reports must not invent commuter stakeholders
  const healthReports: ProblemReport[] = [
    {
      id: 'rep-h1',
      cluster_id: 'cluster-health-appt-01',
      raw_description: 'Outpatient queue took 4 hours at the civil hospital.',
      normalized_title: 'Severe Outpatient Queue Delays',
      sub_problem: 'Long Outpatient Queues',
      category: 'Healthcare',
      urgency: 'high',
      target_users: ['Hospital patients', 'Elderly citizens'],
    },
    {
      id: 'rep-h2',
      cluster_id: 'cluster-health-appt-01',
      raw_description: 'Only one doctor available for 200 patients in morning OPD.',
      normalized_title: 'Doctor Staffing Shortage at OPD',
      sub_problem: 'Doctor Staffing',
      category: 'Healthcare',
      urgency: 'high',
      target_users: ['Hospital patients', 'Caregivers'],
    },
  ];

  const healthAggStatement = await generateStructuredProblem(healthApptCluster, healthReports);
  const hasCommuterInTargetUsers = healthAggStatement.target_users.some((u) => /commuter/i.test(u));
  const hasCommuterInDesc = /commuter/i.test(healthAggStatement.description);
  const hasCommuterInFocus = healthAggStatement.recommended_solution_focus.some((f) => /commuter/i.test(f));

  assert(
    !hasCommuterInTargetUsers,
    `Non-transport aggregation target_users contains NO commuters (Got: [${healthAggStatement.target_users.join(', ')}])`
  );
  assert(
    !hasCommuterInDesc,
    'Non-transport aggregation description contains NO commuter assumptions'
  );
  assert(
    !hasCommuterInFocus,
    'Non-transport aggregation solution focus contains NO commuter assumptions'
  );
  assert(
    healthAggStatement.total_reports === 2,
    'Non-transport aggregated statement has exact total report count = 2'
  );

  // =========================================================================
  // TEST CASE 6: FINAL GENERALIZATION REFINEMENTS
  // =========================================================================
  console.log(bold(yellow('\n--- TEST 6: Final Generalization Refinements ---')));

  // 1. Substring Collision Tests (bus != business, road != broadband, fare != welfare)
  const businessRes = await validateProblem({
    description: 'Small business owners in the commercial district face excessive municipal trade license fees.',
  });
  assert(
    businessRes.category !== 'Transportation',
    `Small business problem is NOT Transportation (Got: "${businessRes.category}")`
  );

  const broadbandRes = await validateProblem({
    description: 'Broadband internet service experiences persistent high latency and dropped connections.',
  });
  assert(
    broadbandRes.category !== 'Public Infrastructure',
    `Broadband problem is NOT Public Infrastructure (Got: "${broadbandRes.category}")`
  );

  const welfareRes = await validateProblem({
    description: 'Social welfare pension distribution centers are understaffed and facing severe delays.',
  });
  assert(
    welfareRes.category !== 'Transportation',
    `Welfare problem is NOT Transportation (Got: "${welfareRes.category}")`
  );

  // Actual bus, road, and fare problems still match appropriate categories
  const actualBusRes = await validateProblem({
    description: 'BMTC bus service on route 500D is crowded and constantly late.',
  });
  assert(
    actualBusRes.category === 'Transportation',
    `Actual bus problem matches Transportation (Got: "${actualBusRes.category}")`
  );

  const actualRoadRes = await validateProblem({
    description: 'Deep potholes on 80ft road cause frequent vehicle damage and accidents.',
  });
  assert(
    actualRoadRes.category === 'Public Infrastructure',
    `Actual road problem matches Public Infrastructure (Got: "${actualRoadRes.category}")`
  );

  const actualFareRes = await validateProblem({
    description: 'City bus fare has increased sharply without any improvement in commuter seat availability.',
  });
  assert(
    actualFareRes.category === 'Transportation',
    `Actual bus fare problem matches Transportation (Got: "${actualFareRes.category}")`
  );

  // 2. Target-User Grounding in Aggregation (Deduplication, whitespace trimming, stable order)
  const dirtyTargetUsersReports: ProblemReport[] = [
    {
      id: 'rep-u1',
      cluster_id: 'cluster-health-appt-01',
      raw_description: 'Outpatient queue delays at civil hospital.',
      normalized_title: 'Outpatient Delays',
      sub_problem: 'Outpatient Queues',
      category: 'Healthcare',
      urgency: 'high',
      target_users: ['  Hospital patients  ', 'Elderly citizens', ''],
    },
    {
      id: 'rep-u2',
      cluster_id: 'cluster-health-appt-01',
      raw_description: 'Doctors arrive late to the OPD counter.',
      normalized_title: 'Late Doctor OPD Arrival',
      sub_problem: 'Doctor Scheduling',
      category: 'Healthcare',
      urgency: 'medium',
      target_users: ['Hospital patients', '  Elderly citizens  ', '   ', 'Caregivers'],
    },
  ];

  const groundedAggStatement = await generateStructuredProblem(healthApptCluster, dirtyTargetUsersReports);
  assert(
    groundedAggStatement.target_users.length === 3 &&
      groundedAggStatement.target_users[0] === 'Hospital patients' &&
      groundedAggStatement.target_users[1] === 'Elderly citizens' &&
      groundedAggStatement.target_users[2] === 'Caregivers',
    `Target users cleanly deduplicated, trimmed, and ordered (Got: [${groundedAggStatement.target_users.join(', ')}])`
  );
  assert(
    !groundedAggStatement.target_users.some((u) => u.trim() === '' || u !== u.trim()),
    'No empty strings or untrimmed whitespace in target users'
  );

  // Case B: Reports contain NO target users -> Uses neutral fallback
  const noUsersReports: ProblemReport[] = [
    {
      id: 'rep-nu1',
      cluster_id: 'cluster-health-appt-01',
      raw_description: 'General hospital delays.',
      normalized_title: 'General Delays',
      sub_problem: 'Delays',
      category: 'Healthcare',
      urgency: 'medium',
      target_users: [],
    },
  ];
  const noUsersAggStatement = await generateStructuredProblem(healthApptCluster, noUsersReports);
  assert(
    noUsersAggStatement.target_users.length > 0 &&
      !noUsersAggStatement.target_users.some((u) => /commuter/i.test(u)),
    `Empty target users uses neutral fallback without commuter bias (Got: [${noUsersAggStatement.target_users.join(', ')}])`
  );

  // 3. Tracking Alignment in Fallback Validation
  const farmFertilizerRes = await validateProblem({
    description: 'Farmers cannot track fertilizer shipments.',
  });
  assert(
    farmFertilizerRes.sub_problem === 'Real-time Tracking & Visibility',
    `"Farmers cannot track fertilizer" -> Real-time Tracking & Visibility (Got: "${farmFertilizerRes.sub_problem}")`
  );
  assert(
    farmFertilizerRes.sub_problem !== 'Real-time Bus Tracking',
    'Fertilizer tracking is NOT labeled Real-time Bus Tracking'
  );

  const farmDistributionRes = await validateProblem({
    description: 'Farmers cannot track agricultural supply distribution.',
  });
  assert(
    farmDistributionRes.sub_problem === 'Real-time Tracking & Visibility',
    `"Farmers cannot track agricultural distribution" -> Real-time Tracking & Visibility (Got: "${farmDistributionRes.sub_problem}")`
  );

  const trainLocationRes = await validateProblem({
    description: 'Passengers cannot track train locations.',
  });
  assert(
    trainLocationRes.sub_problem === 'Real-time Tracking & Visibility',
    `"Passengers cannot track train locations" -> Real-time Tracking & Visibility (Got: "${trainLocationRes.sub_problem}")`
  );
  assert(
    trainLocationRes.sub_problem !== 'Real-time Bus Tracking',
    'Train location tracking is NOT labeled Real-time Bus Tracking'
  );

  const bmtcBusRes = await validateProblem({
    description: 'Passengers cannot track BMTC buses.',
  });
  assert(
    bmtcBusRes.sub_problem === 'Real-time Bus Tracking',
    `"Passengers cannot track BMTC buses" -> Real-time Bus Tracking (Got: "${bmtcBusRes.sub_problem}")`
  );

  // 4. Category Inconsistency & Preserving Recognized Domains
  const sanitationClassRes = await classifyProblem({
    description: 'Public community toilets in the market are overflowing with raw sewage and broken septic tanks.',
  });
  assert(
    sanitationClassRes.category === 'Sanitation',
    `Sanitation problem preserved as Sanitation (Got: "${sanitationClassRes.category}")`
  );

  const legalClassRes = await classifyProblem({
    description: 'Under-trial prisoners cannot access legal aid lawyers and face illegal detention without bail.',
  });
  assert(
    legalClassRes.category === 'Legal Rights',
    `Legal aid problem preserved as Legal Rights (Got: "${legalClassRes.category}")`
  );

  const consumerClassRes = await classifyProblem({
    description: 'Broadband telecom companies are deceptively billing customers with hidden activation fees and overcharging.',
  });
  assert(
    consumerClassRes.category === 'Consumer Rights',
    `Consumer billing problem preserved as Consumer Rights (Got: "${consumerClassRes.category}")`
  );

  const disasterClassRes = await classifyProblem({
    description: 'Flood victims in temporary emergency shelter camps lack clean water rations and rehabilitation relief.',
  });
  assert(
    disasterClassRes.category === 'Disaster Relief',
    `Disaster flood problem preserved as Disaster Relief (Got: "${disasterClassRes.category}")`
  );

  // 5. Target-User Case-Insensitive Deduplication (preserving first display value and order)
  const caseSensitiveReports: ProblemReport[] = [
    {
      id: 'rep-case-1',
      cluster_id: 'cluster-health-appt-01',
      raw_description: 'Report 1',
      normalized_title: 'Title 1',
      sub_problem: 'Queues',
      category: 'Healthcare',
      urgency: 'high',
      target_users: ['Daily Commuters', 'Metro Riders'],
    },
    {
      id: 'rep-case-2',
      cluster_id: 'cluster-health-appt-01',
      raw_description: 'Report 2',
      normalized_title: 'Title 2',
      sub_problem: 'Queues',
      category: 'Healthcare',
      urgency: 'medium',
      target_users: ['daily commuters', 'DAILY COMMUTERS', 'metro riders', 'Bus Passengers'],
    },
    {
      id: 'rep-case-3',
      cluster_id: 'cluster-health-appt-01',
      raw_description: 'Report 3',
      normalized_title: 'Title 3',
      sub_problem: 'Queues',
      category: 'Healthcare',
      urgency: 'low',
      target_users: ['bus passengers', 'BUS PASSENGERS', 'Cyclists'],
    },
  ];

  const caseDedupeAgg = await generateStructuredProblem(healthApptCluster, caseSensitiveReports);
  assert(
    caseDedupeAgg.target_users.length === 4,
    `Case-insensitive target user deduplication: exactly 4 unique users (Got: ${caseDedupeAgg.target_users.length})`
  );
  assert(
    caseDedupeAgg.target_users[0] === 'Daily Commuters' &&
      caseDedupeAgg.target_users[1] === 'Metro Riders' &&
      caseDedupeAgg.target_users[2] === 'Bus Passengers' &&
      caseDedupeAgg.target_users[3] === 'Cyclists',
    `First-encountered display casing and stable order preserved (Got: [${caseDedupeAgg.target_users.join(', ')}])`
  );

  // 6. Plural Variations & Substring Isolation in keywordMatchesText()
  assert(
    keywordMatchesText('local communities face severe water shortages', 'community'),
    'Consonant+y plural "communities" matches "community"'
  );
  assert(
    keywordMatchesText('state subsidies for drip irrigation are delayed', 'subsidy'),
    'Consonant+y plural "subsidies" matches "subsidy"'
  );
  assert(
    keywordMatchesText('government offices lack accessibility for people with disabilities', 'disability'),
    'Consonant+y plural "disabilities" matches "disability"'
  );
  assert(
    keywordMatchesText('rental properties have exorbitant deposits', 'property'),
    'Consonant+y plural "properties" matches "property"'
  );
  assert(
    keywordMatchesText('state universities need modern laboratory facilities', 'university'),
    'Consonant+y plural "universities" matches "university"'
  );
  assert(
    !keywordMatchesText('telecom communication towers have power backup', 'community'),
    'Substring false positive "communication" does NOT match "community"'
  );
  assert(
    !keywordMatchesText('small business enterprises require licenses', 'bus'),
    'Substring false positive "business" does NOT match "bus"'
  );
  assert(
    !keywordMatchesText('broadband network cables are damaged', 'road'),
    'Substring false positive "broadband" does NOT match "road"'
  );
  assert(
    !keywordMatchesText('social welfare distribution centers', 'fare'),
    'Substring false positive "welfare" does NOT match "fare"'
  );
  assert(
    keywordMatchesText('dangerous potholes along the road', 'pothole'),
    'Standard plural "potholes" matches "pothole"'
  );
  assert(
    keywordMatchesText('overcrowded buses on ring road', 'bus'),
    'Standard plural "buses" matches "bus"'
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

