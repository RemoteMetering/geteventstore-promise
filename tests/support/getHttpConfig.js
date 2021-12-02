export default () => ({
	protocol: global.runningTestsInSecureMode ? 'https' : 'http',
	hostname: process.env.ES_HOST || 'localhost',
	validateServer: !global.runningTestsInSecureMode,
	port: 22117,
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});