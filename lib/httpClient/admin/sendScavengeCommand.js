import debugModule from 'debug';

const debug = debugModule('geteventstore:sendScavengeCommand');

export default (config, httpClient) => async () => {
	const response = await httpClient.post(`${config.baseUrl}/admin/scavenge`);
	debug('', 'Response: %j', response.data);
	return response.data;
};