import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';

describe('gRPC Client - Restart subsystems', () => {
  it('projections.restartSubsystem should resolve', async function () {
    this.timeout(10 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    await client.projections.restartSubsystem();

    await client.close();
  });

  it('persistentSubscriptions.restartSubsystem should resolve', async function () {
    this.timeout(10 * 1000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    await client.persistentSubscriptions.restartSubsystem();

    await client.close();
  });
});
