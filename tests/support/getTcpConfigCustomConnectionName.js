export default () => ({
	hostname: process.env.ES_HOST || 'localhost',
	port: 1116,
	useSslConnection: !!process.env.RUN_TESTS_SECURE,
	validateServer: !process.env.RUN_TESTS_SECURE,
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