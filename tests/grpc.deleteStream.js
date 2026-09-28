import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import waitUntil from './utilities/waitUntil.js';
import KurrentDB from '../lib/index.js';

describe('gRPC Client - Delete stream', () => {
  it('Should return successful on stream delete', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.writeEvent(testStream, 'TestEventType', {
        something: '123'
      });
      try {
        await client.deleteStream(testStream);
        const exists = await client.checkStreamExists(testStream);
        assert.equal(false, exists);
      } catch (err) {
        assert.fail(err.message);
      }
    } finally {
      await client.close();
    }
  });

  it('Should return successful on projected stream delete', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestDeletedStream-${generateEventId()}`;
    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });

    // The category projection creates $ce-TestDeletedStream asynchronously, so wait for it before deleting.
    await waitUntil(async () => client.checkStreamExists(`$ce-TestDeletedStream`));
    await client.deleteStream(`$ce-TestDeletedStream`);
    assert.equal(await client.checkStreamExists(`$ce-TestDeletedStream`), false);

    await client.close();
  });

  it('Should return successful on writing to a stream that has been soft deleted', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;

    try {
      await client.writeEvent(testStream, 'TestEventType', {
        something: '123'
      });
      try {
        await client.deleteStream(testStream);
        await client.writeEvent(testStream, 'TestEventType', {
          something: '456'
        });
      } catch (err) {
        assert.fail(err.message);
      }
    } finally {
      await client.close();
    }
  });

  it('Should return successful on stream delete hard delete', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.writeEvent(testStream, 'TestEventType', {
        something: '123'
      });
      await client.deleteStream(testStream, true);

      try {
        await client.checkStreamExists(testStream);
      } catch (err) {
        assert.equal(err.type, 'stream-deleted');
        return;
      }
      assert.fail('Should not have returned resolved promise');
    } finally {
      await client.close();
    }
  });

  it('Should fail when a stream does not exist', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;

    let succeeded = false;
    try {
      await client.deleteStream(testStream);
      succeeded = true;
    } catch (err) {
      assert(err);
    } finally {
      await client.close();
    }
    assert(!succeeded, 'Should have failed because stream does not exist');
  });

  it('Should return "StreamDeletedError" when a writing to a stream that has been hard deleted', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfig());

    const testStream = `TestStream-${generateEventId()}`;

    try {
      await client.writeEvent(testStream, 'TestEventType', {
        something: '123'
      });
      await client.deleteStream(testStream, true);

      try {
        await client.writeEvent(testStream, 'TestEventType', {
          something: '456'
        });
      } catch (err) {
        assert.equal(err.type, 'stream-deleted');
        return;
      }
      assert.fail('Should have failed because stream does not exist');
    } finally {
      await client.close();
    }
  });
});
