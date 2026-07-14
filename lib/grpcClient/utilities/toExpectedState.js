export default (expectedVersion) => [null, undefined, -2].includes(expectedVersion) ? 'any' : expectedVersion;
