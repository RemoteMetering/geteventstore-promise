import generateEventId from '../lib/utilities/generateEventId.js';
import getTcpConfig from './support/getTcpConfig.js';
import KurrentDB from '../lib/index.js';
import assert from 'assert';

const eventFactory = new KurrentDB.EventFactory();

describe('TCP Client - Stress Tests', () => {
	it('Should handle parallel writes', async function () {
		this.timeout(20000);
		const client = new KurrentDB.TCPClient(getTcpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		const numberOfEvents = 5000;
		const events = [];

		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent('TestEventType', {
				something: i
			}));
		}

		await Promise.all(events.map(ev => client.writeEvent(testStream, ev.eventType, ev.data)));
		const evs = await client.getEvents(testStream, undefined, 5000);
		assert.equal(evs.length, 4096);

		await client.close();
	});

	it('Should handle parallel reads and writes', async function () {
		this.timeout(60000);
		const client = new KurrentDB.TCPClient(getTcpConfig());

		const testStream = `TestStream-${generateEventId()}`;
		const numberOfEvents = 5000;
		const events = [];
		let writeCount = 0;
		let readCount = 0;

		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventFactory.newEvent('TestEventType', {
				something: i
			}));
		}

		const writes = events.map(async ev => {
			await client.writeEvent(testStream, ev.eventType, ev.data);
			writeCount++;
		});
		const reads = events.map(async () => {
			await client.getEvents(testStream, undefined, 10);
			readCount++;
		});

		await Promise.all([...writes, ...reads]);

		assert.equal(numberOfEvents, writeCount);
		assert.equal(numberOfEvents, readCount);

		await client.close();
	});
});