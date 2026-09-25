import assert from 'assert';
import https from 'https';
import getTcpConfigCustomConnectionName from './support/getTcpConfigCustomConnectionName.js';
import generateEventId from '../lib/utilities/generateEventId.js';
import getTcpConfig from './support/getTcpConfig.js';
import KurrentDB from '../lib/index.js';
import waitUntil from './utilities/waitUntil.js';

const eventFactory = new KurrentDB.EventFactory();

describe('TCP Client - Test Connection', () => {
  const writeEventsInParallel = async (client, numberOfEvents = 20) => {
    const events = [];
    for (let i = 1; i <= numberOfEvents; i++) {
      events.push(
        eventFactory.newEvent('TestEventType', {
          something: i
        })
      );
    }
    await Promise.all(events.map((ev) => client.writeEvent(`TestStream-${generateEventId()}`, ev.eventType, ev.data)));
  };

  it('Should connect and write event on correct connection properties', async () => {
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });

    await client.close();
  });

  it('Should connect and write event with custom connection name', async () => {
    const client = new KurrentDB.TCPClient(getTcpConfigCustomConnectionName());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });

    const pool = await client.getPool();
    assert.equal(1, pool._allObjects.size);

    const connection = await pool.acquire();
    assert(
      connection._connectionName.startsWith('CUSTOM_TCP_CONNECTION_NAME_'),
      `Expected connection name to start with 'CUSTOM_TCP_CONNECTION_NAME_', got '${connection._connectionName}'`
    );
    await pool.release(connection);

    await client.close();
  });

  it('Should not connect on incorrect hostname', async function () {
    this.timeout(60 * 1000);
    const config = getTcpConfig();
    config.maxReconnections = 2;
    config.hostname = '192.0.2.1';

    const client = new KurrentDB.TCPClient(config);

    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.writeEvent(testStream, 'TestEventType', {
        something: '123'
      });
      assert.fail('Should not have written event successfully');
    } catch (err) {
      assert.notEqual(err.message, 'Should not have written event successfully');
    } finally {
      await client.close();
    }
  });

  it('Should not connect on incorrect port', async function () {
    this.timeout(60 * 1000);
    const config = getTcpConfig();
    config.maxReconnections = 2;
    config.port = 9999;

    const client = new KurrentDB.TCPClient(config);

    const testStream = `TestStream-${generateEventId()}`;
    try {
      await client.writeEvent(testStream, 'TestEventType', {
        something: '123'
      });
      assert.fail('Should not have written event successfully');
    } catch (err) {
      assert.notEqual(err.message, 'Should not have written event successfully');
    } finally {
      await client.close();
    }
  });

  it('Should default to 5 connections with no pool options provided', async function () {
    this.timeout(60 * 1000);
    const config = getTcpConfig();
    delete config.poolOptions;
    config.makeConfigUniqueWithThis = new Date().getTime();
    const client = new KurrentDB.TCPClient(config);

    await writeEventsInParallel(client);

    const pool = await client.getPool();
    assert.equal(5, pool._allObjects.size);

    await client.close();
  });

  it('Should fill up pool connections to provided max', async function () {
    this.timeout(60 * 1000);
    const config = getTcpConfig();
    config.poolOptions.max = 7;
    config.makeConfigUniqueWithThis = new Date().getTime();
    const client = new KurrentDB.TCPClient(config);

    await writeEventsInParallel(client);

    const pool = await client.getPool();
    assert.equal(7, pool._allObjects.size);

    await client.close();
  });

  it('Should close pool', async function () {
    this.timeout(60 * 1000);
    const config = getTcpConfig();
    const client = new KurrentDB.TCPClient(config);

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });
    await client.close();

    try {
      await client.getPool();
      throw new Error('Connection Pool should not exist');
    } catch (err) {
      assert.equal(err.message, 'Connection Pool not found');
    }
  });

  it('Should leave the operations pool open when closing an unknown connection name', async function () {
    this.timeout(60 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;

    try {
      await client.writeEvent(testStream, 'TestEventType', { something: '123' });
      const operationsPool = await client.getPool();
      await client.close('NO_SUCH_SUBSCRIPTION_CONNECTION');

      assert.strictEqual(await client.getPool(), operationsPool, 'the operations pool must survive');
      await client.writeEvent(testStream, 'TestEventType', { something: '456' });
    } finally {
      await client.close();
    }
  });

  it('Should close all pools', async function () {
    this.timeout(60 * 1000);
    const config = getTcpConfig();
    const client = new KurrentDB.TCPClient(config);

    await client.closeAllPools();

    try {
      await client.getPool();
      throw new Error('Connection Pool should not exist');
    } catch (err) {
      assert.equal(err.message, 'Connection Pool not found');
    }
  });

  it('Should close subscription pools as well as the operations pool', async function () {
    this.timeout(30 * 1000);
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;
    const drops = [];

    try {
      await client.writeEvent(testStream, 'TestEventType', { something: '123' });
      await client.subscribeToStream(
        testStream,
        () => {},
        (_sub, reason) => drops.push(reason)
      );
      await client.subscribeToStream(
        testStream,
        () => {},
        (_sub, reason) => drops.push(reason)
      );

      await client.close();
      await waitUntil(() => drops.length === 2);
      await assert.rejects(client.getPool(), /Connection Pool not found/);
    } finally {
      await client.closeAllPools();
    }
  });

  it('Should leave the process wide HTTPS agent untouched while connections open in parallel', async function () {
    this.timeout(30 * 1000);
    const before = https.globalAgent.options.rejectUnauthorized;
    const client = new KurrentDB.TCPClient(getTcpConfig());
    const testStream = `TestStream-${generateEventId()}`;

    try {
      await Promise.all(
        [1, 2, 3, 4, 5].map((k) => client.writeEvent(testStream, 'TestEventType', { something: String(k) }))
      );
      assert.strictEqual(https.globalAgent.options.rejectUnauthorized, before);
    } finally {
      await client.close();
    }
  });
});
