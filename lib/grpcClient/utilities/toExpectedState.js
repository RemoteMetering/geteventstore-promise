// Translates the HTTP and TCP expectedVersion sentinels into the SDK's stream states, so the same
// value means the same check on every client. -2 is Any, -1 is NoStream and -4 is StreamExists.
// Revisions and the SDK's own state strings pass through unchanged.
const SENTINELS = new Map([
  [-2, 'any'],
  [-1, 'no_stream'],
  [-4, 'stream_exists']
]);

export default (expectedVersion) => {
  if (expectedVersion == null) return 'any';
  return SENTINELS.get(expectedVersion) ?? expectedVersion;
};
