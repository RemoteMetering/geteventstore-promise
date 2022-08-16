export default () => ({
	protocol: 'esdb+discover',
	hostname: process.env.ES_HOST || 'localhost',
	port: 22137,
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
	}
});