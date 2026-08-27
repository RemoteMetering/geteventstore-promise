import assert from 'assert';
import getGRPCConfigDNSDiscoveryCluster from './support/getGRPCConfigDNSDiscoveryCluster.js';
import getGRPCConfigGossipCluster from './support/getGRPCConfigGossipCluster.js';
import generateEventId from '../lib/utilities/generateEventId.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

// A cluster call that reaches a node which has just stopped being leader fails with NotLeaderError.
// The SDK repoints its channel at the new leader before throwing, so the caller is expected to
// retry, and the retry lands on the leader. Leadership moves while a freshly started cluster
// settles, so every cluster call here goes through this.
const retryOnNotLeader = async (operation) => {
  try {
    return await operation();
  } catch (err) {
    if (err.type !== 'not-leader') throw err;
    return operation();
  }
};

describe('gRPC Client - Cluster', () => {
  it('Write and read events using gossip seeds', async function () {
    this.timeout(5 * 1000);
    const config = getGRPCConfigGossipCluster();
    const client = new KurrentDB.GRPCClient(config);

    const events = [eventFactory.newEvent('TestEventType', { something: '456' })];
    const testStream = `TestStream-${generateEventId()}`;
    await retryOnNotLeader(() => client.writeEvents(testStream, events));

    const evs = await retryOnNotLeader(() => client.getEvents(testStream));
    assert.equal(evs[0].data.something, '456');

    await client.close();
  });

  it('Write and read events using DNS discovery', async function () {
    this.timeout(5 * 1000);
    const config = getGRPCConfigDNSDiscoveryCluster();
    const client = new KurrentDB.GRPCClient(config);

    const events = [eventFactory.newEvent('TestEventType', { something: '456' })];
    const testStream = `TestStream-${generateEventId()}`;
    await retryOnNotLeader(() => client.writeEvents(testStream, events));

    const evs = await retryOnNotLeader(() => client.getEvents(testStream));
    assert.equal(evs[0].data.something, '456');

    await client.close();
  });
});
