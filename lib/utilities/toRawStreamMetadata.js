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

const toRawAcl = (acl) => {
	// A string ACL ($userStreamAcl / $systemStreamAcl) is already raw, pass it through.
	if (typeof acl === 'string') return acl;

	const rawAcl = {};
	for (const [friendlyKey, value] of Object.entries(acl)) {
		if (value === undefined) continue;
		rawAcl[aclKeyMap[friendlyKey] || friendlyKey] = value;
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
			raw[systemKeyMap[key]] = value;
		} else {
			// Custom / already-raw property, keep as-is.
			raw[key] = value;
		}
	}
	return raw;
};
