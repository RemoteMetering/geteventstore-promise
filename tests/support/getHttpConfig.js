export default () => ({
	protocol: global.runningTestsInSecureMode ? 'https' : 'http',
	hostname: process.env.ES_HOST || 'localhost',
	allowInsecureSslCerts: global.runningTestsInSecureMode,
	port: 2117,
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});