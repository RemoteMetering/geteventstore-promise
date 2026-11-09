// Translates the friendly StreamMetadata shape (shared with the gRPC client, e.g.
// maxAge / maxCount / truncateBefore / cacheControl / acl) into the raw system
// metadata document that the HTTP and TCP transports write to the metastream.
// Any non-system (custom) properties are passed through unchanged.

const aclKeyMap = {
  readRoles: '$r',
  writeRoles: '$w',
  deleteRoles: '$d',
  metaReadRoles: '$mr',
  metaWriteRoles: '$mw'
};

const systemKeyMap = {
  maxAge: '$maxAge',
  maxCount: '$maxCount',
  truncateBefore: '$tb',
  cacheControl: '$cacheControl'
};

const RAW_ACL_KEYS = new Set(Object.values(aclKeyMap));

const ensureInteger = (key, value) => {
  if (Number.isInteger(value)) return value;
  throw new Error(`Invalid stream metadata: "${key}" must be an integer.`);
};

const toRawAcl = (acl) => {
  // A string ACL ($userStreamAcl / $systemStreamAcl) is already raw, pass it through.
  if (typeof acl === 'string') return acl;
  if (acl === null || typeof acl !== 'object') {
    throw new Error('Invalid stream metadata: "acl" must be a string or an object of roles.');
  }

  const rawAcl = {};
  for (const [key, value] of Object.entries(acl)) {
    if (value === undefined) continue;
    // Friendly role names and their raw $ forms are both accepted. The server ignores anything
    // else, and the gRPC SDK drops it with a warning, so do the same rather than write it.
    const rawKey = aclKeyMap[key] || (RAW_ACL_KEYS.has(key) ? key : undefined);
    if (!rawKey) {
      console.warn(`Unknown key "${key}" in acl will be ignored`);
      continue;
    }
    rawAcl[rawKey] = value;
  }
  return rawAcl;
};

export default (metadata) => {
  const raw = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) continue;

    if (key === 'acl') {
      raw.$acl = toRawAcl(value);
    } else if (systemKeyMap[key]) {
      raw[systemKeyMap[key]] = ensureInteger(key, value);
    } else {
      // Custom / already-raw property, keep as-is.
      raw[key] = value;
    }
  }
  return raw;
};
