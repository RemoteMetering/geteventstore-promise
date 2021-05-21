export default () => ({
	useSslConnection: global.runningTestsInSecureMode,
	validateServer: !global.runningTestsInSecureMode,
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