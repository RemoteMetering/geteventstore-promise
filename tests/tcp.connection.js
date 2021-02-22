import './_globalHooks';

import generateEventId from '../lib/utilities/generateEventId';
import tcpConfig from './support/tcpConfig';
import EventStore from '../lib';
import assert from 'assert';

const eventFactory = new EventStore.EventFactory();

describe('TCP Client - Test Connection', () => {
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
		const client = new EventStore.TCPClient(tcpConfig);
		const testStream = `TestStream-${generateEventId()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});

		await client.close();
	});

	it('Should not connect on incorrect hostname', function () {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		config.maxReconnections = 2;
		config.hostname = 'madetofailhostname.fakedomain.af';

		const client = new EventStore.TCPClient(config);

		const testStream = `TestStream-${generateEventId()}`;
		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => {
			assert.fail('Should not have written event successfully');
		}).catch(err => {
			assert.notEqual(err.message, 'Should not have written event successfully');
		}).finally(() => client.close());
	});

	it('Should not connect on incorrect port', function () {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		config.maxReconnections = 2;
		config.port = 9999;

		const client = new EventStore.TCPClient(config);

		const testStream = `TestStream-${generateEventId()}`;
		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => {
			assert.fail('Should not have written event successfully');
		}).catch(err => {
			assert.notEqual(err.message, 'Should not have written event successfully');
		}).finally(() => client.close());
	});

	it('Should default to only one connection with no pool options provided', async function () {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		delete config.poolOptions;
		config.makeConfigUniqueWithThis = new Date().getTime();
		const client = new EventStore.TCPClient(config);

		await writeEventsInParallel(client);

		const pool = await client.getPool();
		assert.equal(1, pool._allObjects.size);

		await client.close();
	});

	it('Should fill up pool connections to provided max', async function () {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		config.poolOptions.max = 7;
		config.makeConfigUniqueWithThis = new Date().getTime();
		const client = new EventStore.TCPClient(config);

		await writeEventsInParallel(client);

		const pool = await client.getPool();
		assert.equal(7, pool._allObjects.size);

		await client.close();
	});

	it('Should close pool', async function () {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		const client = new EventStore.TCPClient(config);

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
		const config = JSON.parse(JSON.stringify(tcpConfig));
		const client = new EventStore.TCPClient(config);

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