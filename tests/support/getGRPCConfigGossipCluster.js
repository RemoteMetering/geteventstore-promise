import getCaCertPath from './getCaCertPath.js';

export default () => ({
	useSslConnection: global.runningTestsInSecureMode,
	tlsCAFile: global.runningTestsInSecureMode ? getCaCertPath('cluster') : undefined,
	gossipSeeds: [
		{ hostname: process.env.ES_HOST || 'localhost', port: 22137 },
		{ hostname: process.env.ES_HOST || 'localhost', port: 22157 },
		{ hostname: process.env.ES_HOST || 'localhost', port: 22177 }
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