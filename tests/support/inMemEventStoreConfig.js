export default {
	executable: process.env.ES_EXECUTABLE || 'C:/EventStore/EventStore.ClusterNode.exe',
	testsUseDocker: process.env.TEST_USE_DOCKER === 'true',
	dockerContainerName: 'Test_EventStore',
	options: {
		host: process.env.ES_HOST || 'localhost',
		intTcpPort: 1113,
		extTcpPort: 1116,
		intHttpPort: 2113,
		extHttpPort: 2117
	},
	credentials: {
		username: 'admin',
		password: 'changeit'
	}
};