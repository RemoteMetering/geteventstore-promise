// Single source of truth for the older v21 (21.10.0) test image. Anything that must behave
// differently on that server keys off this one flag instead of reading process.env directly.
export const runningV21 = process.env.TESTS_V21 === 'true';

// Support folder name for the running server's compose files and certificates.
export const version = runningV21 ? 'v21' : 'lts';

// Suites and tests for features the 21.10.0 image lacks: run everywhere except on v21.
export const describeUnlessV21 = runningV21 ? describe.skip : describe;
export const itUnlessV21 = runningV21 ? it.skip : it;

// Suites and tests for behaviour only present on the v21 image: run only there.
export const describeOnlyV21 = runningV21 ? describe : describe.skip;
export const itOnlyV21 = runningV21 ? it : it.skip;
