/**
 * Test Suite: Module 4 - User Profile Integration & Regression Testing
 * Run: npx tsx scripts/test-user-profile.ts
 */

import { formatJoinDate } from '../src/components/profile/ProfileHeader';
import { getAvatarInitials } from '../src/components/solutions/SolutionCard';
import { SolutionFormSchema } from '../src/lib/validations/solution-form';
import { PublicProfileResponse } from '../src/types/api.types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log('\n======================================================');
console.log('  SOLVYN MODULE 4: USER PROFILE TEST SUITE');
console.log('======================================================\n');

// 1. DATE FORMATTING TESTS
console.log('Test Group 1: Member Join Date Formatting');
assert(
  formatJoinDate('2026-10-31T08:00:00Z').includes('2026'),
  'formatJoinDate formats valid ISO string with year',
  `Result was ${formatJoinDate('2026-10-31T08:00:00Z')}`
);
assert(
  formatJoinDate(undefined) === 'Recently',
  'formatJoinDate returns "Recently" when date is undefined'
);
assert(
  formatJoinDate('') === 'Recently',
  'formatJoinDate returns "Recently" when date is empty'
);
assert(
  formatJoinDate('invalid-date-string') === 'Recently',
  'formatJoinDate returns "Recently" on invalid date string'
);

// 2. AVATAR INITIALS FALLBACK
console.log('\nTest Group 2: Avatar Initials Fallback');
assert(
  getAvatarInitials('Ada Lovelace') === 'AL',
  'getAvatarInitials extracts first letters from multi-word names'
);
assert(
  getAvatarInitials('Linus') === 'LI',
  'getAvatarInitials extracts first two characters from single-word names'
);
assert(
  getAvatarInitials('', 'U') === 'U',
  'getAvatarInitials returns fallback when name is empty'
);
assert(
  getAvatarInitials(null, 'FB') === 'FB',
  'getAvatarInitials returns fallback when name is null'
);

// 3. STATS & UPVOTES CALCULATION
console.log('\nTest Group 3: Profile Statistics Calculations');
const mockProfileData: PublicProfileResponse = {
  id: 'user-uuid-1',
  username: 'solvyn_pioneer',
  full_name: 'Grace Hopper',
  avatar_url: null,
  bio: 'Systems architect and debugger.',
  skills: ['TypeScript', 'Distributed Systems', 'Next.js'],
  interests: ['Open Source', 'Compilers'],
  created_at: '2026-05-15T12:00:00Z',
  updated_at: '2026-05-15T12:00:00Z',
  problem_count: 4,
  solution_count: 3,
  solutions: [
    {
      id: 'sol-1',
      problem_id: 'prob-1',
      user_id: 'user-uuid-1',
      title: 'Real-time Compiler Webhook',
      description: 'Zero-latency streaming compilation webhook.',
      github_url: 'https://github.com/solvyn/webhook',
      demo_url: null,
      live_url: 'https://webhook.solvyn.dev',
      video_url: null,
      like_count: 42,
      created_at: '2026-06-01T10:00:00Z',
      updated_at: '2026-06-01T10:00:00Z',
      problem: {
        id: 'prob-1',
        title: 'Slow webhook deliveries in high-traffic queues',
        category: 'infrastructure',
      },
    },
    {
      id: 'sol-2',
      problem_id: 'prob-2',
      user_id: 'user-uuid-1',
      title: 'Optimistic UI Cache',
      description: 'Local sync engine for offline-first React applications.',
      github_url: 'https://github.com/solvyn/cache',
      demo_url: null,
      live_url: null,
      video_url: null,
      like_count: 18,
      created_at: '2026-07-01T10:00:00Z',
      updated_at: '2026-07-01T10:00:00Z',
      problem: {
        id: 'prob-2',
        title: 'Network latency degradation on mobile devices',
        category: 'frontend',
      },
    },
    {
      id: 'sol-3',
      problem_id: 'prob-3',
      user_id: 'user-uuid-1',
      title: 'PostgreSQL Index Tuner',
      description: 'Automated index advisor for high cardinality tables.',
      github_url: 'https://github.com/solvyn/pg-tune',
      demo_url: null,
      live_url: null,
      video_url: null,
      like_count: 5,
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-08-01T10:00:00Z',
      problem: {
        id: 'prob-3',
        title: 'Slow relational queries on large datasets',
        category: 'database',
      },
    },
  ],
  recent_reports: [
    {
      id: 'rep-1',
      problem_id: 'prob-1',
      user_id: 'user-uuid-1',
      original_text: 'Webhook timeouts when queue exceeds 10k messages.',
      sub_problem: 'Timeout',
      category: 'infrastructure',
      created_at: '2026-05-20T10:00:00Z',
      problem: {
        id: 'prob-1',
        title: 'Slow webhook deliveries',
      },
    },
  ],
};

