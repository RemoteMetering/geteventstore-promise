import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';

describe('gRPC Client - Set stream metadata', () => {
  it('Should set metadata that reads back through getStreamMetadata', async function () {
    this.timeout(5000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.setStreamMetadata(testStream, {
      maxCount: 10,
      maxAge: 3600,
      customField: 'abc'
    });

    const result = await client.getStreamMetadata(testStream);
    assert.equal(result.streamName, testStream);
    assert.equal(result.metadata.maxCount, 10);
    assert.equal(result.metadata.maxAge, 3600);
    assert.equal(result.metadata.customField, 'abc');

    await client.close();
  });

  it('Should fail promise if no metadata provided', async function () {
    this.timeout(5000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.setStreamMetadata(testStream);
    } catch (err) {
      assert(err, 'Error expected');
      await client.close();
      return;
    }
    await client.close();
    assert.fail('Set metadata should not have succeeded');
  });
});
