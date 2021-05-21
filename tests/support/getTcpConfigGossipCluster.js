export default () => ({
	useSslConnection: !!process.env.RUN_TESTS_SECURE,
	validateServer: !process.env.RUN_TESTS_SECURE,
	gossipSeeds: [
		{ hostname: process.env.ES_HOST || 'localhost', port: 2137 },
		{ hostname: process.env.ES_HOST || 'localhost', port: 2157 },
		{ hostname: process.env.ES_HOST || 'localhost', port: 2177 }
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