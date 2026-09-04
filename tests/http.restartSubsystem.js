import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';

describe('Http Client - Restart subsystems', () => {
  it('projections.restartSubsystem should resolve', async function () {
    this.timeout(10 * 1000);
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    await client.projections.restartSubsystem();
  });

  it('persistentSubscriptions.restartSubsystem should resolve', async function () {
    this.timeout(10 * 1000);
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    await client.persistentSubscriptions.restartSubsystem();
  });
});