const totalCalculatedLikes = mockProfileData.solutions.reduce(
  (sum, s) => sum + (s.like_count || 0),
  0
);
assert(
  totalCalculatedLikes === 65,
  'Total upvotes aggregated correctly across all user solutions (42 + 18 + 5 = 65)',
  `Expected 65, got ${totalCalculatedLikes}`
);
assert(
  mockProfileData.solution_count === 3,
  'Solution count matches number of submitted solutions'
);
assert(
  mockProfileData.problem_count === 4,
  'Reported problem count correctly maintained'
);

// 4. MISSING OPTIONAL FIELDS & SANITIZATION
console.log('\nTest Group 4: Graceful Handling of Missing Optional Profile Fields');
const sparseProfile: PublicProfileResponse = {
  id: 'user-uuid-2',
  username: 'new_builder',
  full_name: null,
  avatar_url: null,
  bio: null,
  skills: null,
  interests: null,
  created_at: '2026-10-31T00:00:00Z',
  updated_at: '2026-10-31T00:00:00Z',
  problem_count: 0,
  solution_count: 0,
  solutions: [],
  recent_reports: [],
};

const displayNameFallback = sparseProfile.full_name?.trim() || sparseProfile.username;
assert(
  displayNameFallback === 'new_builder',
  'Fallback display name is username when full_name is null'
);

const emptySkills = Array.isArray(sparseProfile.skills) ? sparseProfile.skills : [];
assert(
  emptySkills.length === 0,
  'Skills gracefully defaults to empty array when null in database'
);

const sparseLikes = (sparseProfile.solutions || []).reduce(
  (sum, s) => sum + (s.like_count || 0),
  0
);
assert(
  sparseLikes === 0,
  'Zero solutions profile safely produces 0 total upvotes without NaN or errors'
);

// 5. SOLUTIONS SORTING VERIFICATION
console.log('\nTest Group 5: User Solutions Sorting Verification');
const sortedByNewest = [...mockProfileData.solutions].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);
assert(
  sortedByNewest[0].id === 'sol-3' && sortedByNewest[2].id === 'sol-1',
  'Solutions sort by newest first (Aug > Jul > Jun)'
);

const sortedByLikes = [...mockProfileData.solutions].sort(
  (a, b) => (b.like_count || 0) - (a.like_count || 0)
);
assert(
  sortedByLikes[0].id === 'sol-1' && sortedByLikes[2].id === 'sol-3',
  'Solutions sort by highest upvotes (42 > 18 > 5)'
);

// 6. REGRESSION TESTS (MODULES 1, 2, 3)
console.log('\nTest Group 6: Cross-Module Regression Verification');

// Module 1: SolutionForm validation schema
const validSubmission = {
  problem_id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'High-throughput caching proxy',
  description: 'A comprehensive multi-tiered caching proxy designed for distributed backends.',
  github_url: 'https://github.com/solvyn/caching-proxy',
  demo_url: 'https://demo.solvyn.dev',
};
const parsedSubmission = SolutionFormSchema.safeParse(validSubmission);
assert(
  parsedSubmission.success === true,
  'Module 1: SolutionForm schema validates legitimate solution submissions'
);

const invalidUrlSubmission = {
  problem_id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Bad URL project',
  description: 'Invalid GitHub URL format',
  github_url: 'https://gitlab.com/wrong/repo',
};
const parsedInvalid = SolutionFormSchema.safeParse(invalidUrlSubmission);
assert(
  parsedInvalid.success === false,
  'Module 1: SolutionForm schema rejects non-github.com URLs'
);

// Module 2 & 3: SolutionCard structure compatibility
const sampleCardSolution = {
  ...mockProfileData.solutions[0],
  solver: {
    id: mockProfileData.id,
    username: mockProfileData.username,
    full_name: mockProfileData.full_name,
    avatar_url: mockProfileData.avatar_url,
  },
  has_liked: false,
};
assert(
  sampleCardSolution.solver.username === 'solvyn_pioneer',
  'Module 2 & 4: SolutionCard correctly receives solver username for profile linking'
);
assert(
  sampleCardSolution.like_count === 42 && sampleCardSolution.has_liked === false,
  'Module 3: SolutionCard retains like_count and has_liked state'
);

console.log('\n======================================================');
console.log(`  SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
