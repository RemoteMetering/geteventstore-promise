import EventFactory from './EventFactory';
import HTTPClient from './httpClient';
import TCPClient from './tcpClient';

const eventFactory = {
	NewEvent: function () {
		console.warn(`WARNING: geteventstore-promise - 'eventFactory.NewEvent(...)' has been deprecated (planned removal in 4.0). Please use 'new EventFactory(config).newEvent(...)' instead.`);
		return new EventFactory().newEvent.apply(this, arguments);
	}
};
const http = (config) => {
	console.warn(`WARNING: geteventstore-promise - 'http(config)' has been deprecated (planned removal in 4.0). Please use 'new HTTPClient(config)' instead.`);
	return new HTTPClient(config);
};
const tcp = (config) => {
	console.warn(`WARNING: geteventstore-promise - 'tcp(config)' has been deprecated (planned removal in 4.0). Please use 'new TCPClient(config)' instead.`);
	return new TCPClient(config);
};

export {
	EventFactory,
	HTTPClient,
	TCPClient,
	eventFactory,
	http,
	tcp
};

export default {
	EventFactory,
	HTTPClient,
	TCPClient,
	eventFactory,
	http,
	tcp
};