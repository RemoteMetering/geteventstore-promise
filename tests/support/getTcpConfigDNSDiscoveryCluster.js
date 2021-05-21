export default () => ({
	protocol: 'discover',
	hostname: process.env.ES_HOST || 'localhost',
	port: process.env.RUN_TESTS_SECURE ? 2133 : 2117,
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
	}
});