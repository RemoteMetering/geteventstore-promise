import path from 'path';

export default () => ({
	protocol: 'esdb+discover',
	hostname: process.env.ES_HOST || 'localhost',
	port: 22137,
	useSslConnection: global.runningTestsInSecureMode,
	tlsCAFile: global.runningTestsInSecureMode ? path.resolve(__dirname, './cluster/certs/ca/ca.crt') : undefined,
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		autostart: false,
		max: 10,
		min: 0
	}
});