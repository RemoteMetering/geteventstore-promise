import './_globalHooks.js';

import getGRPCConfigDNSDiscoveryCluster from './support/getGRPCConfigDNSDiscoveryCluster.js';
import getGRPCConfigGossipCluster from './support/getGRPCConfigGossipCluster.js';
import generateEventId from '../lib/utilities/generateEventId.js';
import EventStore from '../lib/index.js';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('gRPC Client - Cluster', () => {
	it('Write and read events using gossip seeds', async function () {
		this.timeout(5 * 1000);
		const config = getGRPCConfigGossipCluster();
		const client = new EventStore.GRPCClient(config);

		const events = [eventFactory.newEvent('TestEventType', { something: '456' })];
		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getEvents(testStream);
		assert.equal(evs[0].data.something, '456');

		await client.close();
	});

	it('Write and read events using DNS discovery', async function () {
		this.timeout(5 * 1000);
		const config = getGRPCConfigDNSDiscoveryCluster();
		const client = new EventStore.GRPCClient(config);

		const events = [eventFactory.newEvent('TestEventType', { something: '456' })];
		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getEvents(testStream);
		assert.equal(evs[0].data.something, '456');

		await client.close();
	});
});