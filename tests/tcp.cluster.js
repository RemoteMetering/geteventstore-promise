import './_globalHooks';

import tcpConfigDNSDiscoveryCluster from './support/tcpConfigDNSDiscoveryCluster';
import tcpConfigGossipCluster from './support/tcpConfigGossipCluster';
import inMemConfig from './support/inMemEventStoreConfig';
import EventStore from '../lib';
import assert from 'assert';
import uuid from 'uuid';

const eventFactory = new EventStore.EventFactory();

if (inMemConfig.testsUseDocker) {
	describe('TCP Client - Cluster', () => {
		it('Write and read events using gossip seeds', async () => {
			const client = new EventStore.TCPClient(tcpConfigGossipCluster);

			const events = [eventFactory.newEvent('TestEventType', { something: '456' })];
			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const evs = await client.getEvents(testStream);
			assert.equal(evs[0].data.something, '456');
		});

		it('Write and read events using DNS discovery', async () => {
			const client = new EventStore.TCPClient(tcpConfigDNSDiscoveryCluster);

			const events = [eventFactory.newEvent('TestEventType', { something: '456' })];
			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const evs = await client.getEvents(testStream);
			assert.equal(evs[0].data.something, '456');
		});
	});
}