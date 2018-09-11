import './_globalHooks';

import tcpConfigDNSDiscoveryCluster from './support/tcpConfigDNSDiscoveryCluster';
import tcpConfigGossipCluster from './support/tcpConfigGossipCluster';
import inMemConfig from './support/inMemEventStoreConfig';
import eventstore from '../index';
import assert from 'assert';
import uuid from 'uuid';

if (inMemConfig.testsUseDocker) {
	describe('TCP Client - Cluster', () => {
		it('Write and read events using gossip seeds', async () => {
			const client = eventstore.tcp(tcpConfigGossipCluster);

			const events = [eventstore.eventFactory.NewEvent('TestEventType', { something: '456' })];
			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const evs = await client.getEvents(testStream);
			assert.equal(evs[0].data.something, '456');
		});

		it('Write and read events using DNS discovery', async () => {
			const client = eventstore.tcp(tcpConfigDNSDiscoveryCluster);

			const events = [eventstore.eventFactory.NewEvent('TestEventType', { something: '456' })];
			const testStream = `TestStream-${uuid.v4()}`;
			await client.writeEvents(testStream, events);

			const evs = await client.getEvents(testStream);
			assert.equal(evs[0].data.something, '456');
		});
	});
}