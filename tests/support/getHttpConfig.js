export default () => ({
	protocol: process.env.RUN_TESTS_SECURE ? 'https' : 'http',
	hostname: process.env.ES_HOST || 'localhost',
	allowInsecureSslCerts: !!process.env.RUN_TESTS_SECURE,
	port: process.env.RUN_TESTS_SECURE ? 2127 : 2117,
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});