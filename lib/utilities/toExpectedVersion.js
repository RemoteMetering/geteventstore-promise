export const STATES = new Map([
  ['any', -2],
  ['no_stream', -1],
  ['stream_exists', -4]
]);
const SENTINELS = new Set(STATES.values());

export const parseExpectedVersion = (expectedVersion) => {
  if (expectedVersion == null) return -2;
  if (STATES.has(expectedVersion)) return STATES.get(expectedVersion);

  const isWhole =
    typeof expectedVersion === 'bigint' ||
    Number.isSafeInteger(expectedVersion) ||
    (typeof expectedVersion === 'string' && /^-?\d+$/.test(expectedVersion));
  if (isWhole) {
    // BigInt keeps revisions above 2^53 exact, which Number would round.
    const value = BigInt(expectedVersion);
    if (value >= 0n) return value;
    if (SENTINELS.has(Number(value))) return Number(value);
  }

  throw new Error(`Invalid expectedVersion: ${String(expectedVersion)}`);
};

export default (expectedVersion) => {
  const parsed = parseExpectedVersion(expectedVersion);
  if (typeof parsed === 'number') return parsed;
  if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`Invalid expectedVersion: ${String(expectedVersion)}`);
  return Number(parsed);
};
