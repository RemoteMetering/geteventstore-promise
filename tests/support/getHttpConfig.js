export default () => ({
	protocol: process.env.RUN_TESTS_SECURE ? 'https' : 'http',
	hostname: process.env.ES_HOST || 'localhost',
	allowInsecureSslCerts: !!global.runningTestsInSecureMode,
	port: 2117,
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});