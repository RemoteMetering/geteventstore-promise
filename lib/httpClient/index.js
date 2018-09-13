import assert from 'assert';
import url from 'url';

const baseErr = 'geteventstore-promise - HTTP client - ';

export default class HTTPClient {
	constructor(config) {
		assert(config, `${baseErr}config not provided`);
		assert(config.hostname, `${baseErr}hostname property not provided`);
		assert(config.port, `${baseErr}port property not provided`);
		assert(config.credentials, `${baseErr}credentials property not provided`);
		assert(config.credentials.username, `${baseErr}credentials.username property not provided`);
		assert(config.credentials.password, `${baseErr}credentials.password property not provided`);
		if (config.timeout) assert(typeof config.timeout === 'number', `${baseErr}timeout not defined`);

		//Add additional internal configuration properties
		const _config = JSON.parse(JSON.stringify(config));
		_config.protocol = 'http';
		_config.auth = `${_config.credentials.username}:${_config.credentials.password}`;
		_config.baseUrl = url.format(_config);

		this.checkStreamExists = require('./checkStreamExists')(_config);
		this.writeEvent = require('./writeEvent')(_config);
		this.writeEvents = require('./writeEvents')(_config);
		this.getAllStreamEvents = require('./getAllStreamEvents')(_config);
		this.getEvents = require('./getEvents')(_config);
		this.deleteStream = require('./deleteStream')(_config);
		this.ping = require('./ping')(_config);
		this.admin = {
			scavenge: require('./admin/sendScavengeCommand')(_config),
			shutdown: require('./admin/sendShutdownCommand')(_config)
		};
		this.projections = {
			start: require('./projections/start')(_config),
			stop: require('./projections/stop')(_config),
			reset: require('./projections/reset')(_config),
			assert: require('./projections/assert')(_config),
			remove: require('./projections/remove')(_config),
			getState: require('./projections/getState')(_config),
			getInfo: require('./projections/getInfo')(_config),
			getAllProjectionsInfo: require('./projections/getAllProjectionsInfo')(_config),
			disableAll: require('./projections/disableAll')(_config),
			enableAll: require('./projections/enableAll')(_config)
		};
		this.persistentSubscriptions = {
			assert: require('./persistentSubscriptions/assert')(_config),
			remove: require('./persistentSubscriptions/remove')(_config),
			getEvents: require('./persistentSubscriptions/getEvents')(_config),
			getSubscriptionInfo: require('./persistentSubscriptions/getSubscriptionInfo')(_config),
			getAllSubscriptionsInfo: require('./persistentSubscriptions/getAllSubscriptionsInfo')(_config),
			getStreamSubscriptionsInfo: require('./persistentSubscriptions/getStreamSubscriptionsInfo')(_config)
		};
	}
}