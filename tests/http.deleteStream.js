import assert from 'assert';
import generateEventId from '../lib/utilities/generateEventId.js';
import getHttpConfig from './support/getHttpConfig.js';
import sleep from './utilities/sleep.js';
import KurrentDB from '../lib/index.js';

describe('Http Client - Delete stream', () => {
  it('Should return successful on stream delete', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    const testStream = `TestStream-${generateEventId()}`;

    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });
    await client.deleteStream(testStream);
    await sleep(100);
    assert.equal(await client.checkStreamExists(testStream), false);
  });

  it('Should return successful on projected stream delete', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    const testStream = `TestDeletedStream-${generateEventId()}`;

    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });
    await sleep(150);
    await client.deleteStream(`$ce-TestDeletedStream`);
    await sleep(100);
    assert.equal(await client.checkStreamExists(`$ce-TestDeletedStream`), false);
  });

  it('Should return successful on writing to a stream that has been soft deleted', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    const testStream = `TestStream-${generateEventId()}`;

    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });
    await client.deleteStream(testStream);
    await sleep(100);
    return client.writeEvent(testStream, 'TestEventType', {
      something: '456'
    });
  });

  it('Should return successful on stream delete hard delete', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    const testStream = `TestStream-${generateEventId()}`;

    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });
    await client.deleteStream(testStream, true);

    try {
      await client.checkStreamExists(testStream);
    } catch (err) {
      assert(err.message.includes('410'), 'Expected http 410');
      return;
    }
    assert.fail('Should not have returned resolved promise');
  });

  it('Should fail when a stream does not exist', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    const testStream = `TestStream-${generateEventId()}`;

    try {
      await client.deleteStream(testStream);
    } catch (err) {
      assert(err);
      return;
    }
    assert.fail('Should have failed because stream does not exist');
  });

  it('Should return HTTP 410 when a writing to a stream that has been hard deleted', async () => {
    const client = new KurrentDB.HTTPClient(getHttpConfig());
    const testStream = `TestStream-${generateEventId()}`;

    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });
    await client.deleteStream(testStream, true);

    try {
      await client.writeEvent(testStream, 'TestEventType', {
        something: '456'
      });
    } catch (err) {
      assert.equal(410, err.response.status);
      return;
    }
    assert.fail('Should have failed because stream does not exist');
  });
});
