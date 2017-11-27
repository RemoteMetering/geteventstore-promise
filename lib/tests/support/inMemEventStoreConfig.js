export default {
	cluster: process.env.ES_CLUSTER || 'C:/EventStore/EventStore.ClusterNode.exe',
	testsUseDocker: process.env.TEST_USE_DOCKER === 'true',
	dockerContainerName: 'Test_EventStore',
	options: {
		host: process.env.ES_HOST || 'localhost',
		intTcpPort: 1116,
		extTcpPort: 2116,
		intHttpPort: 1117,
		extHttpPort: 2117
	},
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
};