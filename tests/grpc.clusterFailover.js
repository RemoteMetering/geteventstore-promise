import assert from 'assert';
import { spawn } from 'child_process';
import KurrentDB from '../lib/index.js';
import getGRPCConfigGossipCluster from './support/getGRPCConfigGossipCluster.js';
import { findLeaderContainer, isClusterSettled } from './support/clusterState.js';
import generateEventId from '../lib/utilities/generateEventId.js';
import sleep from './utilities/sleep.js';
import waitUntil from './utilities/waitUntil.js';

// Stops the leader of the shared 3 node cluster and checks that every operation family recovers on
// the same client. Reads go through the SDK's Rust bridge, which does not rediscover on its own, so
// this guards the eviction in connectionManager. The stopped node is restarted and the cluster is
// left settled, because the other cluster tests share it.
const RECOVERY_WINDOW_MS = 30 * 1000;
const SETTLE_TIMEOUT_MS = 90 * 1000;

const docker = (args) =>
  new Promise((resolve, reject) => {
    const proc = spawn('docker', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (chunk) => (stderr += chunk.toString()));
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(stderr || `docker exited ${code}`))));
  });

const describeError = (err) => `${err.constructor.name} type=${err.type}: ${err.message}`;

// Retries op until it succeeds or the window closes, keeping each distinct error for the failure report.
const retryUntilRecovered = async (op, startedAt) => {
  const errors = [];
  while (Date.now() - startedAt < RECOVERY_WINDOW_MS) {
    try {
      await op();
      return { recoveredAfterMs: Date.now() - startedAt, errors };
    } catch (err) {
      const text = describeError(err);
      if (errors[errors.length - 1]?.text !== text) errors.push({ atMs: Date.now() - startedAt, text });
      await sleep(500);
    }
  }
  return { recoveredAfterMs: null, errors };
};

describe('gRPC Client - Cluster failover', function () {
  this.timeout(3 * 60 * 1000);

  let client;
  let stoppedContainer;

  after(async function () {
    this.timeout(SETTLE_TIMEOUT_MS + 30 * 1000);
    if (client) await client.close().catch(() => {});
    if (stoppedContainer) {
      await docker(['start', stoppedContainer]);
      await waitUntil(isClusterSettled, { timeout: SETTLE_TIMEOUT_MS, interval: 500 });
    }
  });

  it('Should recover writes and reads on the same client after the leader stops', async () => {
    const stream = `Failover-${generateEventId()}`;
    client = new KurrentDB.GRPCClient(getGRPCConfigGossipCluster());
    const ops = {
      write: () => client.writeEvent(stream, 'TestEvent', { at: Date.now() }),
      readStream: () => client.getEvents(stream),
      readAll: () => client.readAllEventsForward('start', 10),
      metadata: () => client.getStreamMetadata(stream)
    };

    // Warm up every path so the client holds connections to the original leader. Leadership can
    // still move just after the cluster settles, so allow the same window as recovery.
    for (const [name, op] of Object.entries(ops)) {
      const { recoveredAfterMs, errors } = await retryUntilRecovered(op, Date.now());
      assert.notEqual(recoveredAfterMs, null, `${name} warm up failed: ${errors.map((e) => e.text).join(', ')}`);
    }

    // Read from the node logs, which report leadership the same way on 26.1 and 21.10.
    const leaderContainer = await findLeaderContainer();
    assert.ok(leaderContainer, 'could not find a single cluster leader');
    stoppedContainer = leaderContainer;
    await docker(['stop', stoppedContainer]);
    const stoppedAt = Date.now();

    const results = Object.fromEntries(
      await Promise.all(Object.entries(ops).map(async ([name, op]) => [name, await retryUntilRecovered(op, stoppedAt)]))
    );

    const notRecovered = Object.entries(results)
      .filter(([, { recoveredAfterMs }]) => recoveredAfterMs === null)
      .map(([name, { errors }]) => `${name} (${errors.map(({ atMs, text }) => `+${atMs}ms ${text}`).join(', ')})`);
    assert.deepEqual(notRecovered, [], `not recovered within ${RECOVERY_WINDOW_MS / 1000}s`);
  });
});
