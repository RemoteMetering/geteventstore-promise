import './_globalHooks';

import getTcpConfigDNSDiscoveryCluster from './support/getTcpConfigDNSDiscoveryCluster';
import getTcpConfigGossipCluster from './support/getTcpConfigGossipCluster';
import generateEventId from '../lib/utilities/generateEventId';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Cluster', () => {
	it('Write and read events using gossip seeds', async function () {
		this.timeout(5 * 1000);
		const client = new EventStore.TCPClient(getTcpConfigGossipCluster());

		const events = [eventFactory.newEvent('TestEventType', { something: '456' })];
		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getEvents(testStream);
		assert.equal(evs[0].data.something, '456');

		await client.close();
	});

	it('Write and read events using DNS discovery', async function () {
		this.timeout(5 * 1000);
		const client = new EventStore.TCPClient(getTcpConfigDNSDiscoveryCluster());

		const events = [eventFactory.newEvent('TestEventType', { something: '456' })];
		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvents(testStream, events);

		const evs = await client.getEvents(testStream);
		assert.equal(evs[0].data.something, '456');

		await client.close();
	});
});