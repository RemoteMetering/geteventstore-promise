import EventFactory from './EventFactory.js';
import HTTPClient from './httpClient/index.js';
import TCPClient from './tcpClient/index.js';
import GRPCClient from './grpcClient/index.js';

import { eventTypeFilter, streamNameFilter, excludeSystemEvents } from '@kurrent/kurrentdb-client';

export {
	EventFactory,
	HTTPClient,
	TCPClient,
	GRPCClient,
	eventTypeFilter,
	streamNameFilter,
	excludeSystemEvents
};

export default {
	EventFactory,
	HTTPClient,
	TCPClient,
	GRPCClient,
	eventTypeFilter,
	streamNameFilter,
	excludeSystemEvents
};
