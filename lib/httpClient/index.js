import persistentSubscriptionGetStreamSubscriptionsInfo from './persistentSubscriptions/getStreamSubscriptionsInfo';
import persistentSubscriptionGetAllSubscriptionsInfo from './persistentSubscriptions/getAllSubscriptionsInfo';
import persistentSubscriptionGetSubscriptionInfo from './persistentSubscriptions/getSubscriptionInfo';
import persistentSubscriptionGetEvents from './persistentSubscriptions/getEvents';
import projectionGetAllProjectionsInfo from './projections/getAllProjectionsInfo';
import persistentSubscriptionAssert from './persistentSubscriptions/assert';
import persistentSubscriptionRemove from './persistentSubscriptions/remove';
import sendScavengeCommand from './admin/sendScavengeCommand';
import sendShutdownCommand from './admin/sendShutdownCommand';
import projectionDisableAll from './projections/disableAll';
import projectionEnableAll from './projections/enableAll';
import projectionGetState from './projections/getState';
import getAllStreamEvents from './getAllStreamEvents';
import projectionGetInfo from './projections/getInfo';
import checkStreamExists from './checkStreamExists';
import projectionAssert from './projections/assert';
import projectionRemove from './projections/remove';
import projectionStart from './projections/start';
import projectionReset from './projections/reset';
import projectionStop from './projections/stop';
import getEventsByType from './getEventsByType';
import deleteStream from './deleteStream';
import writeEvents from './writeEvents';
import writeEvent from './writeEvent';
import readEvents from './readEvents';
import getEvents from './getEvents';
import assert from 'assert';
import ping from './ping';
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

		const _getAllProjectionsInfo = projectionGetAllProjectionsInfo(_config);
		const _startProjection = projectionStart(_config);
		const _stopProjection = projectionStop(_config);

		this.checkStreamExists = checkStreamExists(_config);
		this.writeEvent = writeEvent(_config);
		this.writeEvents = writeEvents(_config);
		this.getAllStreamEvents = getAllStreamEvents(_config);
		this.readEventsForward = readEvents(_config, 'forward');
		this.readEventsBackward = readEvents(_config, 'backward');
		this.getEvents = getEvents(this.readEventsForward, this.readEventsBackward);
		this.getEventsByType = getEventsByType(this.getEvents);
		this.deleteStream = deleteStream(_config, this.checkStreamExists);
		this.ping = ping(_config);
		this.admin = {
			scavenge: sendScavengeCommand(_config),
			shutdown: sendShutdownCommand(_config)
		};
		this.projections = {
			start: _startProjection,
			stop: _stopProjection,
			reset: projectionReset(_config),
			remove: projectionRemove(_config),
			getAllProjectionsInfo: _getAllProjectionsInfo,
			getState: projectionGetState(_config),
			getInfo: projectionGetInfo(_getAllProjectionsInfo),
			assert: projectionAssert(_config, _getAllProjectionsInfo),
			disableAll: projectionDisableAll(_getAllProjectionsInfo, _stopProjection),
			enableAll: projectionEnableAll(_getAllProjectionsInfo, _startProjection)
		};
		this.persistentSubscriptions = {
			assert: persistentSubscriptionAssert(_config),
			remove: persistentSubscriptionRemove(_config),
			getEvents: persistentSubscriptionGetEvents(_config),
			getSubscriptionInfo: persistentSubscriptionGetSubscriptionInfo(_config),
			getAllSubscriptionsInfo: persistentSubscriptionGetAllSubscriptionsInfo(_config),
			getStreamSubscriptionsInfo: persistentSubscriptionGetStreamSubscriptionsInfo(_config)
		};
	}
}