import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import getTcpConfig from './support/getTcpConfig.js';
import KurrentDB from '../lib/index.js';

describe('TCP Client - Set stream metadata', () => {
  it('Should set metadata that reads back with the friendly shape', async function () {
    this.timeout(5000);
    const client = new KurrentDB.TCPClient(getTcpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    await client.setStreamMetadata(testStream, {
      maxCount: 10,
      maxAge: 3600,
      customField: 'abc'
    });

    // The TCP client has no getStreamMetadata, so read back through the gRPC
    // client on the same server node to prove the raw translation is correct.
    const grpcClient = new KurrentDB.GRPCClient(getGRPCConfig());
    const result = await grpcClient.getStreamMetadata(testStream);
    assert.equal(result.metadata.maxCount, 10);
    assert.equal(result.metadata.maxAge, 3600);
    assert.equal(result.metadata.customField, 'abc');

    await grpcClient.close();
    await client.close();
  });

  it('Should set an ACL that reads back with friendly role names', async function () {
    this.timeout(5000);
    const client = new KurrentDB.TCPClient(getTcpConfig());

    const testStream = `TestStream-${generateEventId()}`;
    const acl = {
      readRoles: ['$admins', 'reader'],
      writeRoles: ['writer'],
      deleteRoles: ['$admins'],
      metaReadRoles: ['reader'],
      metaWriteRoles: ['$admins']
    };
    await client.setStreamMetadata(testStream, { maxCount: 5, acl });

    // The TCP client has no getStreamMetadata
    const grpcClient = new KurrentDB.GRPCClient(getGRPCConfig());
    const result = await grpcClient.getStreamMetadata(testStream);
    assert.deepEqual(result.metadata.acl.readRoles, acl.readRoles);
    assert.deepEqual(result.metadata.acl.writeRoles, acl.writeRoles);
    assert.deepEqual(result.metadata.acl.deleteRoles, acl.deleteRoles);
    assert.deepEqual(result.metadata.acl.metaReadRoles, acl.metaReadRoles);
    assert.deepEqual(result.metadata.acl.metaWriteRoles, acl.metaWriteRoles);
    assert.equal(result.metadata.maxCount, 5);

    await grpcClient.close();
    await client.close();
  });

  it('Should fail promise if no metadata provided', async () => {
    const client = new KurrentDB.TCPClient(getTcpConfig());

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
