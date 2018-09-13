import './_globalHooks';

import tcpConfig from './support/tcpConfig';
import eventstore from '../index';
import assert from 'assert';
import uuid from 'uuid';

describe('TCP Client - Stress Tests', () => {
	it('Should handle parallel writes', async function() {
		this.timeout(20000);
		const client = eventstore.tcp(tcpConfig);

		const testStream = `TestStream-${uuid.v4()}`;
		const numberOfEvents = 5000;
		const events = [];

		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventstore.eventFactory.NewEvent('TestEventType', {
				something: i
			}));
		}

		await Promise.all(events.map(ev => client.writeEvent(testStream, ev.eventType, ev.data)));
		const evs = await client.getEvents(testStream, undefined, 5000);
		assert.equal(evs.length, 4096);
	});

	it('Should handle parallel reads and writes', function(callback) {
		this.timeout(60000);
		const client = eventstore.tcp(tcpConfig);

		const testStream = `TestStream-${uuid.v4()}`;
		const numberOfEvents = 5000;
		const events = [];
		let writeCount = 0;
		let readCount = 0;

		for (let i = 1; i <= numberOfEvents; i++) {
			events.push(eventstore.eventFactory.NewEvent('TestEventType', {
				something: i
			}));
		}

		const checkCounts = () => {
			if (readCount === numberOfEvents && writeCount === numberOfEvents && writeCount === readCount) callback();
		};

		events.forEach(ev => {
			client.writeEvent(testStream, ev.eventType, ev.data).then(() => {
				writeCount++;
				checkCounts();
			});
		});
		events.forEach(() => {
			client.getEvents(testStream, undefined, 10).then(() => {
				readCount++;
				checkCounts();
			});
		});
	});
});