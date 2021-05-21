export default () => ({
	hostname: process.env.ES_HOST || 'localhost',
	port: process.env.RUN_TESTS_SECURE ? 1126 : 1116,
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