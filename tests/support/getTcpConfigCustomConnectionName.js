export default () => ({
	hostname: process.env.ES_HOST || 'localhost',
	port: 1116,
	useSslConnection: global.runningTestsInSecureMode,
	validateServer: !global.runningTestsInSecureMode,
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		autostart: false,
		max: 10,
		min: 0
	},
	connectionNameGenerator: () => `CUSTOM_TCP_CONNECTION_NAME_${new Date().getTime()}`
});