export default () => ({
	useSslConnection: !!process.env.RUN_TESTS_SECURE,
	validateServer: !process.env.RUN_TESTS_SECURE,
	gossipSeeds: [
		{ hostname: process.env.ES_HOST || 'localhost', port: 2133 },
		{ hostname: process.env.ES_HOST || 'localhost', port: 2153 },
		{ hostname: process.env.ES_HOST || 'localhost', port: 2173 }
	],
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