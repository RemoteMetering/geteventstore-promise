import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import getHttpConfig from './support/getHttpConfig.js';
import KurrentDB from '../lib/index.js';

describe('Http Client - Set stream metadata', () => {
  it('Should set metadata that reads back with the friendly shape', async function () {
    this.timeout(5000);
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.setStreamMetadata(testStream, {
      maxCount: 10,
      maxAge: 3600,
      customField: 'abc'
    });

    // The HTTP client has no getStreamMetadata, so read back through the gRPC
    // client on the same server node to prove the raw translation is correct.
    const grpcClient = new KurrentDB.GRPCClient(getGRPCConfig());
    const result = await grpcClient.getStreamMetadata(testStream);
    assert.equal(result.metadata.maxCount, 10);
    assert.equal(result.metadata.maxAge, 3600);
    assert.equal(result.metadata.customField, 'abc');

    await grpcClient.close();
  });

  it('Should set an ACL that reads back with friendly role names', async function () {
    this.timeout(5000);
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    const acl = {
      readRoles: ['$admins', 'reader'],
      writeRoles: ['writer'],
      deleteRoles: ['$admins'],
      metaReadRoles: ['reader'],
      metaWriteRoles: ['$admins']
    };
    await client.setStreamMetadata(testStream, { maxCount: 5, acl });

    // The HTTP client has no getStreamMetadata
    const grpcClient = new KurrentDB.GRPCClient(getGRPCConfig());
    const result = await grpcClient.getStreamMetadata(testStream);
    assert.deepEqual(result.metadata.acl.readRoles, acl.readRoles);
    assert.deepEqual(result.metadata.acl.writeRoles, acl.writeRoles);
    assert.deepEqual(result.metadata.acl.deleteRoles, acl.deleteRoles);
    assert.deepEqual(result.metadata.acl.metaReadRoles, acl.metaReadRoles);
    assert.deepEqual(result.metadata.acl.metaWriteRoles, acl.metaWriteRoles);
    assert.equal(result.metadata.maxCount, 5);

    await grpcClient.close();
  });

  it('Should fail promise if no metadata provided', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.setStreamMetadata(testStream);
    } catch (err) {
      assert(err, 'Error expected');
      return;
    }
    assert.fail('Set metadata should not have succeeded');
  });
});
