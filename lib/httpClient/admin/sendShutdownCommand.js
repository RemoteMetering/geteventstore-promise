import req from 'request-promise';
import debugModule from 'debug';

const debug = debugModule('geteventstore:sendShutdownCommand');

export default (config) => async() => {
	const options = {
		uri: `${config.baseUrl}/admin/shutdown`,
		method: 'POST'
	};

	const response = await req(options);
	debug('', 'Response: %j', response);
	return response;
};