import getCaCertPath from './getCaCertPath.js';

export default () => ({
	hostname: process.env.ES_HOST || 'localhost',
	port: 22117,
	useSslConnection: global.runningTestsInSecureMode,
	tlsCAFile: global.runningTestsInSecureMode ? getCaCertPath('single') : undefined,
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
});