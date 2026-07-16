import persistentSubscriptionGetStreamSubscriptionsInfo from './persistentSubscriptions/getStreamSubscriptionsInfo.js';
import persistentSubscriptionGetAllSubscriptionsInfo from './persistentSubscriptions/getAllSubscriptionsInfo.js';
import persistentSubscriptionGetSubscriptionInfo from './persistentSubscriptions/getSubscriptionInfo.js';
import persistentSubscriptionGetEvents from './persistentSubscriptions/getEvents.js';
import projectionGetAllProjectionsInfo from './projections/getAllProjectionsInfo.js';
import persistentSubscriptionAssert from './persistentSubscriptions/assert.js';
import persistentSubscriptionRemove from './persistentSubscriptions/remove.js';
import persistentSubscriptionRestartSubsystem from './persistentSubscriptions/restartSubsystem.js';
import sendScavengeCommand from './admin/sendScavengeCommand.js';
import sendShutdownCommand from './admin/sendShutdownCommand.js';
import createHttpClient from '../utilities/createHttpClient.js';
import projectionDisableAll from './projections/disableAll.js';
import projectionEnableAll from './projections/enableAll.js';
import projectionGetState from './projections/getState.js';
import projectionGetResult from './projections/getResult.js';
import iterateAllStreamEvents from './iterateAllStreamEvents.js';
import iterateEventsByType from '../utilities/iterateEventsByType.js';
import iterateReadEvents from './iterateReadEvents.js';
import iterateEvents from '../utilities/iterateEvents.js';
import buffered from '../utilities/buffered.js';
import projectionGetInfo from './projections/getInfo.js';
import checkStreamExists from './checkStreamExists.js';
import projectionAssert from './projections/assert.js';
import projectionRemove from './projections/remove.js';
import projectionConfig from './projections/config.js';
import projectionStart from './projections/start.js';
import projectionReset from './projections/reset.js';
import projectionStop from './projections/stop.js';
import projectionRestartSubsystem from './projections/restartSubsystem.js';
import setStreamMetadata from './setStreamMetadata.js';
import deleteStream from './deleteStream.js';
import writeEvents from './writeEvents.js';
import writeEvent from './writeEvent.js';
import readEvents from './readEvents.js';
import ping from './ping.js';

import cloneDeep from 'lodash.clonedeep';
import assert from 'assert';
import url from 'url';

const baseErr = 'HTTP client - ';

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
		const _config = cloneDeep(config);
		_config.protocol = _config.protocol || 'http';
		_config.auth = `${_config.credentials.username}:${_config.credentials.password}`;
		_config.baseUrl = url.format(_config);
		if (_config.protocol === 'https') _config.validateServer = _config.validateServer === undefined || _config.validateServer === null ? true : _config.validateServer;

		const httpClient = createHttpClient(_config);

		const _getAllProjectionsInfo = projectionGetAllProjectionsInfo(_config, httpClient);
		const _getConfig = projectionConfig(_config, httpClient);
		const _startProjection = projectionStart(_config, httpClient);
		const _stopProjection = projectionStop(_config, httpClient);

		this.checkStreamExists = checkStreamExists(_config, httpClient);
		this.setStreamMetadata = setStreamMetadata(_config, httpClient);
		this.writeEvent = writeEvent(_config, httpClient);
		this.writeEvents = writeEvents(_config, httpClient);
		// Async iterators are the primitives, the buffering get* methods below collect from them
		this.iterateAllStreamEvents = iterateAllStreamEvents(_config, httpClient);
		this.iterateEventsForward = iterateReadEvents(_config, httpClient, 'forward');
		this.iterateEventsBackward = iterateReadEvents(_config, httpClient, 'backward');
		this.iterateEvents = iterateEvents(this.iterateEventsForward, this.iterateEventsBackward);
		this.iterateEventsByType = iterateEventsByType(this.iterateEvents);

		this.getAllStreamEvents = buffered(this.iterateAllStreamEvents);
		this.readEventsForward = readEvents(_config, httpClient, 'forward');
		this.readEventsBackward = readEvents(_config, httpClient, 'backward');
		this.getEvents = buffered(this.iterateEvents);
		this.getEventsByType = buffered(this.iterateEventsByType);
		this.deleteStream = deleteStream(_config, httpClient, this.checkStreamExists);
		this.ping = ping(_config, httpClient);
		this.admin = {
			scavenge: sendScavengeCommand(_config, httpClient),
			shutdown: sendShutdownCommand(_config, httpClient)
		};
		this.projections = {
			start: _startProjection,
			stop: _stopProjection,
			reset: projectionReset(_config, httpClient),
			remove: projectionRemove(_config, httpClient),
			getAllProjectionsInfo: _getAllProjectionsInfo,
			getState: projectionGetState(_config, httpClient),
			getResult: projectionGetResult(_config, httpClient),
			config: projectionConfig(_config, httpClient),
			getInfo: projectionGetInfo(_getAllProjectionsInfo, _getConfig),
			assert: projectionAssert(_config, httpClient, _getAllProjectionsInfo),
			disableAll: projectionDisableAll(_getAllProjectionsInfo, _stopProjection),
			enableAll: projectionEnableAll(_getAllProjectionsInfo, _startProjection),
			restartSubsystem: projectionRestartSubsystem(_config, httpClient)
		};
		this.persistentSubscriptions = {
			assert: persistentSubscriptionAssert(_config, httpClient),
			remove: persistentSubscriptionRemove(_config, httpClient),
			getEvents: persistentSubscriptionGetEvents(_config, httpClient),
			getSubscriptionInfo: persistentSubscriptionGetSubscriptionInfo(_config, httpClient),
			getAllSubscriptionsInfo: persistentSubscriptionGetAllSubscriptionsInfo(_config, httpClient),
			getStreamSubscriptionsInfo: persistentSubscriptionGetStreamSubscriptionsInfo(_config, httpClient),
			restartSubsystem: persistentSubscriptionRestartSubsystem(_config, httpClient)
		};
	}
}