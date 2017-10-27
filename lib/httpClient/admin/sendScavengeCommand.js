import req from 'request-promise';
import debugModule from 'debug';

const debug = debugModule('geteventstore:sendScavengeCommand');

export default (config) => async() => {
	const options = {
		uri: `${config.baseUrl}/admin/scavenge`,
		method: 'POST'
	};

	const response = await req(options);
	debug('', 'Response: %j', response);
	return response;
};