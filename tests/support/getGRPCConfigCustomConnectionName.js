import path from 'path';

export default () => ({
	hostname: process.env.ES_HOST || 'localhost',
	port: 22117,
	useSslConnection: global.runningTestsInSecureMode,
	tlsCAFile: global.runningTestsInSecureMode ? path.resolve(__dirname, './single/certs/ca/ca.crt') : undefined,
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		autostart: false,
		max: 10,
		min: 0
	},
	connectionNameGenerator: () => `CUSTOM_GRPC_CONNECTION_NAME_${new Date().getTime()}`
});