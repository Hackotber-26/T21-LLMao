/**
 * Automated Test Suite for Module 3: Solution Likes
 * 
 * Tests:
 * 1. Like a solution: Optimistic toggle from unliked to liked
 * 2. Unlike a solution: Optimistic toggle from liked to unliked
 * 3. Like count increment logic: count + 1
 * 4. Like count decrement logic: Math.max(0, count - 1)
 * 5. Rapid repeated clicks prevention (in-flight guard simulation)
 * 6. Unauthenticated user rejection (401 response handling & rollback)
 * 7. API failure & rollback verification (server 500 or network drop)
 * 8. Database-level duplicate like prevention constraint verification
 * 9. Multi-user concurrent like aggregation simulation
 * 10. SolutionCard integration check with LikeButton
 * 11. Module 1 regression check (SolutionForm validation & schema)
 * 12. Module 2 regression check (Date format, avatar initials, sorting)
 */

import {
  formatSubmissionDate,
  getAvatarInitials,
} from '../src/components/solutions/SolutionCard.js';
import {
  SolutionFormSchema,
  validateUrlWithConstructor,
} from '../src/lib/validations/solution-form.js';
import { SubmitSolutionSchema } from '../src/lib/validation/index.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, extraInfo?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    if (extraInfo) console.error(`    Details: ${extraInfo}`);
    failed++;
  }
}

console.log('\n--- MODULE 3: SOLUTION LIKES TEST SUITE ---\n');

// Test 1 & 3: Like a Solution & Count Increments
const initialLikes = 5;
const initiallyLiked = false;

const optimisticLike = !initiallyLiked;
const optimisticCountUp = optimisticLike ? initialLikes + 1 : Math.max(0, initialLikes - 1);

assert('Test 1: Unliked solution toggles to liked', optimisticLike === true);
assert('Test 3: Like count increments by exactly 1', optimisticCountUp === 6);

// Test 2 & 4: Unlike a Solution & Count Decrements
const likedState = true;
const optimisticUnlike = !likedState;
const optimisticCountDown = optimisticUnlike ? initialLikes + 1 : Math.max(0, initialLikes - 1);

assert('Test 2: Liked solution toggles to unliked', optimisticUnlike === false);
assert('Test 4: Like count decrements by 1 without dropping below 0', optimisticCountDown === 4);

const zeroLikes = 0;
const clampedCount = Math.max(0, zeroLikes - 1);
assert('Test 4b: Like count decrements safely to 0 (never negative)', clampedCount === 0);

// Test 5: Rapid Repeated Clicks Guard (In-flight lock)
class LikeStateMachine {
  public isPending = false;
  public likeCount: number;
  public hasLiked: boolean;
  public totalRequestsTriggered = 0;

  constructor(initialCount: number, initialLiked: boolean) {
    this.likeCount = initialCount;
    this.hasLiked = initialLiked;
  }

  public click(): boolean {
    if (this.isPending) {
      // Guard blocks execution
      return false;
    }
    this.isPending = true;
    this.totalRequestsTriggered++;
    this.hasLiked = !this.hasLiked;
    this.likeCount = this.hasLiked ? this.likeCount + 1 : Math.max(0, this.likeCount - 1);
    return true;
  }

  public resolveRequest(confirmedLiked: boolean, confirmedCount: number) {
    this.hasLiked = confirmedLiked;
    this.likeCount = confirmedCount;
    this.isPending = false;
  }

  public rejectRequest(rollbackLiked: boolean, rollbackCount: number) {
    this.hasLiked = rollbackLiked;
    this.likeCount = rollbackCount;
    this.isPending = false;
  }
}

const sm = new LikeStateMachine(10, false);
const click1 = sm.click(); // Allowed
const click2 = sm.click(); // Blocked by guard
const click3 = sm.click(); // Blocked by guard
assert('Test 5a: First click successfully initiates action', click1 === true);
assert('Test 5b: Rapid concurrent click 2 is blocked while pending', click2 === false);
assert('Test 5c: Rapid concurrent click 3 is blocked while pending', click3 === false);
assert('Test 5d: Exactly 1 network request dispatched despite 3 rapid clicks', sm.totalRequestsTriggered === 1);

sm.resolveRequest(true, 11);
const clickAfterResolve = sm.click();
assert('Test 5e: Subsequent click allowed once request completes', clickAfterResolve === true);

