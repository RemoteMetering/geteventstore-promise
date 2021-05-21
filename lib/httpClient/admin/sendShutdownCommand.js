import debugModule from 'debug';

const debug = debugModule('geteventstore:sendShutdownCommand');

export default (config, httpClient) => async () => {
	const response = await httpClient.post(`${config.baseUrl}/admin/shutdown`);
	debug('', 'Response: %j', response.data);
	return response.data;
};