// The gRPC SDK types every revision, commit and prepare position, and the counters on subscription
// and projection info, as BigInt. BigInt has no JSON representation, so JSON.stringify throws
// "Do not know how to serialize a BigInt" on anything carrying one. Rather than narrowing the
// values and losing precision above 2^53, attach a non-enumerable toJSON that serialises them as
// decimal strings. Decimal strings round-trip, because every position accepting entry point in the
// client already calls BigInt() on what it is given.

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && (value.constructor === Object || value.constructor === undefined);

// Deep copy with every BigInt turned into a decimal string. Dates, typed arrays and Buffers come
// back untouched, so JSON.stringify keeps handling them the way it always has.
export const toPlainJson = (value) => {
  if (typeof value === 'bigint') return String(value);
  if (Array.isArray(value)) return value.map(toPlainJson);
  if (isPlainObject(value)) {
    const plain = {};
    for (const key of Object.keys(value)) plain[key] = toPlainJson(value[key]);
    return plain;
  }
  return value;
};

// Non-enumerable, so Object.keys, for...in and assert.deepStrictEqual see the shape they always did.
const defineToJson = (target, toJSON) =>
  Object.defineProperty(target, 'toJSON', { value: toJSON, configurable: true, writable: true });

// Attaches the hook without inspecting the value's contents, so no walk is needed to decide. The
// conversion in toPlainJson only runs if a caller actually stringifies. Returns the value, so it
// can wrap a return expression.
//
// The plain object and array guard is required, not cosmetic. Attaching to anything object-ish
// shadows Date.prototype.toJSON, and a Date would then serialise as {} instead of its ISO string.
export const jsonSafe = (value) => {
  if (!Array.isArray(value) && !isPlainObject(value)) return value;

  // A hook on the list does not cover an entry lifted out of it, and callers routinely take one
  // entry from an info list to serialise on its own. Entries get their own hook for that reason.
  // One level down only, never a walk of the whole object graph.
  if (Array.isArray(value)) for (const entry of value) jsonSafe(entry);

  return defineToJson(value, () => toPlainJson(value));
};

// A { commit, prepare } pair that keeps its BigInts but serialises as strings. Built fresh rather
// than mutating the position object the SDK handed us.
export const safePosition = (position) => {
  const safe = { commit: position.commit, prepare: position.prepare };
  return defineToJson(safe, () => ({ commit: String(safe.commit), prepare: String(safe.prepare) }));
};
