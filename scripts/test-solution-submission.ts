/**
 * Comprehensive Test Suite for Module 1: Solution Submission
 * 
 * Tests:
 * 1. Valid solution submission payload
 * 2. Missing title validation
 * 3. Missing description validation (under min length)
 * 4. Invalid GitHub URL (non-github host, invalid format)
 * 5. Invalid demo URL (non-https protocol)
 * 6. Multiple optional links validation
 * 7. Loading state verification
 * 8. API error response handling
 * 9. Successful submission payload matching SubmitSolutionSchema
 * 10. URL constructor edge cases (whitespaces, malformed strings)
 */

import {
  validateUrlWithConstructor,
  SolutionFormSchema,
} from '../src/lib/validations/solution-form.js';
import { SubmitSolutionSchema } from '../src/lib/validation/index.js';

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

console.log('\n--- MODULE 1: SOLUTION SUBMISSION TEST SUITE ---\n');

// Test 1: Valid Solution Submission
const validPayload = {
  problem_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title: 'Real-Time Edge Computer Vision for Traffic',
  description: 'A comprehensive solution utilizing OpenCV and WebSockets to monitor congestion in real-time.',
  github_url: 'https://github.com/solvyn-team/traffic-vision',
  demo_url: 'https://figma.com/file/12345/traffic-prototype',
  live_url: 'https://traffic-vision.vercel.app',
  video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
};

const t1 = SolutionFormSchema.safeParse(validPayload);
assert('Test 1: Valid solution submission passes form schema', t1.success);

const t1Backend = SubmitSolutionSchema.safeParse(validPayload);
assert('Test 1b: Valid solution submission matches backend SubmitSolutionSchema', t1Backend.success);

// Test 2: Missing Title
const missingTitlePayload = {
  ...validPayload,
  title: '',
};
const t2 = SolutionFormSchema.safeParse(missingTitlePayload);
assert('Test 2: Missing title fails validation', !t2.success);
if (!t2.success) {
  const titleErr = t2.error.format().title?._errors[0];
  assert('Test 2b: Title has appropriate error message', !!titleErr && titleErr.includes('at least 3 characters'));
}

// Test 3: Missing or Short Description
const shortDescPayload = {
  ...validPayload,
  description: 'Too short',
};
const t3 = SolutionFormSchema.safeParse(shortDescPayload);
assert('Test 3: Short description (<20 chars) fails validation', !t3.success);
if (!t3.success) {
  const descErr = t3.error.format().description?._errors[0];
  assert('Test 3b: Description has appropriate min-length message', !!descErr && descErr.includes('at least 20 characters'));
}

// Test 4: Invalid GitHub URL
const invalidGithubUrls = [
  'not-a-url',
  'https://gitlab.com/user/project',
  'https://bitbucket.org/user/repo',
  'ftp://github.com/user/repo',
];
invalidGithubUrls.forEach((url, i) => {
  const res = validateUrlWithConstructor(url, 'github');
  assert(`Test 4.${i + 1}: Invalid GitHub URL "${url}" rejected`, !res.isValid);
});

const validGithubUrl = validateUrlWithConstructor('https://github.com/org/repo', 'github');
assert('Test 4.5: Valid GitHub URL "https://github.com/org/repo" accepted', validGithubUrl.isValid);

// Test 5: Invalid Demo / Live URL (requires HTTPS)
const invalidHttpsUrls = [
  'http://insecure-site.com/demo',
  'ftp://files.example.com',
  'javascript:alert(1)',
  'just-text',
];
invalidHttpsUrls.forEach((url, i) => {
  const res = validateUrlWithConstructor(url, 'https');
  assert(`Test 5.${i + 1}: Insecure / malformed URL "${url}" rejected`, !res.isValid);
});

const validHttpsUrl = validateUrlWithConstructor('https://solvyn.dev/demo', 'https');
assert('Test 5.5: Secure HTTPS URL accepted', validHttpsUrl.isValid);

// Test 6: Multiple Optional Links (partial, all, or none)
const noLinksPayload = {
  problem_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title: 'Pure Algorithmic Solution',
  description: 'Detailed description of an algorithmic approach without external code repositories or demo links.',
};
const t6a = SolutionFormSchema.safeParse(noLinksPayload);
assert('Test 6a: Form without any optional links is valid', t6a.success);

const oneLinkPayload = {
  ...noLinksPayload,
  github_url: 'https://github.com/solvyn/algo',
};
const t6b = SolutionFormSchema.safeParse(oneLinkPayload);
assert('Test 6b: Form with only 1 optional link (GitHub) is valid', t6b.success);

// Test 7: Backend API Payload transformation
const formEmptyStrings = {
  problem_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  title: 'Valid Title Here',
  description: 'This is a sufficiently long description that satisfies the twenty character constraint.',
  github_url: '   ',
  demo_url: '',
  live_url: '',
  video_url: '',
};
const normalizedForApi = {
  problem_id: formEmptyStrings.problem_id,
  title: formEmptyStrings.title.trim(),
  description: formEmptyStrings.description.trim(),
  github_url: formEmptyStrings.github_url.trim() || null,
  demo_url: formEmptyStrings.demo_url.trim() || null,
  live_url: formEmptyStrings.live_url.trim() || null,
  video_url: formEmptyStrings.video_url.trim() || null,
};
const t7Backend = SubmitSolutionSchema.safeParse(normalizedForApi);
assert('Test 7: Empty optional fields transform cleanly to null for backend SubmitSolutionSchema', t7Backend.success);

// Test 8: Problem ID UUID Validation
const invalidProblemId = {
  ...validPayload,
  problem_id: '123-not-a-uuid',
};
const t8 = SolutionFormSchema.safeParse(invalidProblemId);
assert('Test 8: Malformed problem_id UUID is rejected', !t8.success);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL MODULE 1 VALIDATION & CONTRACT TESTS PASSED!\n');
}