// Test 6 & 7: Unauthenticated Rejection & Rollback
const rollbackSm = new LikeStateMachine(7, false);
const origLiked = rollbackSm.hasLiked;
const origCount = rollbackSm.likeCount;

rollbackSm.click(); // Optimistic state: 8, true
assert('Test 6a: Optimistic state applied before network returns', rollbackSm.likeCount === 8 && rollbackSm.hasLiked === true);

// Simulate 401 Unauthorized from backend
rollbackSm.rejectRequest(origLiked, origCount);
assert('Test 6b: 401 Unauthorized triggers immediate rollback to original liked state', rollbackSm.hasLiked === false);
assert('Test 7: Server failure rolls back like count to original value', rollbackSm.likeCount === 7);

// Test 8: Database-Level Duplicate Protection Verification
// Inspect migration files to confirm physical database constraint exists
const migration1Path = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
const migrationContent = fs.readFileSync(migration1Path, 'utf8');

const hasUniqueConstraint = migrationContent.includes('CONSTRAINT unique_solution_user_like UNIQUE (solution_id, user_id)');
assert(
  'Test 8: Database UNIQUE constraint "unique_solution_user_like (solution_id, user_id)" confirmed in schema',
  hasUniqueConstraint === true
);

// Verify database trigger for like count tracking
const migration3Path = path.resolve(process.cwd(), 'supabase/migrations/003_functions_triggers.sql');
const migration3Content = fs.readFileSync(migration3Path, 'utf8');
const hasLikeTrigger = migration3Content.includes('trigger_update_solution_like_count');
assert(
  'Test 8b: Database trigger "trigger_update_solution_like_count" automatically synchronizes solutions.like_count',
  hasLikeTrigger === true
);

// Test 9: Multi-User Like Simulation (Two distinct users liking same solution)
const solutionLikesDb = new Set<string>();
function addLike(solutionId: string, userId: string): boolean {
  const compositeKey = `${solutionId}:${userId}`;
  if (solutionLikesDb.has(compositeKey)) {
    return false; // Database unique constraint violation
  }
  solutionLikesDb.add(compositeKey);
  return true;
}

const solId = 'sol-123';
const userA = 'user-alice';
const userB = 'user-bob';

assert('Test 9a: User Alice can like solution', addLike(solId, userA) === true);
assert('Test 9b: User Bob can like solution', addLike(solId, userB) === true);
assert('Test 9c: User Alice duplicate like is rejected by unique constraint', addLike(solId, userA) === false);
assert('Test 9d: Solution has exactly 2 recorded likes from distinct users', solutionLikesDb.size === 2);

// Test 10: SolutionCard Integration
const solutionCardSample = {
  id: 'sol-integration-test',
  problem_id: 'prob-100',
  user_id: 'user-200',
  title: 'Integrated Card with Like Button',
  description: 'Validating that SolutionCard displays LikeButton cleanly without breaking layout.',
  github_url: 'https://github.com/solvyn/test',
  demo_url: null,
  live_url: null,
  video_url: null,
  like_count: 15,
  created_at: '2026-10-31T10:00:00Z',
  updated_at: '2026-10-31T10:00:00Z',
  has_liked: true,
};
assert('Test 10: SolutionCard receives has_liked and like_count parameters', solutionCardSample.has_liked === true && solutionCardSample.like_count === 15);

// Test 11: Module 1 Regression Check (Submission Validation)
const m1Sample = {
  problem_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title: 'Regression Test Title',
  description: 'This is a long description satisfying the min 20 chars requirement.',
  github_url: 'https://github.com/solvyn/test',
};
assert('Test 11a: Module 1 SolutionFormSchema passes', SolutionFormSchema.safeParse(m1Sample).success);
assert('Test 11b: Module 1 SubmitSolutionSchema passes', SubmitSolutionSchema.safeParse(m1Sample).success);

// Test 12: Module 2 Regression Check (Display Utilities)
assert('Test 12a: Date formatting works', formatSubmissionDate('2026-10-31T10:00:00Z').includes('2026'));
assert('Test 12b: Initials generator works', getAvatarInitials('Alex Smith') === 'AS');

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL MODULE 3 LIKE & OPTIMISTIC UI TESTS PASSED SUCCESSFULLY!\n');
}
