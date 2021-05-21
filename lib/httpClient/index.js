import persistentSubscriptionGetStreamSubscriptionsInfo from './persistentSubscriptions/getStreamSubscriptionsInfo';
import persistentSubscriptionGetAllSubscriptionsInfo from './persistentSubscriptions/getAllSubscriptionsInfo';
import persistentSubscriptionGetSubscriptionInfo from './persistentSubscriptions/getSubscriptionInfo';
import persistentSubscriptionGetEvents from './persistentSubscriptions/getEvents';
import projectionGetAllProjectionsInfo from './projections/getAllProjectionsInfo';
import persistentSubscriptionAssert from './persistentSubscriptions/assert';
import persistentSubscriptionRemove from './persistentSubscriptions/remove';
import sendScavengeCommand from './admin/sendScavengeCommand';
import sendShutdownCommand from './admin/sendShutdownCommand';
import createHttpClient from '../utilities/createHttpClient';
import projectionDisableAll from './projections/disableAll';
import projectionEnableAll from './projections/enableAll';
import projectionGetState from './projections/getState';
import projectionGetResult from './projections/getResult';
import getAllStreamEvents from './getAllStreamEvents';
import projectionGetInfo from './projections/getInfo';
import checkStreamExists from './checkStreamExists';
import projectionAssert from './projections/assert';
import projectionRemove from './projections/remove';
import projectionConfig from './projections/config';
import projectionStart from './projections/start';
import projectionReset from './projections/reset';
import projectionStop from './projections/stop';
import getEventsByType from './getEventsByType';
import deleteStream from './deleteStream';
import writeEvents from './writeEvents';
import writeEvent from './writeEvent';
import readEvents from './readEvents';
import getEvents from './getEvents';
import ping from './ping';

import cloneDeep from 'lodash.clonedeep';
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
		const _config = cloneDeep(config);
		_config.protocol = _config.protocol || 'http';
		_config.auth = `${_config.credentials.username}:${_config.credentials.password}`;
		_config.baseUrl = url.format(_config);

		const httpClient = createHttpClient(_config);

		const _getAllProjectionsInfo = projectionGetAllProjectionsInfo(_config, httpClient);
		const _getConfig = projectionConfig(_config, httpClient);
		const _startProjection = projectionStart(_config, httpClient);
		const _stopProjection = projectionStop(_config, httpClient);

		this.checkStreamExists = checkStreamExists(_config, httpClient);
		this.writeEvent = writeEvent(_config, httpClient);
		this.writeEvents = writeEvents(_config, httpClient);
		this.getAllStreamEvents = getAllStreamEvents(_config, httpClient);
		this.readEventsForward = readEvents(_config, httpClient, 'forward');
		this.readEventsBackward = readEvents(_config, httpClient, 'backward');
		this.getEvents = getEvents(this.readEventsForward, this.readEventsBackward);
		this.getEventsByType = getEventsByType(this.getEvents);
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
			enableAll: projectionEnableAll(_getAllProjectionsInfo, _startProjection)
		};
		this.persistentSubscriptions = {
			assert: persistentSubscriptionAssert(_config, httpClient),
			remove: persistentSubscriptionRemove(_config, httpClient),
			getEvents: persistentSubscriptionGetEvents(_config, httpClient),
			getSubscriptionInfo: persistentSubscriptionGetSubscriptionInfo(_config, httpClient),
			getAllSubscriptionsInfo: persistentSubscriptionGetAllSubscriptionsInfo(_config, httpClient),
			getStreamSubscriptionsInfo: persistentSubscriptionGetStreamSubscriptionsInfo(_config, httpClient)
		};
	}
}