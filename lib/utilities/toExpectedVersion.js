const STATES = new Map([
  ['any', -2],
  ['no_stream', -1],
  ['stream_exists', -4]
]);

export default (expectedVersion) => {
  if (expectedVersion == null) return -2;
  if (STATES.has(expectedVersion)) return STATES.get(expectedVersion);

  // A bigint or a decimal string is how a gRPC JsonSafe result carries a revision.
  const revision =
    typeof expectedVersion === 'bigint' || (typeof expectedVersion === 'string' && /^-?\d+$/.test(expectedVersion))
      ? Number(expectedVersion)
      : expectedVersion;
  if (Number.isSafeInteger(revision) && (revision >= 0 || [...STATES.values()].includes(revision))) return revision;

  throw new Error(`Invalid expectedVersion: ${String(expectedVersion)}`);
};
