// -2 is ExpectedVersion.Any on the HTTP and TCP protocols.
export default (expectedVersion) => (Number.isInteger(expectedVersion) ? expectedVersion : -2);
