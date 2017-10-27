import req from 'request-promise';
import debugModule from 'debug';
import url from 'url';

const debug = debugModule('geteventstore:sendShutdownCommand');

export default (config) => {
	const buildUrl = () => {
		const urlObj = JSON.parse(JSON.stringify(config));
		urlObj.pathname = '/admin/shutdown';
		return url.format(urlObj);
	};

	return async() => {
		const options = {
			uri: buildUrl(),
			method: 'POST'
		};

		const response = await req(options);
		debug('', 'Response: %j', response);
		return response;
	};
};