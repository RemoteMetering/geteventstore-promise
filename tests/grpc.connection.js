import getGRPCConfigCustomConnectionName from './support/getGRPCConfigCustomConnectionName.js';
import generateEventId from '../lib/utilities/generateEventId.js';
import getGRPCConfig from './support/getGRPCConfig.js';
import KurrentDB from '../lib/index.js';
import assert from 'assert';

const eventFactory = new KurrentDB.EventFactory();

describe('gRPC Client - Test Connection', () => {
	const writeEventsInParallel = async (client, numberOfEvents = 20) => {
		const events = [];
		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent('TestEventType', {
				something: i
			}));
		}
		await Promise.all(events.map(ev => client.writeEvent(`TestStream-${generateEventId()}`, ev.eventType, ev.data)));
	};

	it('Should connect and write event on correct connection properties', async () => {
		const client = new KurrentDB.GRPCClient(getGRPCConfig());
		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		await client.close();
	});

	it('Should connect and write event with custom connection name', async function () {
		const client = new KurrentDB.GRPCClient(getGRPCConfigCustomConnectionName());

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		const pool = await client.getPool();
		assert.equal(1, pool._allObjects.size);

		const connection = await pool.acquire();
		assert(connection.connectionName.startsWith('CUSTOM_GRPC_CONNECTION_NAME_'), `Expected connection name to start with 'CUSTOM_GRPC_CONNECTION_NAME_', got '${connection.connectionName}'`);
		await pool.release(connection);

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

	it('Should default to 5 connections with no pool options provided', async function () {
		this.timeout(60 * 1000);
		const config = getGRPCConfig();
		delete config.poolOptions;
		config.makeConfigUniqueWithThis = new Date().getTime();
		const client = new KurrentDB.GRPCClient(config);

		await writeEventsInParallel(client);

		const pool = await client.getPool();
		assert.equal(5, pool._allObjects.size);

		await client.close();
	});

	it('Should fill up pool connections to provided max', async function () {
		this.timeout(60 * 1000);
		const config = getGRPCConfig();
		config.poolOptions.max = 7;
		config.makeConfigUniqueWithThis = new Date().getTime();
		const client = new KurrentDB.GRPCClient(config);

		await writeEventsInParallel(client);

		const pool = await client.getPool();
		assert.equal(7, pool._allObjects.size);

		await client.close();
	});

	it('Should close pool', async function () {
		this.timeout(60 * 1000);
		const config = getGRPCConfig();
		const client = new KurrentDB.GRPCClient(config);

		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});
		await client.close();

		let failed = false;
		try {
			await client.getPool();
			failed = true;
		} catch (err) {
			if (failed) throw new Error('Connection Pool should not exist');
			assert.equal(err.message, 'Connection Pool not found');
		}
	});

	it('Should close all pools', async function () {
		this.timeout(60 * 1000);
		const config = getGRPCConfig();
		const client = new KurrentDB.GRPCClient(config);

		await client.closeAllPools();

		let failed = false;
		try {
			await client.getPool();
			failed = true;
		} catch (err) {
			if (failed) throw new Error('Connection Pool should not exist');
			assert.equal(err.message, 'Connection Pool not found');
		}
	});
});