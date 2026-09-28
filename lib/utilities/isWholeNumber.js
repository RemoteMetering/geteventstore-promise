export default (value) =>
  typeof value === 'bigint' || Number.isSafeInteger(value) || (typeof value === 'string' && /^-?\d+$/.test(value));
