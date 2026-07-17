import assert from 'assert';
import getGRPCConfigCustomConnectionName from './support/getGRPCConfigCustomConnectionName.js';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Test Connection', () => {
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
    const client = new KurrentDB.GRPCClient(getGRPCConfig());
    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });

    await client.close();
  });

  it('Should connect and write event with custom connection name', async () => {
    const client = new KurrentDB.GRPCClient(getGRPCConfigCustomConnectionName());

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });

    const connection = await client.getConnection();
    assert(
      connection.connectionName.startsWith('CUSTOM_GRPC_CONNECTION_NAME_'),
      `Expected connection name to start with 'CUSTOM_GRPC_CONNECTION_NAME_', got '${connection.connectionName}'`
    );

    await client.close();
  });

  it('Should not connect on incorrect hostname', async function () {
    this.timeout(60 * 1000);
    const config = getGRPCConfig();
    config.maxReconnections = 2;
    config.hostname = 'madetofailhostname.fakedomain.af';

    const client = new KurrentDB.GRPCClient(config);

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
    const config = getGRPCConfig();
    config.maxReconnections = 2;
    config.port = 9999;

    const client = new KurrentDB.GRPCClient(config);

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

  it('Should share a single multiplexed connection across parallel operations', async function () {
    this.timeout(60 * 1000);
    const config = getGRPCConfig();
    config.makeConfigUniqueWithThis = new Date().getTime();
    const client = new KurrentDB.GRPCClient(config);

    await writeEventsInParallel(client);

    const connection = await client.getConnection();
    const connectionAgain = await client.getConnection();
    assert.strictEqual(connection, connectionAgain);

    await client.close();
  });

  it('Should close connection', async function () {
    this.timeout(60 * 1000);
    const config = getGRPCConfig();
    const client = new KurrentDB.GRPCClient(config);

    const testStream = `TestStream-${generateEventId()}`;
    await client.writeEvent(testStream, 'TestEventType', {
      something: '123'
    });
    await client.close();

    try {
      await client.getConnection();
      throw new Error('Connection should not exist');
    } catch (err) {
      assert.equal(err.message, 'Connection not found');
    }
  });

  it('Should close all connections', async function () {
    this.timeout(60 * 1000);
    const config = getGRPCConfig();
    const client = new KurrentDB.GRPCClient(config);

    await client.closeAllConnections();

    try {
      await client.getConnection();
      throw new Error('Connection should not exist');
    } catch (err) {
      assert.equal(err.message, 'Connection not found');
    }
  });
});
