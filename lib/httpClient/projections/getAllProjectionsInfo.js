import req from 'request-promise';
import debugModule from 'debug';

const debug = debugModule('geteventstore:getAllProjectionsInfo');

export default (config) => async() => {
	const options = {
		uri: `${config.baseUrl}/projections/all-non-transient`,
		method: 'GET',
		json: true
	};

	const response = await req(options);
	debug('', 'Response: %j', response);
	return response;
};