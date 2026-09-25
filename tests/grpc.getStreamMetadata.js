import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';

describe('gRPC Client - Get steam metadata', () => {
  it('Should return stream metadata', async function () {
    this.timeout(5000);
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });
    const streamMetadata = await client.getStreamMetadata(testStream);
    assert.equal(streamMetadata.streamName, testStream);

    await client.close();
  });
});
