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

		this.checkStreamExists = require('./checkStreamExists')(config);
		this.writeEvent = require('./writeEvent')(config);
		this.writeEvents = require('./writeEvents')(config);
		this.getAllStreamEvents = require('./getAllStreamEvents')(config);
		this.getEvents = require('./getEvents')(config);
		this.deleteStream = require('./deleteStream')(config);
		this.ping = require('./ping')(config);
		this.admin = {
			sendScavengeCommand: require('./admin/sendScavengeCommand')(_config),
			sendShutdownCommand: require('./admin/sendShutdownCommand')(_config)
		};
		this.projections = {
			start: require('./projections/start')(config),
			stop: require('./projections/stop')(config),
			reset: require('./projections/reset')(config),
			assert: require('./projections/assert')(config),
			remove: require('./projections/remove')(config),
			getState: require('./projections/getState')(config),
			getInfo: require('./projections/getInfo')(config),
			getAllProjectionsInfo: require('./projections/getAllProjectionsInfo')(config),
			disableAll: require('./projections/disableAll')(config),
			enableAll: require('./projections/enableAll')(config)
		};
		this.persistentSubscriptions = {
			assert: require('./persistentSubscriptions/assert')(config),
			remove: require('./persistentSubscriptions/remove')(config),
			getEvents: require('./persistentSubscriptions/getEvents')(config),
			getSubscriptionInfo: require('./persistentSubscriptions/getSubscriptionInfo')(config),
			getAllSubscriptionsInfo: require('./persistentSubscriptions/getAllSubscriptionsInfo')(config),
			getStreamSubscriptionsInfo: require('./persistentSubscriptions/getStreamSubscriptionsInfo')(config)
		};
	}
}