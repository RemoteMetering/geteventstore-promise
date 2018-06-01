import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import eventstore from '../index';
import Promise from 'bluebird';
import { find } from 'lodash';
import assert from 'assert';
import uuid from 'uuid';

describe('TCP Client - Test Connection', () => {
	const writeEventsInParallel = async(client, numberOfEvents = 20) => {
		const events = [];
		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventstore.eventFactory.NewEvent('TestEventType', {
				something: i
			}));
		}
		await Promise.map(events, ev => client.writeEvent(`TestStream-${uuid.v4()}`, ev.eventType, ev.data));
	};

	it('Should connect and write event on correct connection properties', () => {
		const client = eventstore.tcp(tcpConfig);
		const testStream = `TestStream-${uuid.v4()}`;
		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});
	});

	it('Should not connect on incorrect hostname', function() {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		config.maxReconnections = 2;
		config.hostname = 'madetofailhostname.fakedomain.af';

		const client = eventstore.tcp(config);

		const testStream = `TestStream-${uuid.v4()}`;
		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => {
			assert.fail('Should not have written event successfully');
		}).catch(err => {
			assert.notEqual(err.message, 'Should not have written event successfully');
		});
	});

	it('Should not connect on incorrect port', function() {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		config.maxReconnections = 2;
		config.port = 9999;

		const client = eventstore.tcp(config);

		const testStream = `TestStream-${uuid.v4()}`;
		return client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		}).then(() => {
			assert.fail('Should not have written event successfully');
		}).catch(err => {
			assert.notEqual(err.message, 'Should not have written event successfully');
		});
	});

	it('Should default to only one connection with no pool options provided', async function() {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		delete config.poolOptions;
		config.makeConfigUniqueWithThis = new Date().getTime();
		const client = eventstore.tcp(config);

		await writeEventsInParallel(client);

		const pool = await client.getPool();
		assert.equal(1, pool._allObjects.size);
	});

	it('Should fill up pool connections to provided max', async function() {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		config.poolOptions.max = 7;
		config.makeConfigUniqueWithThis = new Date().getTime();
		const client = eventstore.tcp(config);

		await writeEventsInParallel(client);

		const pool = await client.getPool();
		assert.equal(7, pool._allObjects.size);
	});

	it('Should close pool', async function() {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		const client = eventstore.tcp(config);

		const testStream = `TestStream-${uuid.v4()}`;
		await client.writeEvent(testStream, 'TestEventType', {
			something: '123'
		});
		await client.close();

		let failed = false;
		try {
			const pool = await client.getPool();
			failed = true;
		} catch (err) {
			if (failed) throw new Error('Connection Pool should not exist');
			assert.equal(err.message, 'Connection Pool not found');
		}
	});

	it('Should close all pools', async function() {
		this.timeout(60 * 1000);
		const config = JSON.parse(JSON.stringify(tcpConfig));
		const client = eventstore.tcp(config);

		await client.closeAllPools();
		
		let failed = false;
		try {
			const pool = await client.getPool();
			failed = true;
		} catch (err) {
			if (failed) throw new Error('Connection Pool should not exist');
			assert.equal(err.message, 'Connection Pool not found');
		}
	});
});